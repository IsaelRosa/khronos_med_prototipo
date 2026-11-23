import mysql, { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

type Executor = Pool | PoolConnection;
export type Row = RowDataPacket & Record<string, unknown>;

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.MYSQL_DATABASE_URL;
    if (!connectionString) throw new Error('MYSQL_DATABASE_URL não configurada.');
    const url = new URL(connectionString);
    if (url.protocol !== 'mysql:' || !url.hostname || !url.pathname.slice(1)) {
      throw new Error('MYSQL_DATABASE_URL deve apontar para um banco MySQL.');
    }
    if (url.search || url.hash) throw new Error('Configure TLS usando MYSQL_SSL, não parâmetros na URL.');
    if (process.env.MYSQL_SSL && !['true', 'false'].includes(process.env.MYSQL_SSL)) {
      throw new Error('MYSQL_SSL deve ser true ou false.');
    }
    pool = mysql.createPool({
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.slice(1)),
      dateStrings: ['DATE'],
      timezone: 'Z',
      supportBigNumbers: true,
      bigNumberStrings: true,
      ...(process.env.MYSQL_SSL === 'true' ? { ssl: {} } : {}),
    });
  }
  return pool;
}

function parameters(values: unknown[]) {
  return values.map(value => {
    if (value == null) return null;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ||
        typeof value === 'bigint' || value instanceof Date || value instanceof Uint8Array) return value;
    throw new TypeError('Parâmetro inválido para consulta ao MySQL.');
  });
}

export async function rows<T extends Row>(db: Executor, sql: string, values: unknown[] = []): Promise<T[]> {
  const [result] = await db.execute<T[]>(sql, parameters(values));
  return result;
}

export async function write(db: Executor, sql: string, values: unknown[] = []): Promise<ResultSetHeader> {
  const [result] = await db.execute<ResultSetHeader>(sql, parameters(values));
  return result;
}

export function logError(message: string, error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
    ? error.code : undefined;
  console.error(message, { name: error instanceof Error ? error.name : typeof error, code });
}

export async function transaction<T>(work: (db: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    try {
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    connection.release();
  }
}

export async function updateAndFetch(table: 'prescriptions' | 'exam_orders', changes: string, values: unknown[], id: unknown) {
  return transaction(async db => {
    const result = await write(db, `UPDATE ${table} SET ${changes}, updated_at = NOW(6) WHERE id = ?`, [...values, id]);
    return result.affectedRows ? (await rows<Row>(db, `SELECT * FROM ${table} WHERE id = ?`, [id]))[0] : null;
  });
}
