import { Pool } from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de la conexión a PostgreSQL
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'antucrm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  // Configuración adicional para producción
  ...(process.env.NODE_ENV === 'production' && {
    ssl: {
      rejectUnauthorized: false
    }
  }),
  max: 20, // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Crear el pool de conexiones
export const pool = new Pool(poolConfig);

// Helper para ejecutar queries
export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};

// Eventos del pool
pool.on('connect', () => {
  console.log('[Database] Nueva conexión establecida');
});

pool.on('error', (err) => {
  console.error('[Database] Error inesperado en el pool:', err);
});

// Función para verificar la conexión
export const checkConnection = async (): Promise<boolean> => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('[Database] Conexión exitosa:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('[Database] Error de conexión:', error);
    return false;
  }
};

export default db;
