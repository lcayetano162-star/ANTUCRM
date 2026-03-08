/**
 * Migración completa → DigitalOcean Managed PostgreSQL
 * Ejecuta cada statement SQL individualmente para máxima resiliencia
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

// Split a SQL file into individual statements (handles $$ dollar-quoting blocks)
function splitStatements(sql) {
  const stmts = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let i = 0;

  while (i < sql.length) {
    // Check for dollar-quote start/end
    if (!inDollarQuote) {
      const match = sql.slice(i).match(/^(\$[^$]*\$)/);
      if (match) {
        inDollarQuote = true;
        dollarTag = match[1];
        current += dollarTag;
        i += dollarTag.length;
        continue;
      }
    } else {
      if (sql.slice(i).startsWith(dollarTag)) {
        current += dollarTag;
        i += dollarTag.length;
        inDollarQuote = false;
        dollarTag = '';
        continue;
      }
    }

    const ch = sql[i];

    // Statement terminator only outside dollar-quotes
    if (ch === ';' && !inDollarQuote) {
      const stmt = current.trim();
      if (stmt) stmts.push(stmt + ';');
      current = '';
    } else {
      current += ch;
    }
    i++;
  }

  // Catch any final statement without trailing semicolon
  const last = current.trim();
  if (last) stmts.push(last);

  return stmts.filter(s => {
    // Skip pure comments and empty strings
    const noComments = s.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    return noComments.length > 1;
  });
}

// Codes that are safe to skip (idempotent "already exists" family)
const SKIP_CODES = new Set(['42P07','42710','42701','23505','42P16','42P11','42P12','42P13','42P14','42P15']);
const SKIP_MSGS  = ['already exists','duplicate key','already done'];

function isIdempotentError(e) {
  if (SKIP_CODES.has(e.code)) return true;
  return SKIP_MSGS.some(m => e.message.toLowerCase().includes(m));
}

async function runFile(client, label, file, stats) {
  if (!fs.existsSync(file)) {
    console.log(`⚠️  SKIP (no existe): ${label}`);
    return;
  }

  const sql = fs.readFileSync(file, 'utf8');
  const stmts = splitStatements(sql);
  let fileOk = 0, fileSkip = 0, fileFail = 0;

  for (const stmt of stmts) {
    try {
      await client.query(stmt);
      fileOk++;
    } catch (e) {
      if (isIdempotentError(e)) {
        fileSkip++;
      } else {
        const preview = stmt.replace(/\s+/g,' ').slice(0, 80);
        console.error(`  ❌ [${e.code}] ${e.message.split('\n')[0]}`);
        console.error(`     SQL: ${preview}...`);
        fileFail++;
      }
    }
  }

  const icon = fileFail > 0 ? '⚠️ ' : '✅';
  console.log(`${icon} ${label}: ${fileOk} OK | ${fileSkip} skip | ${fileFail} err (de ${stmts.length} stmts)`);
  stats.ok   += fileOk;
  stats.skip += fileSkip;
  stats.fail += fileFail;
}

async function run() {
  const client = new Client(CLIENT_CFG);
  await client.connect();
  console.log('✅ Conectado a DigitalOcean PostgreSQL (host público)\n');

  const stats = { ok: 0, skip: 0, fail: 0 };

  for (const { label, file } of ALL) {
    await runFile(client, label, file, stats);
  }

  await client.end();

  console.log('\n' + '═'.repeat(60));
  console.log(`📊 TOTAL: ${stats.ok} OK | ${stats.skip} saltados | ${stats.fail} errores`);

  if (stats.fail === 0) {
    console.log('🚀 Base de datos lista para producción');
  } else {
    console.log('⚠️  Hubo errores — revisa arriba. Puede que algunas tablas ya existan con esquema diferente (Prisma vs raw SQL).');
    console.log('   Si el sistema arranca correctamente en el servidor, los errores residuales son probablemente inofensivos.');
  }
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
