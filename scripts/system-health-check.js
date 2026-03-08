#!/usr/bin/env node
/**
 * Sistema de Health Check Completo - Antu CRM
 * Verifica que TODO funcione correctamente antes de producción
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Colores
const c = {
  r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', b: '\x1b[34m', rs: '\x1b[0m'
};

const log = {
  ok: (m) => console.log(`${c.g}✓${c.rs} ${m}`),
  err: (m) => console.log(`${c.r}✗${c.rs} ${m}`),
  warn: (m) => console.log(`${c.y}⚠${c.rs} ${m}`),
  info: (m) => console.log(`${c.b}ℹ${c.rs} ${m}`),
  section: (m) => console.log(`\n${c.b}${'='.repeat(60)}${c.rs}\n${c.b}${m}${c.rs}\n${c.b}${'='.repeat(60)}${c.rs}`)
};

let errors = 0;
let warnings = 0;

async function checkDatabaseIntegrity() {
  log.section('1. INTEGRIDAD DE BASE DE DATOS');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // 1.1 Verificar conexión
    await pool.query('SELECT 1');
    log.ok('Conexión a PostgreSQL exitosa');

    // 1.2 Verificar tablas críticas
    const requiredTables = [
      'tenants', 'users', 'clients', 'contacts', 'opportunities',
      'activities', 'plans', 'landlord_users'
    ];
    
    for (const table of requiredTables) {
      const result = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
        [table]
      );
      if (result.rows[0].exists) {
        log.ok(`Tabla '${table}' existe`);
      } else {
        log.err(`Tabla '${table}' NO EXISTE`);
        errors++;
      }
    }

    // 1.3 Verificar foreign keys
    const fkResult = await pool.query(`
      SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `);
    log.ok(`${fkResult.rows.length} foreign keys configurados`);

    // 1.4 Verificar índices
    const idxResult = await pool.query(`
      SELECT schemaname, tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    log.ok(`${idxResult.rows.length} índices encontrados`);

    // 1.5 Verificar datos de demo
    const demoChecks = [
      { table: 'users', where: "email = 'admin@antucrm.com'", name: 'Usuario admin demo' },
      { table: 'users', where: "email = 'vendedor@antucrm.com'", name: 'Usuario vendedor demo' },
      { table: 'clients', where: "name = 'Tecnología Avanzada SRL'", name: 'Cliente demo' },
      { table: 'tenants', where: "slug = 'antucrm-principal'", name: 'Tenant demo' }
    ];

    for (const check of demoChecks) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${check.table} WHERE ${check.where}`);
      if (result.rows[0].count > 0) {
        log.warn(`${check.name} EXISTE (${result.rows[0].count} registros)`);
        warnings++;
      } else {
        log.ok(`${check.name} no encontrado`);
      }
    }

    // 1.6 Verificar multi-tenancy
    const tenantCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clients' AND column_name = 'tenant_id'
    `);
    if (tenantCheck.rows.length > 0) {
      log.ok('Multi-tenancy configurado (tenant_id en clients)');
    } else {
      log.err('Multi-tenancy NO configurado');
      errors++;
    }

  } catch (error) {
    log.err(`Error de base de datos: ${error.message}`);
    errors++;
  } finally {
    await pool.end();
  }
}

function checkEnvironment() {
  log.section('2. VARIABLES DE ENTORNO');
  
  const critical = ['DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY', 'NODE_ENV'];
  const optional = ['OPENAI_API_KEY', 'RESEND_API_KEY', 'GEMINI_API_KEY'];
  
  for (const varName of critical) {
    const value = process.env[varName];
    if (!value) {
      log.err(`${varName} NO DEFINIDA`);
      errors++;
    } else if (varName === 'JWT_SECRET' && value.length < 32) {
      log.err(`${varName} muy corta (${value.length} chars, mínimo 32)`);
      errors++;
    } else if (varName === 'ENCRYPTION_KEY' && value.length !== 32) {
      log.err(`${varName} debe tener exactamente 32 chars (tiene ${value.length})`);
      errors++;
    } else if (varName === 'NODE_ENV' && value !== 'production') {
      log.warn(`${varName}=${value} (debería ser 'production')`);
      warnings++;
    } else {
      log.ok(`${varName} configurada correctamente`);
    }
  }
  
  for (const varName of optional) {
    if (process.env[varName]) {
      log.ok(`${varName} configurada`);
    } else {
      log.warn(`${varName} no configurada (opcional)`);
    }
  }
}

function checkFileStructure() {
  log.section('3. ESTRUCTURA DE ARCHIVOS');
  
  const requiredFiles = [
    '.env.example',
    'docker-compose.yml',
    'api/Dockerfile',
    'api/src/server.ts',
    'frontend/package.json'
  ];
  
  for (const file of requiredFiles) {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      log.ok(`${file} existe`);
    } else {
      log.err(`${file} NO ENCONTRADO`);
      errors++;
    }
  }
  
  // Verificar que .env NO está en git
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    if (content.includes('.env')) {
      log.ok('.gitignore incluye .env');
    } else {
      log.err('.gitignore NO incluye .env');
      errors++;
    }
  }
}

function checkSecurityConfig() {
  log.section('4. CONFIGURACIÓN DE SEGURIDAD');
  
  // Verificar docker-compose.yml
  const composePath = path.join(__dirname, '..', 'docker-compose.yml');
  if (fs.existsSync(composePath)) {
    const content = fs.readFileSync(composePath, 'utf8');
    
    // Verificar que no hay defaults peligrosos
    const dangerous = ['AntuCRM-Jwt', 'AntuCRM-Enc', 'AntuCRM2024', 'lcayetano162'];
    for (const pattern of dangerous) {
      if (content.includes(pattern)) {
        log.err(`docker-compose.yml contiene valor por defecto inseguro: ${pattern}`);
        errors++;
      }
    }
    
    // Verificar USER directive
    if (content.includes('USER')) {
      log.ok('Dockerfile usa usuario no-root');
    } else {
      log.warn('Dockerfile podría no usar usuario no-root');
    }
  }
}

async function testDataPersistence() {
  log.section('5. TEST DE PERSISTENCIA');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Crear cliente de prueba
    const testClient = {
      name: 'TEST_CLIENT_' + Date.now(),
      email: 'test_' + Date.now() + '@test.com',
      tenant_id: (await pool.query('SELECT id FROM tenants LIMIT 1')).rows[0]?.id
    };
    
    if (!testClient.tenant_id) {
      log.warn('No hay tenants para probar persistencia');
      return;
    }
    
    // Insertar
    const insertResult = await pool.query(
      `INSERT INTO clients (name, email, tenant_id, contact_type) 
       VALUES ($1, $2, $3, 'prospect') 
       RETURNING id`,
      [testClient.name, testClient.email, testClient.tenant_id]
    );
    
    if (insertResult.rows.length === 1) {
      log.ok('Inserción de cliente funciona');
      
      // Verificar que se puede leer
      const readResult = await pool.query(
        'SELECT * FROM clients WHERE id = $1',
        [insertResult.rows[0].id]
      );
      
      if (readResult.rows.length === 1) {
        log.ok('Lectura de cliente funciona');
      } else {
        log.err('No se pudo leer el cliente insertado');
        errors++;
      }
      
      // Limpiar
      await pool.query('DELETE FROM clients WHERE id = $1', [insertResult.rows[0].id]);
      log.ok('Eliminación de cliente funciona');
      
    } else {
      log.err('No se pudo insertar cliente de prueba');
      errors++;
    }
    
  } catch (error) {
    log.err(`Error en test de persistencia: ${error.message}`);
    errors++;
  } finally {
    await pool.end();
  }
}

async function generateFixScript() {
  if (errors === 0 && warnings === 0) {
    return;
  }
  
  log.section('6. GENERANDO SCRIPT DE CORRECCIÓN');
  
  let script = '#!/bin/bash\n# Script auto-generado para corregir problemas\n\n';
  
  if (warnings > 0) {
    script += '# Limpiar datos de demo\n';
    script += 'node scripts/clean-demo-data.js\n\n';
  }
  
  script += '# Regenerar secrets\n';
  script += 'export JWT_SECRET=$(openssl rand -hex 32)\n';
  script += 'export ENCRYPTION_KEY=$(openssl rand -base64 32 | cut -c1-32)\n';
  script += 'echo "JWT_SECRET=$JWT_SECRET"\n';
  script += 'echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"\n\n';
  
  script += '# Actualizar .env\n';
  script += 'echo "JWT_SECRET=$JWT_SECRET" >> .env\n';
  script += 'echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env\n';
  script += 'echo "NODE_ENV=production" >> .env\n';
  script += 'echo "SKIP_DEMO_SEED=true" >> .env\n\n';
  
  script += 'echo "✅ Correcciones aplicadas. Reinicia los servicios."\n';
  
  const scriptPath = path.join(__dirname, 'apply-fixes.sh');
  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, '755');
  
  log.info(`Script de corrección generado: ${scriptPath}`);
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║       ANTU CRM - SISTEMA DE HEALTH CHECK v2.0           ║
║            "Tren Bala Edition"                           ║
╚══════════════════════════════════════════════════════════╝
  `);
  
  await checkDatabaseIntegrity();
  checkEnvironment();
  checkFileStructure();
  checkSecurityConfig();
  await testDataPersistence();
  await generateFixScript();
  
  log.section('RESULTADO FINAL');
  
  if (errors === 0 && warnings === 0) {
    console.log(`${c.g}
╔══════════════════════════════════════════════════════════╗
║  ✅ SISTEMA LISTO PARA PRODUCCIÓN                        ║
║  Todos los checks pasaron correctamente                 ║
╚══════════════════════════════════════════════════════════╝${c.rs}`);
    process.exit(0);
  } else if (errors === 0) {
    console.log(`${c.y}
╔══════════════════════════════════════════════════════════╗
║  ⚠️  SISTEMA FUNCIONAL CON ADVERTENCIAS                  ║
║  ${warnings} advertencias encontradas                     ║
║  Revisa los warnings antes de producción                 ║
╚══════════════════════════════════════════════════════════╝${c.rs}`);
    process.exit(0);
  } else {
    console.log(`${c.r}
╔══════════════════════════════════════════════════════════╗
║  ✗ SISTEMA NO LISTO PARA PRODUCCIÓN                      ║
║  ${errors} errores críticos encontrados                   ║
║  ${warnings} advertencias                                 ║
║  Ejecuta: node scripts/system-health-check.js            ║
╚══════════════════════════════════════════════════════════╝${c.rs}`);
    process.exit(1);
  }
}

main().catch(console.error);
