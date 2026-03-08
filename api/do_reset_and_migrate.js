/**
 * RESET + MIGRATE — DigitalOcean Managed PostgreSQL
 * 1. Drops ALL existing tables (CASCADE)
 * 2. Drops ALL existing enums/types
 * 3. Applies AntuCRM raw-SQL schema (01_schema + 02_seed + 001-031 migrations)
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const CLIENT_CFG = {
  host: 'db-postgresql-nyc3-73607-do-user-33546359-0.f.db.ondigitalocean.com',
  port: 25060,
  database: 'defaultdb',
  user: 'doadmin',
  password: 'AVNS_iugnjJCCSBs5S3dI4Kp',
  ssl: { rejectUnauthorized: false }
};

const PROJECT = path.join(__dirname, '..');

const SCHEMA_FILES = [
  { label: 'BASE SCHEMA', file: path.join(PROJECT, 'init-db/01_schema.sql') },
  { label: 'BASE SEED',   file: path.join(PROJECT, 'init-db/02_seed.sql') },
];

const migrDir = path.join(__dirname, 'src/database/migrations');
const migFiles = fs.readdirSync(migrDir)
  .filter(f => f.endsWith('.sql'))
  .sort()
  .map(f => ({ label: f, file: path.join(migrDir, f) }));

const ALL = [...SCHEMA_FILES, ...migFiles];

// ── SQL splitter (handles $$ dollar-quoting) ──────────────────────────────────
function splitStatements(sql) {
  const stmts = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let i = 0;

  while (i < sql.length) {
    if (!inDollarQuote) {
      const m = sql.slice(i).match(/^(\$[^$]*\$)/);
      if (m) { inDollarQuote = true; dollarTag = m[1]; current += dollarTag; i += dollarTag.length; continue; }
    } else if (sql.slice(i).startsWith(dollarTag)) {
      current += dollarTag; i += dollarTag.length; inDollarQuote = false; dollarTag = ''; continue;
    }
    const ch = sql[i];
    if (ch === ';' && !inDollarQuote) {
      const s = current.trim();
      if (s) stmts.push(s + ';');
      current = '';
    } else { current += ch; }
    i++;
  }
  const last = current.trim();
  if (last) stmts.push(last);

  return stmts.filter(s => {
    const clean = s.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    return clean.length > 1;
  });
}

const SKIP_CODES = new Set(['42P07','42710','42701','23505','42P16','42P11','42P12','42P13','42P14','42P15','42704']);
const SKIP_MSGS  = ['already exists','duplicate key','already done'];
function isIdempotent(e) {
  if (SKIP_CODES.has(e.code)) return true;
  return SKIP_MSGS.some(m => e.message.toLowerCase().includes(m));
}

async function dropAll(client) {
  console.log('\n🗑️  Borrando esquema Prisma existente...\n');

  // Drop all tables with CASCADE
  const tables = await client.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `);
  for (const { tablename } of tables.rows) {
    try {
      await client.query(`DROP TABLE IF EXISTS "${tablename}" CASCADE`);
      console.log(`  🗑️  DROP TABLE ${tablename}`);
    } catch (e) {
      console.error(`  ⚠️  No se pudo borrar tabla ${tablename}: ${e.message}`);
    }
  }

  // Drop all custom types/enums
  const types = await client.query(`
    SELECT typname FROM pg_type
    WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname='public')
  `);
  for (const { typname } of types.rows) {
    try {
      await client.query(`DROP TYPE IF EXISTS "${typname}" CASCADE`);
      console.log(`  🗑️  DROP TYPE ${typname}`);
    } catch (e) {
      console.error(`  ⚠️  No se pudo borrar tipo ${typname}: ${e.message}`);
    }
  }

  // Drop all sequences
  const seqs = await client.query(`
    SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'
  `);
  for (const { sequencename } of seqs.rows) {
    try {
      await client.query(`DROP SEQUENCE IF EXISTS "${sequencename}" CASCADE`);
      console.log(`  🗑️  DROP SEQUENCE ${sequencename}`);
    } catch (e) {}
  }

  // Drop all functions
  const funcs = await client.query(`
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
  `);
  for (const { proname, args } of funcs.rows) {
    try {
      await client.query(`DROP FUNCTION IF EXISTS "${proname}"(${args}) CASCADE`);
    } catch (e) {}
  }

  console.log('\n✅ Esquema anterior eliminado completamente\n');
}

async function runFile(client, label, file, stats) {
  if (!fs.existsSync(file)) {
    console.log(`⚠️  SKIP (no existe): ${label}`);
    return;
  }
  const sql = fs.readFileSync(file, 'utf8');
  const stmts = splitStatements(sql);
  let ok = 0, skip = 0, fail = 0;

  for (const stmt of stmts) {
    try {
      await client.query(stmt);
      ok++;
    } catch (e) {
      if (isIdempotent(e)) { skip++; }
      else {
        const preview = stmt.replace(/\s+/g,' ').slice(0, 100);
        console.error(`  ❌ [${e.code}] ${e.message.split('\n')[0]}`);
        console.error(`     → ${preview}...`);
        fail++;
      }
    }
  }

  const icon = fail > 0 ? '⚠️ ' : '✅';
  console.log(`${icon} ${label}: ${ok} OK | ${skip} skip | ${fail} err`);
  stats.ok += ok; stats.skip += skip; stats.fail += fail;
}

async function run() {
  const client = new Client(CLIENT_CFG);
  await client.connect();
  console.log('✅ Conectado a DigitalOcean PostgreSQL');

  // STEP 1: Drop everything
  await dropAll(client);

  // STEP 2: Apply full schema
  console.log('🏗️  Aplicando schema AntuCRM...\n');
  const stats = { ok: 0, skip: 0, fail: 0 };
  for (const { label, file } of ALL) {
    await runFile(client, label, file, stats);
  }

  await client.end();

  console.log('\n' + '═'.repeat(60));
  console.log(`📊 TOTAL: ${stats.ok} OK | ${stats.skip} skip | ${stats.fail} errores`);

  if (stats.fail === 0) {
    console.log('\n🚀 Base de datos lista — todas las tablas creadas correctamente');
    console.log('   El servidor creará super admin + planes al arrancar por primera vez.');
  } else {
    console.log('\n⚠️  Algunos statements fallaron — revisar errores arriba.');
  }
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
