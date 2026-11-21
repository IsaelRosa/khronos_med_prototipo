const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
require('ts-node/register');

const pool = require('../src/config/database').default;
const { startAppointment } = require('../src/controllers/appointmentController');
const { createSOAPNote, getSOAPNoteByAppointment, getSOAPNotesByPatient, saveAppointmentDraft, signSOAPNote, updateSOAPNote, deleteSOAPNote } = require('../src/controllers/soapController');

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('attendance drafts persist without signing or losing concurrent changes', async (t) => {
  const client = await pool.connect();
  const connect = pool.connect;
  const query = pool.query;
  try {
    await client.query(`
      CREATE TEMP TABLE users (id uuid PRIMARY KEY, name text, role text);
      CREATE TEMP TABLE patients (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text, name text, cpf text,
        birth date, sex text, phone text, whatsapp text, email text, address text,
        emergency_contact text, insurance text, insurance_card text,
        allergies jsonb, medications jsonb, notes text, created_at timestamp DEFAULT now()
      );
      CREATE TEMP TABLE appointments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), patient_id uuid NOT NULL REFERENCES patients(id),
        professional_id uuid REFERENCES users(id), unit_id text, start_time time, end_time time,
        type text, specialty text, procedure text, insurance text, value numeric, payment_method text,
        notes text, telehealth_url text, status text NOT NULL, date date NOT NULL, updated_at timestamp DEFAULT now()
      );
      CREATE TEMP TABLE soap_notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id uuid NOT NULL REFERENCES patients(id),
        professional_id uuid NOT NULL REFERENCES users(id),
        appointment_id uuid,
        queixa text NOT NULL, hda text, antecedentes text, medicamentos text, alergias text, habitos text,
        pa text, fc text, fr text, temp text, spo2 text, peso text, altura text,
        subjetivo text NOT NULL, objetivo text NOT NULL, avaliacao text NOT NULL, plano text NOT NULL,
        hipotese text, diagnostico text, conduta text, retorno text,
        signed boolean DEFAULT false, signed_at timestamp,
        created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now()
      );
      CREATE TEMP TABLE audit_logs (
        user_id uuid NOT NULL REFERENCES users(id), action text NOT NULL, entity text NOT NULL, entity_id uuid
      );
    `);
    const patient = '11111111-1111-4111-8111-111111111111';
    const doctor = '22222222-2222-4222-8222-222222222222';
    const otherDoctor = '33333333-3333-4333-8333-333333333333';
    const appointment = '44444444-4444-4444-8444-444444444444';
    await client.query("INSERT INTO users VALUES ($1, 'Médico teste', 'medico'), ($2, 'Outro médico', 'medico')", [doctor, otherDoctor]);
    await client.query('INSERT INTO patients (id) VALUES ($1)', [patient]);
    await client.query("INSERT INTO appointments (id, patient_id, status, date) VALUES ($1, $2, 'agendado', '2035-02-01')", [appointment, patient]);
    pool.connect = async () => ({ query: client.query.bind(client), release() {} });
    pool.query = client.query.bind(client);

    const fields = {
      queixa: 'Teste', hda: '', antecedentes: '', medicamentos: '', alergias: '', habitos: '',
      pa: '', fc: '', fr: '', temp: '', spo2: '', peso: '', altura: '',
      subjetivo: '', objetivo: '', avaliacao: '', plano: '', hipotese: '',
      diagnostico: '', conduta: '', retorno: '',
    };
    const save = async (data, expectedVersion, userId = doctor) => {
      const res = response();
      await saveAppointmentDraft({ params: { appointmentId: appointment }, user: { id: userId }, body: { ...data, expectedVersion } }, res);
      return res;
    };
    const get = async () => {
      const res = response();
      await getSOAPNoteByAppointment({ params: { appointmentId: appointment } }, res);
      return res;
    };

    await t.test('starts only an active appointment', async () => {
      const res = response();
      await startAppointment({ params: { id: appointment } }, res);
      assert.equal(res.body.status, 'em_atendimento');
    });
    await t.test('rejects incomplete payloads and legacy creation for appointments', async () => {
      assert.equal((await save({}, null)).statusCode, 400);
      const legacy = response();
      await createSOAPNote({ user: { id: doctor }, body: { appointmentId: appointment } }, legacy);
      assert.equal(legacy.statusCode, 409);
    });
    const first = await save(fields, null);
    assert.equal(first.statusCode, 201);
    assert.equal(first.body.patient_id, patient);
    assert.equal(first.body.professional_id, doctor);
    assert.equal(first.body.signed, false);

    await t.test('loads the persisted draft and patient history', async () => {
      const found = await get();
      assert.equal(found.body.queixa, 'Teste');
      assert.equal(found.body.version, first.body.version);
      const history = response();
      await getSOAPNotesByPatient({ params: { patientId: patient } }, history);
      assert.equal(history.body.length, 1);
      assert.equal(history.body[0].professional_name, 'Médico teste');
    });
    let updated;
    await t.test('updates a draft without creating a second note', async () => {
      updated = await save({ ...fields, plano: 'Plano teste' }, first.body.version);
      assert.equal(updated.statusCode, 200);
      assert.equal(updated.body.id, first.body.id);
      assert.notEqual(updated.body.version, first.body.version);
      assert.equal(updated.body.plano, 'Plano teste');
    });
    await t.test('rejects stale drafts and changes by another author', async () => {
      assert.equal((await save(fields, first.body.version)).statusCode, 409);
      assert.equal((await save(fields, updated.body.version, otherDoctor)).statusCode, 403);
      assert.equal((await get()).body.plano, 'Plano teste');
    });
    await t.test('serves authenticated attendance and draft routes over HTTP', async () => {
      process.env.JWT_SECRET = 'isolated-test-secret';
      const app = express();
      app.use(express.json());
      app.use('/api/patients', require('../src/routes/patients').default);
      app.use('/api/appointments', require('../src/routes/appointments').default);
      app.use('/api/soap', require('../src/routes/soap').default);
      const server = await new Promise(resolve => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
      });
      try {
        const base = `http://127.0.0.1:${server.address().port}`;
        const token = jwt.sign({ id: doctor, role: 'medico' }, process.env.JWT_SECRET);
        const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        assert.equal((await fetch(`${base}/api/soap/appointment/${appointment}`)).status, 401);
        assert.equal((await fetch(`${base}/api/appointments/${appointment}/start`, { method: 'POST', headers })).status, 200);
        const response = await fetch(`${base}/api/soap/appointment/${appointment}/draft`, {
          method: 'PUT', headers,
          body: JSON.stringify({ ...fields, plano: 'Plano HTTP', expectedVersion: updated.body.version }),
        });
        assert.equal(response.status, 200);
        updated = { body: await response.json() };
        const history = await fetch(`${base}/api/soap/patient/${patient}`, { headers });
        assert.equal(history.status, 200);
        assert.equal((await history.json())[0].plano, 'Plano HTTP');

        const createPatient = await fetch(`${base}/api/patients`, {
          method: 'POST', headers,
          body: JSON.stringify({ name: 'Paciente sintético', cpf: '00000000000', email: 'teste@example.invalid', birth: '1990-05-15' }),
        });
        assert.equal(createPatient.status, 201);
        const createdPatient = await createPatient.json();
        assert.equal(createdPatient.birth, '1990-05-15');
        assert.equal(createdPatient.code, null);
        const fetchedPatient = await fetch(`${base}/api/patients/${createdPatient.id}`, { headers });
        assert.equal(fetchedPatient.status, 200);
        assert.equal((await fetchedPatient.json()).id, createdPatient.id);
        assert.equal((await fetch(`${base}/api/patients/99999999-9999-4999-8999-999999999999`, { headers })).status, 404);
        const initiallyEmpty = await fetch(`${base}/api/soap/patient/${createdPatient.id}`, { headers });
        assert.deepEqual(await initiallyEmpty.json(), []);

        const makeAppointment = async (date, unit) => {
          const result = await fetch(`${base}/api/appointments`, {
            method: 'POST', headers,
            body: JSON.stringify({
              patient_id: createdPatient.id, professional_id: doctor, unit_id: unit,
              date, start_time: '10:00', end_time: '10:30', type: 'consulta',
            }),
          });
          assert.equal(result.status, 201);
          return result.json();
        };
        const booking = await makeAppointment('2036-02-01', 'u1');
        const laterBooking = await makeAppointment('2040-03-02', 'u2');
        const appointments = await fetch(`${base}/api/appointments/patient/${createdPatient.id}`, { headers });
        assert.equal(appointments.status, 200);
        const appointmentsBody = await appointments.json();
        assert.deepEqual(appointmentsBody.map(a => a.id), [laterBooking.id, booking.id]);
        assert.equal(appointmentsBody[1].date, '2036-02-01');
        assert.equal(appointmentsBody[1].patient_id, createdPatient.id);
        assert.equal(appointmentsBody[1].professional_name, 'Médico teste');
        const otherAppointments = await fetch(`${base}/api/appointments/patient/${patient}`, { headers });
        assert.ok(!(await otherAppointments.json()).some(a => a.id === booking.id));

        const newDraft = await fetch(`${base}/api/soap/appointment/${booking.id}/draft`, {
          method: 'PUT', headers,
          body: JSON.stringify({ ...fields, plano: 'Evolução sintética', expectedVersion: null }),
        });
        assert.equal(newDraft.status, 201);
        const note = await newDraft.json();
        assert.equal(note.patient_id, createdPatient.id);
        assert.equal(note.appointment_id, booking.id);
        assert.equal(note.signed, false);
        const newHistory = await fetch(`${base}/api/soap/patient/${createdPatient.id}`, { headers });
        const newNotes = await newHistory.json();
        assert.equal(newNotes.length, 1);
        assert.equal(newNotes[0].id, note.id);
        assert.equal(newNotes[0].plano, 'Evolução sintética');
        const reopened = await fetch(`${base}/api/soap/appointment/${booking.id}`, { headers });
        assert.equal((await reopened.json()).id, note.id);
      } finally {
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      }
    });
    await t.test('rolls back the draft if audit recording fails', async (t) => {
      await client.query("ALTER TABLE audit_logs ADD CONSTRAINT reject_test_update CHECK (action <> 'UPDATE') NOT VALID");
      const errorLog = t.mock.method(console, 'error', () => {});
      try {
        assert.equal((await save({ ...fields, plano: 'Não deve persistir' }, updated.body.version)).statusCode, 500);
        assert.ok(errorLog.mock.callCount() > 0);
        const found = await get();
        assert.equal(found.body.plano, 'Plano HTTP');
        assert.equal(found.body.version, updated.body.version);
      } finally {
        await client.query('ALTER TABLE audit_logs DROP CONSTRAINT reject_test_update');
      }
    });
    await t.test('blocks legacy updates and unavailable signing', async () => {
      const edit = response();
      await updateSOAPNote({ params: { id: first.body.id }, user: { id: doctor }, body: { signed: true } }, edit);
      assert.equal(edit.statusCode, 400);
      const remove = response();
      await deleteSOAPNote({ params: { id: first.body.id }, user: { id: doctor } }, remove);
      assert.equal(remove.statusCode, 409);
      const sign = response();
      await signSOAPNote({}, sign);
      assert.equal(sign.statusCode, 501);
      assert.equal((await get()).body.signed, false);
    });
    await t.test('rejects changes to signed notes and canceled appointments', async () => {
      await client.query('UPDATE soap_notes SET signed = true WHERE id = $1', [first.body.id]);
      assert.equal((await save(fields, updated.body.version)).statusCode, 403);
      await client.query("UPDATE appointments SET status = 'cancelado' WHERE id = $1", [appointment]);
      const start = response();
      await startAppointment({ params: { id: appointment } }, start);
      assert.equal(start.statusCode, 409);
      assert.equal((await save(fields, updated.body.version)).statusCode, 409);
    });
    await t.test('rejects ambiguous existing notes', async () => {
      await client.query("UPDATE appointments SET status = 'em_atendimento' WHERE id = $1", [appointment]);
      await client.query(`INSERT INTO soap_notes (patient_id, professional_id, appointment_id, queixa, subjetivo, objetivo, avaliacao, plano)
        VALUES ($1, $2, $3, '', '', '', '', '')`, [patient, doctor, appointment]);
      assert.equal((await get()).statusCode, 409);
      assert.equal((await save(fields, null)).statusCode, 409);
    });
  } finally {
    pool.connect = connect;
    pool.query = query;
    client.release();
    await pool.end();
  }
});
