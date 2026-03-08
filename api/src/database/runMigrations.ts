import { pool } from '../shared/config/database';
import fs from 'fs';
import path from 'path';

// Exported function — used by server.ts on startup (does NOT close pool)
export async function runMigrationsOnStartup(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('[Migrations] Directorio de migraciones no encontrado, saltando.');
    return;
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  console.log(`[Migrations] Aplicando ${files.length} migraciones...`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    try {
      await pool.query(sql);
      console.log(`[Migrations] OK: ${file}`);
    } catch (error: any) {
      if (
        error.message.includes('already exists') ||
        error.code === '42P07' ||
        error.code === '42710'
      ) {
        // Silently skip — idempotent
      } else {
        console.error(`[Migrations] Error en ${file}:`, error.message);
      }
    }
  }

  console.log('[Migrations] Completado');
}

// CLI standalone script (npm run migrate:ts) — closes pool after
async function runMigrationsCLI(): Promise<void> {
  await runMigrationsOnStartup();
  await pool.end();
}

runMigrationsCLI().catch(console.error);
