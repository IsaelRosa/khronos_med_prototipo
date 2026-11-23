const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { Client } = require('pg');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const express = require('express');
const { migrate } = require('../scripts/migrate-postgres-to-mysql.cjs');

test('copies and verifies all tables without modifying the source', async () => {
  const sourceUrl = process.env.TEST_PG_DATABASE_URL;
  const destinationUrl = process.env.TEST_MYSQL_DATABASE_URL;
  if (!sourceUrl || !destinationUrl) throw new Error('Configure bancos de teste isolados para PostgreSQL e MySQL.');
  const source = new Client({ connectionString: sourceUrl });
  const destination = await mysql.createConnection(destinationUrl);
  let server;
  let apiPool;
  try {
    await source.connect();
    const existing = await source.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const [existingTarget] = await destination.query('SHOW TABLES');
    assert.equal(existing.rows.length, 0, 'O banco PostgreSQL de teste deve estar vazio.');
    assert.equal(existingTarget.length, 0, 'O banco MySQL de teste deve estar vazio.');
    await source.query(await readFile(path.join(__dirname, '..', 'schema.sql'), 'utf8'));
    const schema = await readFile(path.join(__dirname, '..', 'schema.mysql.sql'), 'utf8');
    for (const statement of schema.split(';').map(part => part.trim()).filter(Boolean)) {
      await destination.query(statement);
    }

    const user = '11111111-1111-4111-8111-111111111111';
    const patient = '22222222-2222-4222-8222-222222222222';
    const appointment = '33333333-3333-4333-8333-333333333333';
    const note = '44444444-4444-4444-8444-444444444444';
    await source.query("INSERT INTO users (id,email,password,name,role) VALUES ($1,'teste@example.invalid',$2,'Teste','medico')",
      [user, await bcrypt.hash('senha-de-teste', 4)]);
    await source.query("INSERT INTO patients (id,name,cpf,email,allergies) VALUES ($1,'Paciente de teste','00000000000','teste@example.invalid',$2)", [patient, JSON.stringify(['alergia de teste'])]);
    await source.query("INSERT INTO appointments (id,patient_id,professional_id,date,start_time,end_time) VALUES ($1,$2,$3,'2035-02-01','10:00','10:30')", [appointment, patient, user]);
    await source.query("INSERT INTO soap_notes (id,patient_id,professional_id,appointment_id,queixa,subjetivo,objetivo,avaliacao,plano) VALUES ($1,$2,$3,$4,'q','s','o','a','p')", [note, patient, user, appointment]);
    await source.query("INSERT INTO prescriptions (patient_id,professional_id,soap_note_id,date,items,valid_from) VALUES ($1,$2,$3,'2035-02-01',$4,'2035-02-01')", [patient, user, note, JSON.stringify([{ name: 'teste' }])]);
    await source.query("INSERT INTO exam_orders (patient_id,professional_id,soap_note_id,date,exams) VALUES ($1,$2,$3,'2035-02-01',$4)", [patient, user, note, JSON.stringify([{ name: 'teste' }])]);
    await source.query("INSERT INTO audit_logs (user_id,action,entity,entity_id) VALUES ($1,'CREATE','SOAP_NOTE',$2)", [user, note]);

    await source.query("INSERT INTO users (id,email,password,name,role) VALUES ('99999999-9999-4999-8999-999999999999','TESTE@example.invalid','hash','Teste maiúsculo','medico')");
    await destination.query(`CREATE TRIGGER test_fail_patient_copy BEFORE INSERT ON patients
      FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'simulated migration failure'`);
    await assert.rejects(migrate(sourceUrl, destinationUrl, false), /simulated migration failure/);
    const [[afterFailure]] = await destination.query('SELECT COUNT(*) AS total FROM users');
    assert.equal(afterFailure.total, 0, 'Uma falha deve reverter a cópia inteira.');
    await destination.query('DROP TRIGGER test_fail_patient_copy');

    await migrate(sourceUrl, destinationUrl, false);
    const [saved] = await destination.query('SELECT id, name FROM patients WHERE id = ?', [patient]);
    assert.equal(saved[0].name, 'Paciente de teste');
    await assert.rejects(migrate(sourceUrl, destinationUrl, false), /não está vazia/);
    assert.equal((await source.query('SELECT COUNT(*) FROM users')).rows[0].count, '2');
    assert.equal((await source.query('SELECT COUNT(*) FROM patients')).rows[0].count, '1');

    process.env.DB_DRIVER = 'mysql';
    process.env.MYSQL_DATABASE_URL = destinationUrl;
    process.env.JWT_SECRET = 'isolated-migration-test-secret';
    require('ts-node/register');
    apiPool = require('../src/mysql/database').getPool();
    const app = express();
    app.use(express.json());
    app.use('/auth', require('../src/routes/auth').default);
    app.use('/patients', require('../src/routes/patients').default);
    app.use('/soap', require('../src/routes/soap').default);
    server = await new Promise(resolve => {
      const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    const login = await fetch(`${base}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teste@example.invalid', password: 'senha-de-teste' }),
    });
    assert.equal(login.status, 200);
    const headers = { Authorization: `Bearer ${(await login.json()).token}` };
    const wrongCaseLogin = await fetch(`${base}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'TESTE@example.invalid', password: 'senha-de-teste' }),
    });
    assert.equal(wrongCaseLogin.status, 401);
    const migratedPatient = await fetch(`${base}/patients/${patient}`, { headers });
    assert.equal((await migratedPatient.json()).id, patient);
    const migratedNote = await fetch(`${base}/soap/appointment/${appointment}`, { headers });
    const noteBody = await migratedNote.json();
    assert.equal(noteBody.id, note);
    assert.equal(noteBody.signed, false);
    assert.equal(noteBody.version, '1');
  } finally {
    if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    if (apiPool) await apiPool.end();
    await source.end();
    await destination.end();
  }
});
