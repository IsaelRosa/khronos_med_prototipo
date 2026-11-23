import dotenv from 'dotenv';

dotenv.config();

const configured = process.env.DB_DRIVER ?? 'postgres';
if (configured !== 'postgres' && configured !== 'mysql') {
  throw new Error('DB_DRIVER deve ser postgres ou mysql.');
}

export const databaseDriver = configured;
