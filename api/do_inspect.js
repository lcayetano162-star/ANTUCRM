const { Client } = require('pg');

const CLIENT_CFG = {
  host: 'db-postgresql-nyc3-73607-do-user-33546359-0.f.db.ondigitalocean.com',
  port: 25060, database: 'defaultdb', user: 'doadmin',
  password: 'AVNS_iugnjJCCSBs5S3dI4Kp',
  ssl: { rejectUnauthorized: false }
};

async function run() {
  const client = new Client(CLIENT_CFG);
  await client.connect();

  // All tables in public schema
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `);
  console.log('\n=== TABLAS EXISTENTES ===');
  tables.rows.forEach(r => console.log(' ', r.table_name));

  // Check tenants.id type (root cause of FK failures)
  const tenantsCol = await client.query(`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tenants'
    ORDER BY ordinal_position
  `);
  console.log('\n=== COLUMNAS DE tenants ===');
  tenantsCol.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} (${r.udt_name})`));

  // Check users table columns
  const usersCol = await client.query(`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users'
    ORDER BY ordinal_position
  `).catch(() => ({ rows: [] }));
  console.log('\n=== COLUMNAS DE users ===');
  usersCol.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} (${r.udt_name})`));

  // Row counts
  console.log('\n=== FILAS POR TABLA ===');
  for (const { table_name } of tables.rows) {
    try {
      const c = await client.query(`SELECT COUNT(*) FROM "${table_name}"`);
      if (parseInt(c.rows[0].count) > 0)
        console.log(`  ${table_name}: ${c.rows[0].count} filas`);
    } catch {}
  }

  await client.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
