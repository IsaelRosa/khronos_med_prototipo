const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { Client } = require('pg');
const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config({ quiet: true });

test('patient, appointment and draft persist in an isolated PostgreSQL database', async () => {
  const admin = new Client({ connectionString: process.env.DATABASE_URL });
  const name = `khronos_flow_test_${randomUUID().replace(/-/g, '')}`;
  let created = false;
  let db;
  let pool;
  let server;
  try {
    await admin.connect();
    await admin.query(`CREATE DATABASE "${name}"`);
    created = true;
    const url = new URL(process.env.DATABASE_URL);
    url.pathname = `/${name}`;
    process.env.DATABASE_URL = url.toString();
    process.env.JWT_SECRET = randomUUID();
    db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    await db.query(await readFile(path.join(__dirname, '..', 'schema.sql'), 'utf8'));

    require('ts-node/register');
    pool = require('../src/config/database').default;
    const app = express();
    app.use(express.json());
    app.use('/api/patients', require('../src/routes/patients').default);
    app.use('/api/appointments', require('../src/routes/appointments').default);
    app.use('/api/soap', require('../src/routes/soap').default);
    server = await new Promise(resolve => {
      const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });

    const doctor = (await db.query(
      "INSERT INTO users (email, password, name, role) VALUES ('flow@example.invalid', 'test', 'Profissional de teste', 'medico') RETURNING id"
    )).rows[0].id;
    const token = jwt.sign({ id: doctor, role: 'medico' }, process.env.JWT_SECRET);
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const request = async (method, endpoint, body) => {
      const response = await fetch(`${base}${endpoint}`, {
        method, headers, ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const value = await response.json();
      assert.ok(response.ok, `${method} ${endpoint}: ${response.status} ${JSON.stringify(value)}`);
      return value;
    };

    const patient = await request('POST', '/patients', {
      name: 'Paciente de teste', cpf: '00000000000', email: 'patient@example.invalid',
      birth: '1990-05-15', allergies: [], medications: [],
    });
    assert.equal((await request('GET', `/patients/${patient.id}`)).id, patient.id);
    const appointment = await request('POST', '/appointments', {
      patient_id: patient.id, professional_id: doctor, unit_id: 'teste',
      date: '2035-02-01', start_time: '10:00', end_time: '10:30', type: 'consulta',
    });
    assert.equal((await request('GET', `/appointments/${appointment.id}`)).date, '2035-02-01');
    await request('POST', `/appointments/${appointment.id}/start`);
    const fields = {
      queixa: 'Queixa de teste', hda: '', antecedentes: '', medicamentos: '', alergias: '', habitos: '',
      pa: '', fc: '', fr: '', temp: '', spo2: '', peso: '', altura: '',
      subjetivo: '', objetivo: '', avaliacao: '', plano: 'Plano inicial', hipotese: '',
      diagnostico: '', conduta: '', retorno: '',
    };
    const draft = await request('PUT', `/soap/appointment/${appointment.id}/draft`, {
      ...fields, expectedVersion: null,
    });
    const updated = await request('PUT', `/soap/appointment/${appointment.id}/draft`, {
      ...fields, plano: 'Plano atualizado', expectedVersion: draft.version,
    });
    assert.equal(updated.id, draft.id);
    assert.notEqual(updated.version, draft.version);
    const reopened = await request('GET', `/soap/appointment/${appointment.id}`);
    assert.equal(reopened.plano, 'Plano atualizado');
    assert.equal(reopened.patient_id, patient.id);
    assert.equal(reopened.professional_id, doctor);
    assert.equal(reopened.signed, false);
    const notes = await request('GET', `/soap/patient/${patient.id}`);
    assert.equal(notes.length, 1);
    assert.equal(notes[0].id, draft.id);
    assert.equal((await request('GET', `/appointments/patient/${patient.id}`))[0].id, appointment.id);

    const independent = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await independent.connect();
      const persisted = await independent.query('SELECT plano, signed FROM soap_notes WHERE id = $1', [draft.id]);
      assert.deepEqual(persisted.rows[0], { plano: 'Plano atualizado', signed: false });
      const audit = await independent.query('SELECT action FROM audit_logs WHERE entity_id = $1 ORDER BY created_at', [draft.id]);
      assert.deepEqual(audit.rows.map(row => row.action), ['CREATE', 'UPDATE']);
    } finally {
      await independent.end();
    }
  } finally {
    if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    if (pool) await pool.end();
    if (db) await db.end();
    if (created) await admin.query(`DROP DATABASE "${name}"`);
    await admin.end();
  }
});
