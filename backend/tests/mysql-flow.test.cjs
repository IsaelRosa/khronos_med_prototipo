const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const express = require('express');
require('ts-node/register');

test('MySQL authentication and clinical flows in an isolated database', async () => {
  if (!process.env.MYSQL_DATABASE_URL) throw new Error('Configure um banco MySQL de teste isolado.');
  process.env.DB_DRIVER = 'mysql';
  process.env.JWT_SECRET = 'isolated-mysql-test-secret-with-extra-length';
  const { getPool } = require('../src/mysql/database');
  const db = getPool();
  let server;
  try {
    const [existing] = await db.query('SHOW TABLES');
    assert.equal(existing.length, 0, 'O banco de teste deve estar vazio.');
    const schema = await readFile(path.join(__dirname, '..', 'schema.mysql.sql'), 'utf8');
    for (const statement of schema.split(';').map(part => part.trim()).filter(Boolean)) await db.query(statement);

    const app = express();
    app.use(express.json());
    app.use('/auth', require('../src/routes/auth').default);
    app.use('/patients', require('../src/routes/patients').default);
    app.use('/appointments', require('../src/routes/appointments').default);
    app.use('/soap', require('../src/routes/soap').default);
    app.use('/prescriptions', require('../src/routes/prescriptions').default);
    app.use('/exams', require('../src/routes/exams').default);
    server = await new Promise(resolve => {
      const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    const send = async (method, endpoint, body, token) => {
      const response = await fetch(`${base}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, body: await response.json() };
    };

    const credentials = { email: 'teste@example.invalid', password: 'senha-de-teste', name: 'Teste', role: 'admin' };
    const registered = await send('POST', '/auth/register', credentials);
    assert.equal(registered.status, 201);
    assert.equal((await send('POST', '/auth/login', { ...credentials, password: 'incorreta' })).status, 401);
    const loggedIn = await send('POST', '/auth/login', credentials);
    assert.equal(loggedIn.status, 200);
    const token = loggedIn.body.token;
    assert.equal((await send('GET', '/auth/profile', null, token)).body.id, registered.body.user.id);
    assert.equal((await send('GET', '/patients')).status, 401);

    const created = await send('POST', '/patients', {
      name: 'Paciente de teste', cpf: '00000000000', email: 'paciente@example.invalid',
      birth: '1990-05-15', allergies: ['teste'], medications: [],
    }, token);
    assert.equal(created.status, 201);
    assert.equal(created.body.birth, '1990-05-15');
    assert.deepEqual(created.body.allergies, ['teste']);
    const id = created.body.id;
    assert.equal((await send('GET', `/patients/${id}`, null, token)).body.name, 'Paciente de teste');
    assert.equal((await send('GET', '/patients/search?q=Paciente', null, token)).body.length, 1);
    assert.equal((await send('PUT', `/patients/${id}`, { name: 'Paciente atualizado' }, token)).body.name, 'Paciente atualizado');
    assert.equal((await send('GET', '/patients', null, token)).body.length, 1);
    const doctor = await send('POST', '/auth/register', {
      email: 'medico@example.invalid', password: 'senha-de-teste', name: 'Médico de teste', role: 'medico',
    });
    const originalNodeEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const newUser = { email: 'novo@example.invalid', password: 'senha-de-teste', name: 'Novo', role: 'medico' };
      assert.equal((await send('POST', '/auth/register', newUser)).status, 401);
      assert.equal((await send('POST', '/auth/register', newUser, doctor.body.token)).status, 403);
      assert.equal((await send('POST', '/auth/register', newUser, token)).status, 201);
    } finally {
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
    }
    assert.ok((await send('GET', '/appointments/professionals', null, token)).body.some(item => item.id === doctor.body.user.id));
    const booking = {
      patient_id: id, professional_id: doctor.body.user.id, date: '2035-02-01',
      start_time: '10:00', end_time: '10:30', type: 'consulta',
    };
    const attempts = await Promise.all([
      send('POST', '/appointments', booking, token),
      send('POST', '/appointments', booking, token),
    ]);
    assert.deepEqual(attempts.map(result => result.status).sort(), [201, 409]);
    const appointment = attempts.find(result => result.status === 201).body;
    assert.equal(appointment.date, '2035-02-01');
    const adjacent = await send('POST', '/appointments', { ...booking, start_time: '10:30', end_time: '11:00' }, token);
    assert.equal(adjacent.status, 201);
    assert.equal((await send('PUT', `/appointments/${adjacent.body.id}`, { start_time: '10:15' }, token)).status, 409);
    assert.equal((await send('POST', `/appointments/${appointment.id}/start`, null, token)).body.status, 'em_atendimento');
    assert.equal((await send('GET', '/appointments/range?start_date=2035-02-01&end_date=2035-02-01', null, token)).body.length, 2);
    const fields = {
      queixa: 'Teste', hda: '', antecedentes: '', medicamentos: '', alergias: '', habitos: '',
      pa: '', fc: '', fr: '', temp: '', spo2: '', peso: '', altura: '',
      subjetivo: '', objetivo: '', avaliacao: '', plano: '', hipotese: '',
      diagnostico: '', conduta: '', retorno: '',
    };
    const draftUrl = `/soap/appointment/${appointment.id}/draft`;
    const draft = await send('PUT', draftUrl, { ...fields, expectedVersion: null }, doctor.body.token);
    assert.equal(draft.status, 201);
    assert.equal(draft.body.signed, false);
    const edits = await Promise.all([
      send('PUT', draftUrl, { ...fields, plano: 'Primeiro', expectedVersion: draft.body.version }, doctor.body.token),
      send('PUT', draftUrl, { ...fields, plano: 'Segundo', expectedVersion: draft.body.version }, doctor.body.token),
    ]);
    assert.deepEqual(edits.map(result => result.status).sort(), [200, 409]);
    const updatedDraft = edits.find(result => result.status === 200).body;
    assert.notEqual(updatedDraft.version, draft.body.version);
    await db.query("CREATE TRIGGER test_fail_audit BEFORE INSERT ON audit_logs FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'simulated audit failure'");
    try {
      assert.equal((await send('PUT', draftUrl, {
        ...fields, plano: 'Não deve persistir', expectedVersion: updatedDraft.version,
      }, doctor.body.token)).status, 500);
    } finally {
      await db.query('DROP TRIGGER test_fail_audit');
    }
    const reopened = (await send('GET', `/soap/appointment/${appointment.id}`, null, token)).body;
    assert.equal(reopened.id, draft.body.id);
    assert.equal(reopened.version, updatedDraft.version);
    assert.equal(reopened.plano, updatedDraft.plano);
    assert.equal((await send('GET', `/soap/patient/${id}`, null, token)).body.length, 1);
    assert.equal((await send('POST', `/soap/${draft.body.id}/sign`, null, doctor.body.token)).status, 501);
    const [audit] = await db.query('SELECT action FROM audit_logs WHERE entity_id = ? ORDER BY created_at', [draft.body.id]);
    assert.deepEqual(audit.map(row => row.action), ['CREATE', 'UPDATE']);
    const prescription = await send('POST', '/prescriptions', {
      patient_id: id, professional_id: doctor.body.user.id, soap_note_id: draft.body.id,
      date: '2035-02-01', valid_from: '2035-02-01', items: [{ medication: 'Teste' }],
    }, token);
    assert.equal(prescription.status, 201);
    assert.equal((await send('GET', `/prescriptions/patient/${id}`, null, token)).body.length, 1);
    assert.deepEqual((await send('PUT', `/prescriptions/${prescription.body.id}`, {
      items: [{ medication: 'Atualizado' }],
    }, token)).body.items, [{ medication: 'Atualizado' }]);
    assert.equal((await send('PATCH', `/prescriptions/${prescription.body.id}/cancel`, null, token)).body.status, 'cancelada');
    assert.equal((await send('DELETE', `/prescriptions/${prescription.body.id}`, null, token)).status, 200);
    const exam = await send('POST', '/exams', {
      patient_id: id, professional_id: doctor.body.user.id, soap_note_id: draft.body.id,
      date: '2035-02-01', exams: [{ name: 'Teste' }], unit_id: 'unidade-teste',
    }, token);
    assert.equal(exam.status, 201);
    assert.equal((await send('GET', '/exams/unit/unidade-teste', null, token)).body.length, 1);
    assert.deepEqual((await send('PUT', `/exams/${exam.body.id}`, {
      status: 'concluido', result_data: { resultado: 'teste' },
    }, token)).body.result_data, { resultado: 'teste' });
    assert.equal((await send('PATCH', `/exams/${exam.body.id}/cancel`, null, token)).body.status, 'cancelado');
    assert.equal((await send('DELETE', `/exams/${exam.body.id}`, null, token)).status, 200);
    assert.equal((await send('DELETE', `/patients/${id}`, null, token)).status, 200);
    assert.equal((await send('GET', `/patients/${id}`, null, token)).status, 404);
  } finally {
    if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await db.end();
  }
});
