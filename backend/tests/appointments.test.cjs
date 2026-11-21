const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register');

const pool = require('../src/config/database').default;
const { createAppointment, updateAppointment, getAppointmentsByDateRange } = require('../src/controllers/appointmentController');

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('appointments are saved and overlapping bookings are rejected', async (t) => {
  const client = await pool.connect();
  const connect = pool.connect;
  const query = pool.query;
  try {
    await client.query(`
      CREATE TEMP TABLE users (id uuid PRIMARY KEY, role text);
      CREATE TEMP TABLE patients (id uuid PRIMARY KEY);
      CREATE TEMP TABLE appointments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id uuid NOT NULL REFERENCES patients(id),
        professional_id uuid NOT NULL REFERENCES users(id),
        unit_id text, date date NOT NULL, start_time time NOT NULL, end_time time NOT NULL,
        type text, specialty text, procedure text, insurance text, value numeric,
        payment_method text, notes text, telehealth_url text, status text,
        updated_at timestamp DEFAULT now()
      )
    `);
    const patient = '11111111-1111-4111-8111-111111111111';
    const professional = '22222222-2222-4222-8222-222222222222';
    await client.query("INSERT INTO users VALUES ($1, 'medico')", [professional]);
    await client.query('INSERT INTO patients VALUES ($1)', [patient]);
    pool.connect = async () => ({ query: client.query.bind(client), release() {} });
    pool.query = client.query.bind(client);

    const booking = {
      patient_id: patient, professional_id: professional, unit_id: 'u1',
      date: '2035-02-01', start_time: '09:00', end_time: '09:30', type: 'consulta',
    };
    const create = async (body) => {
      const res = response();
      await createAppointment({ body }, res);
      return res;
    };
    const update = async (id, body) => {
      const res = response();
      await updateAppointment({ params: { id }, body }, res);
      return res;
    };

    await t.test('rejects invalid time', async () => {
      assert.equal((await create({ ...booking, end_time: '09:00' })).statusCode, 400);
    });
    const first = await create(booking);
    assert.equal(first.statusCode, 201);
    assert.equal(first.body.date, booking.date);
    await t.test('lists saved bookings with a date-only value', async () => {
      const res = response();
      await getAppointmentsByDateRange({ query: { start_date: booking.date, end_date: booking.date } }, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.length, 1);
      assert.equal(res.body[0].date, booking.date);
    });
    await t.test('rejects an overlapping booking', async () => {
      assert.equal((await create({ ...booking, start_time: '09:15', end_time: '09:45' })).statusCode, 409);
    });
    await t.test('allows an adjacent booking', async () => {
      assert.equal((await create({ ...booking, start_time: '09:30', end_time: '10:00' })).statusCode, 201);
    });
    await t.test('rejects reactivating a canceled conflicting booking', async () => {
      assert.equal((await update(first.body.id, { status: 'cancelado' })).statusCode, 200);
      assert.equal((await create(booking)).statusCode, 201);
      assert.equal((await update(first.body.id, { status: 'agendado' })).statusCode, 409);
    });
  } finally {
    pool.connect = connect;
    pool.query = query;
    client.release();
    await pool.end();
  }
});
