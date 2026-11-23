const { Client, types } = require('pg');
const mysql = require('mysql2/promise');
const { isDeepStrictEqual } = require('node:util');

const tables = ['users', 'patients', 'appointments', 'soap_notes', 'prescriptions', 'exam_orders', 'audit_logs'];
const jsonColumns = new Set(['allergies', 'medications', 'anexos', 'adendos', 'items', 'exams', 'details']);

function normalized(value, type) {
  if (value == null) return null;
  if (type === 'boolean') return Boolean(value);
  if (type === 'timestamp without time zone') {
    const [date, fraction = ''] = String(value).split('.');
    return `${date}.${fraction.padEnd(6, '0')}`;
  }
  return value;
}

async function migrate(sourceUrl, destinationUrl, useTls = true) {
  if (!sourceUrl || !destinationUrl) throw new Error('Defina SOURCE_DATABASE_URL e MYSQL_DATABASE_URL.');
  const url = new URL(destinationUrl);
  if (url.protocol !== 'mysql:' || !url.hostname || !url.pathname.slice(1)) {
    throw new Error('MYSQL_DATABASE_URL deve apontar para um banco MySQL específico.');
  }

  types.setTypeParser(1082, value => value);
  types.setTypeParser(1114, value => value);
  const source = new Client({ connectionString: sourceUrl });
  let destination;
  let sourceTransaction = false;
  let destinationTransaction = false;
  try {
    await source.connect();
    destination = await mysql.createConnection({
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.slice(1)),
      dateStrings: true,
      ...(useTls ? { ssl: {} } : {}),
    });
    await source.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    sourceTransaction = true;
    await destination.beginTransaction();
    destinationTransaction = true;

    const sourceTables = await source.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
    );
    const unknown = sourceTables.rows.map(row => row.table_name).filter(name => !tables.includes(name));
    if (unknown.length) throw new Error(`Tabelas de origem não reconhecidas: ${unknown.join(', ')}.`);

    for (const table of tables) {
      const columns = await source.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position",
        [table]
      );
      if (!columns.rowCount) throw new Error(`Tabela de origem ausente: ${table}.`);
      const [targetColumns] = await destination.query(
        'SELECT COLUMN_NAME AS name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?',
        [table]
      );
      const names = new Set(targetColumns.map(column => column.name));
      const missing = columns.rows.filter(column => !names.has(column.column_name));
      if (missing.length) throw new Error(`Colunas ausentes em ${table}: ${missing.map(column => column.column_name).join(', ')}.`);
      const [[count]] = await destination.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
      if (Number(count.total) !== 0) throw new Error(`A tabela de destino ${table} não está vazia.`);
    }

    for (const table of tables) {
      const columns = (await source.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position",
        [table]
      )).rows;
      const names = columns.map(column => column.column_name);
      const pgNames = names.map(name => `"${name.replace(/"/g, '""')}"`).join(', ');
      const mysqlNames = names.map(name => `\`${name.replace(/`/g, '``')}\``).join(', ');
      let lastId = null;
      let copied = 0;
      while (true) {
        const batch = await source.query(
          `SELECT ${pgNames} FROM "${table}" WHERE ($1::uuid IS NULL OR id > $1::uuid) ORDER BY id LIMIT 250`,
          [lastId]
        );
        if (!batch.rowCount) break;
        for (const row of batch.rows) {
          const values = columns.map(column => {
            const value = row[column.column_name];
            return value != null && jsonColumns.has(column.column_name) ? JSON.stringify(value) : value;
          });
          await destination.query(
            `INSERT INTO \`${table}\` (${mysqlNames}) VALUES (${names.map(() => '?').join(', ')})`,
            values
          );
          const [saved] = await destination.query(`SELECT ${mysqlNames} FROM \`${table}\` WHERE id = ?`, [row.id]);
          if (saved.length !== 1 || columns.some(column =>
            !isDeepStrictEqual(normalized(row[column.column_name], column.data_type),
              normalized(saved[0][column.column_name], column.data_type))
          )) {
            throw new Error(`Falha na verificação de um registro da tabela ${table}.`);
          }
          copied++;
        }
        lastId = batch.rows[batch.rows.length - 1].id;
      }
      const [[count]] = await destination.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
      if (Number(count.total) !== copied) throw new Error(`Contagem inconsistente na tabela ${table}.`);
      console.log(`${table}: ${copied} registros verificados.`);
    }
    await source.query('COMMIT');
    sourceTransaction = false;
    await destination.commit();
    destinationTransaction = false;
    console.log('Cópia confirmada no banco de destino.');
  } catch (error) {
    if (destinationTransaction) await destination.rollback();
    if (sourceTransaction) await source.query('ROLLBACK');
    throw error;
  } finally {
    if (destination) await destination.end();
    await source.end();
  }
}

if (require.main === module) {
  migrate(process.env.SOURCE_DATABASE_URL, process.env.MYSQL_DATABASE_URL, process.env.MYSQL_TLS !== 'disabled')
    .catch(error => {
      console.error('Migração não concluída:', error.code ? `${error.name} (${error.code})` : error.message);
      process.exitCode = 1;
    });
}

module.exports = { migrate };
