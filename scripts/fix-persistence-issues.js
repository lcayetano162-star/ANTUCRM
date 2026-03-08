#!/usr/bin/env node
/**
 * Diagnóstico y corrección de problemas de persistencia
 * 
 * Problemas a verificar:
 * 1. Clientes no se guardan en BD (se pierden al refrescar)
 * 2. Tenants nuevos se crean con datos de demo
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Colores
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

async function checkDatabase() {
  log.info('Conectando a la base de datos...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // 1. Verificar que la tabla clients existe y tiene datos
    log.info('Verificando tabla clients...');
    const clientsResult = await pool.query('SELECT COUNT(*) FROM clients');
    log.success(`Tabla clients existe. Total de clientes: ${clientsResult.rows[0].count}`);

    // 2. Verificar que hay tenants
    const tenantsResult = await pool.query('SELECT id, name, slug FROM tenants');
    log.info(`Tenants encontrados: ${tenantsResult.rows.length}`);
    tenantsResult.rows.forEach(t => {
      console.log(`   - ${t.name} (${t.slug}) [${t.id}]`);
    });

    // 3. Verificar si hay datos de demo mezclados
    log.info('Buscando datos de demo...');
    const demoEmails = ['admin@antucrm.com', 'vendedor@antucrm.com', 'gerente@antucrm.com'];
    const demoClients = ['Tecnología Avanzada SRL', 'Soluciones Digitales RD', 'Constructora del Caribe'];
    
    for (const email of demoEmails) {
      const res = await pool.query('SELECT COUNT(*) FROM users WHERE email = $1', [email]);
      if (res.rows[0].count > 0) {
        log.warning(`Encontrado usuario demo: ${email}`);
      }
    }

    for (const clientName of demoClients) {
      const res = await pool.query('SELECT COUNT(*) FROM clients WHERE name = $1', [clientName]);
      if (res.rows[0].count > 0) {
        log.warning(`Encontrado cliente demo: ${clientName}`);
      }
    }

    // 4. Verificar permisos de tablas
    log.info('Verificando permisos de tablas...');
    const tables = ['clients', 'tenants', 'users', 'opportunities'];
    for (const table of tables) {
      try {
        await pool.query(`INSERT INTO ${table} DEFAULT VALUES ON CONFLICT DO NOTHING RETURNING id`);
        await pool.query(`ROLLBACK`);
      } catch (e) {
        log.error(`No se pueden insertar datos en ${table}: ${e.message}`);
      }
    }

    // 5. Verificar si hay triggers problemáticos
    log.info('Verificando triggers...');
    const triggersResult = await pool.query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
    `);
    
    log.info(`Total de triggers: ${triggersResult.rows.length}`);
    triggersResult.rows.forEach(t => {
      console.log(`   - ${t.trigger_name} ON ${t.event_object_table} (${t.event_manipulation})`);
    });

    // 6. Verificar constraints de foreign keys
    log.info('Verificando constraints...');
    const fkResult = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `);
    
    log.info(`Total de foreign keys: ${fkResult.rows.length}`);

  } catch (error) {
    log.error(`Error de base de datos: ${error.message}`);
    throw error;
  } finally {
    await pool.end();
  }
}

async function checkEnvironment() {
  log.info('Verificando variables de entorno...');
  
  const required = ['DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY'];
  for (const varName of required) {
    if (!process.env[varName]) {
      log.error(`${varName} no está definida`);
    } else {
      log.success(`${varName} está configurada`);
    }
  }

  // Verificar NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    log.success('NODE_ENV=production (datos demo deberían estar deshabilitados)');
  } else {
    log.warning(`NODE_ENV=${process.env.NODE_ENV || 'undefined'} (podría crear datos demo)`);
  }
}

async function cleanDemoData() {
  log.info('Limpiando datos de demo...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Eliminar datos de demo específicos
    await pool.query('BEGIN');
    
    // Eliminar usuarios demo
    const demoEmails = ['admin@antucrm.com', 'vendedor@antucrm.com', 'gerente@antucrm.com'];
    for (const email of demoEmails) {
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
      log.info(`Eliminado usuario demo: ${email}`);
    }

    // Eliminar clientes demo
    const demoClients = ['Tecnología Avanzada SRL', 'Soluciones Digitales RD', 'Constructora del Caribe', 'Importadora Nacional', 'Servicios Financieros ABC'];
    for (const client of demoClients) {
      await pool.query('DELETE FROM clients WHERE name = $1', [client]);
      log.info(`Eliminado cliente demo: ${client}`);
    }

    // Eliminar tenant demo
    await pool.query("DELETE FROM tenants WHERE slug = 'antucrm-principal'");
    log.info("Eliminado tenant demo: antucrm-principal");

    await pool.query('COMMIT');
    log.success('Datos de demo eliminados');

  } catch (error) {
    await pool.query('ROLLBACK');
    log.error(`Error limpiando datos demo: ${error.message}`);
  } finally {
    await pool.end();
  }
}

async function fixIssues() {
  log.info('Aplicando correcciones...');

  // 1. Verificar y crear .env.production si no existe
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    log.error('No se encontró archivo .env');
    log.info('Copia .env.example a .env y configura los valores reales');
    return;
  }

  let envContent = fs.readFileSync(envPath, 'utf8');

  // 2. Asegurar que SKIP_DEMO_SEED esté configurado
  if (!envContent.includes('SKIP_DEMO_SEED=true')) {
    envContent += '\n# Evitar creación de datos demo\nSKIP_DEMO_SEED=true\n';
    fs.writeFileSync(envPath, envContent);
    log.success('Agregado SKIP_DEMO_SEED=true al .env');
  }

  // 3. Verificar configuración de seed.js
  const seedPath = path.join(__dirname, '..', 'api', 'src', 'config', 'seed.js');
  if (fs.existsSync(seedPath)) {
    let seedContent = fs.readFileSync(seedPath, 'utf8');
    
    // Asegurar que la condición de producción esté correcta
    if (!seedContent.includes("process.env.NODE_ENV === 'production'")) {
      log.warning('El seed.js no tiene verificación de producción');
    } else {
      log.success('seed.js tiene verificación de producción');
    }
  }

  log.success('Correcciones aplicadas');
}

async function main() {
  console.log('='.repeat(60));
  console.log('DIAGNÓSTICO DE PERSISTENCIA - ANTU CRM');
  console.log('='.repeat(60));
  console.log();

  const command = process.argv[2];

  try {
    switch (command) {
      case 'check':
        await checkEnvironment();
        await checkDatabase();
        break;
      case 'clean':
        await cleanDemoData();
        break;
      case 'fix':
        await fixIssues();
        break;
      default:
        console.log('Uso: node fix-persistence-issues.js [check|clean|fix]');
        console.log('');
        console.log('  check - Verificar estado de la base de datos');
        console.log('  clean - Eliminar datos de demo');
        console.log('  fix   - Aplicar correcciones al .env');
        process.exit(1);
    }
  } catch (error) {
    log.error(error.message);
    process.exit(1);
  }

  console.log();
  console.log('='.repeat(60));
  console.log('COMPLETADO');
  console.log('='.repeat(60));
}

main();
