import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Accept DATABASE_URL (DigitalOcean Managed PostgreSQL) or individual vars
const poolConfig: any = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 25000,   // cancela queries que superen 25s
      query_timeout: 25000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 25000,
      query_timeout: 25000,
      ...(process.env.NODE_ENV === 'production' && {
        ssl: { rejectUnauthorized: false },
      }),
    };

const pool = new Pool(poolConfig);

export const testConnection = async (): Promise<boolean> => {
  const client = await pool.connect();
  const result = await client.query('SELECT NOW() as now');
  client.release();
  console.log('PostgreSQL conectado:', result.rows[0].now);
  return true;
};

export const query = async (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const transaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Alias compatible con módulos TS del backend original
export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};

export { pool };
export default db;
