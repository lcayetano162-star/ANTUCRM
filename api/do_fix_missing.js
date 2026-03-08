/**
 * Aplica las tablas que fallaron por bug del splitter (semicolón en comentarios).
 * Usa un splitter corregido que maneja -- comentarios inline.
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const CLIENT_CFG = {
  host: 'db-postgresql-nyc3-73607-do-user-33546359-0.f.db.ondigitalocean.com',
  port: 25060, database: 'defaultdb', user: 'doadmin',
  password: 'AVNS_iugnjJCCSBs5S3dI4Kp',
  ssl: { rejectUnauthorized: false }
};

// ── Fixed statement splitter ──────────────────────────────────────────────────
// Correctly handles:
//   - -- line comments (skips ; inside them)
//   - /* block comments */
//   - $$ dollar-quote blocks
//   - 'string literals'
function splitStatements(sql) {
  const stmts = [];
  let current = '';
  let i = 0;
  const len = sql.length;

  while (i < len) {
    // -- line comment: skip until newline
    if (sql[i] === '-' && sql[i+1] === '-') {
      const end = sql.indexOf('\n', i);
      const comment = end === -1 ? sql.slice(i) : sql.slice(i, end + 1);
      current += comment;
      i += comment.length;
      continue;
    }

    // /* block comment */
    if (sql[i] === '/' && sql[i+1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      if (end === -1) { current += sql.slice(i); i = len; continue; }
      current += sql.slice(i, end + 2);
      i = end + 2;
      continue;
    }

    // $dollar-quote$ blocks
    if (sql[i] === '$') {
      const rest = sql.slice(i);
      const m = rest.match(/^(\$[^$]*\$)/);
      if (m) {
        const tag = m[1];
        const closeIdx = sql.indexOf(tag, i + tag.length);
        if (closeIdx !== -1) {
          current += sql.slice(i, closeIdx + tag.length);
          i = closeIdx + tag.length;
          continue;
        }
      }
    }

    // 'string literal' — skip content including escaped quotes
    if (sql[i] === "'") {
      let j = i + 1;
      while (j < len) {
        if (sql[j] === "'" && sql[j+1] === "'") { j += 2; continue; }
        if (sql[j] === "'") { j++; break; }
        j++;
      }
      current += sql.slice(i, j);
      i = j;
      continue;
    }

    // Statement terminator
    if (sql[i] === ';') {
      const s = current.trim();
      if (s) stmts.push(s + ';');
      current = '';
      i++;
      continue;
    }

    current += sql[i];
    i++;
  }

  const last = current.trim();
  if (last) stmts.push(last);

  return stmts.filter(s => {
    const clean = s.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    return clean.length > 2;
  });
}

const SKIP_CODES = new Set(['42P07','42710','42701','23505','42P16','42P11','42P12','42P13','42P14','42P15','42704']);
function isIdempotent(e) {
  if (SKIP_CODES.has(e.code)) return true;
  const m = e.message.toLowerCase();
  return m.includes('already exists') || m.includes('duplicate key');
}

async function applySQL(client, label, sql) {
  const stmts = splitStatements(sql);
  let ok = 0, skip = 0, fail = 0;

  for (const stmt of stmts) {
    try {
      await client.query(stmt);
      ok++;
    } catch (e) {
      if (isIdempotent(e)) { skip++; }
      else {
        const preview = stmt.replace(/\s+/g,' ').slice(0, 120);
        console.error(`  ❌ [${e.code}] ${e.message.split('\n')[0]}`);
        console.error(`     → ${preview}`);
        fail++;
      }
    }
  }

  const icon = fail === 0 ? '✅' : '⚠️ ';
  console.log(`${icon} ${label}: ${ok} OK | ${skip} skip | ${fail} err`);
  return fail;
}

async function run() {
  const client = new Client(CLIENT_CFG);
  await client.connect();
  console.log('✅ Conectado\n');

  let totalFail = 0;

  // Re-apply the files that had splitter bugs
  const files = [
    '007_credits_inventory_invoicing.sql',
    '008_optimization.sql',
    '009_service_desk.sql',
    '017_erp_integrations.sql',
    '018_logs_immutability.sql',
    '022_automations.sql',
    '030_mobile_tables.sql',
    '031_email_conversations.sql',
  ];

  const migrDir = path.join(__dirname, 'src/database/migrations');

  for (const f of files) {
    const filePath = path.join(migrDir, f);
    if (!fs.existsSync(filePath)) { console.log(`⚠️  No existe: ${f}`); continue; }
    const sql = fs.readFileSync(filePath, 'utf8');
    totalFail += await applySQL(client, f, sql);
  }

  // Also verify missing tables
  console.log('\n=== VERIFICACIÓN FINAL ===');
  const critical = ['products','inventory','inventory_movements','invoice_items','erp_integrations','service_wo_parts'];
  for (const tbl of critical) {
    try {
      await client.query(`SELECT 1 FROM "${tbl}" LIMIT 1`);
      console.log(`  ✅ ${tbl} — EXISTE`);
    } catch (e) {
      console.log(`  ❌ ${tbl} — FALTA`);
    }
  }

  await client.end();
  console.log(totalFail === 0 ? '\n🚀 Todo aplicado correctamente' : `\n⚠️  ${totalFail} errores residuales`);
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
