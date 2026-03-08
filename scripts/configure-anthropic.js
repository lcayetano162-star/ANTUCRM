#!/usr/bin/env node
/**
 * Script para configurar Anthropic API Key en la base de datos
 * Este script debe ejecutarse UNA VEZ después del deploy inicial
 * 
 * Uso:
 *   export ANTHROPIC_API_KEY="sk-ant-api03-..."
 *   export ENCRYPTION_KEY="tu-encryption-key-32-chars"
 *   export DATABASE_URL="postgresql://..."
 *   node scripts/configure-anthropic.js
 */

const { Pool } = require('pg');
const crypto = require('crypto');

// Colores
const c = {
  r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', b: '\x1b[34m', rs: '\x1b[0m'
};

const log = {
  ok: (m) => console.log(`${c.g}✓${c.rs} ${m}`),
  err: (m) => console.log(`${c.r}✗${c.rs} ${m}`),
  info: (m) => console.log(`${c.b}ℹ${c.rs} ${m}`),
  section: (m) => console.log(`\n${c.b}${'='.repeat(60)}${c.rs}\n${c.b}${m}${c.rs}\n${c.b}${'='.repeat(60)}${c.rs}`)
};

// ── Encryption helpers ───────────────────────────────────────────────────────
function encryptKey(plaintext, encryptionKey) {
  const CIPHER_KEY = encryptionKey.padEnd(32).slice(0, 32);
  const KEY = Buffer.from(CIPHER_KEY);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

async function configureAnthropic() {
  log.section('CONFIGURACIÓN DE ANTHROPIC / CLAUDE');
  
  // Verificar variables de entorno
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!ANTHROPIC_API_KEY) {
    log.err('ANTHROPIC_API_KEY no está definida');
    log.info('Exporta la variable: export ANTHROPIC_API_KEY="sk-ant-api03-..."');
    process.exit(1);
  }
  
  if (!ENCRYPTION_KEY) {
    log.err('ENCRYPTION_KEY no está definida');
    log.info('Exporta la variable: export ENCRYPTION_KEY="tu-clave-32-caracteres"');
    process.exit(1);
  }
  
  if (ENCRYPTION_KEY.length !== 32) {
    log.err(`ENCRYPTION_KEY debe tener exactamente 32 caracteres (tiene ${ENCRYPTION_KEY.length})`);
    process.exit(1);
  }
  
  if (!DATABASE_URL) {
    log.err('DATABASE_URL no está definida');
    process.exit(1);
  }
  
  // Validar formato de API key
  if (!ANTHROPIC_API_KEY.startsWith('sk-ant-api')) {
    log.warn('La API key no tiene el formato esperado (sk-ant-api...)');
    log.info('Verifica que sea una clave válida de Anthropic');
  }
  
  log.ok('Variables de entorno validadas');
  log.info(`API Key: ${ANTHROPIC_API_KEY.substring(0, 20)}...`);
  
  // Conectar a base de datos
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    // Verificar conexión
    await pool.query('SELECT 1');
    log.ok('Conexión a PostgreSQL exitosa');
    
    // Verificar que existe la tabla
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ai_global_config'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      log.err('La tabla ai_global_config no existe');
      log.info('Ejecuta las migraciones primero: npm run migrate');
      process.exit(1);
    }
    
    // Encriptar la API key
    const encryptedKey = encryptKey(ANTHROPIC_API_KEY, ENCRYPTION_KEY);
    log.ok('API key encriptada correctamente');
    
    // Insertar o actualizar configuración
    const existing = await pool.query('SELECT id FROM ai_global_config LIMIT 1');
    
    if (existing.rows.length > 0) {
      // Actualizar
      await pool.query(
        `UPDATE ai_global_config 
         SET provider = 'claude',
             api_key_enc = $1,
             model = 'claude-sonnet-4-6',
             is_active = true,
             enable_contact_analysis = true,
             enable_sales_recommendations = true,
             enable_route_planner = true,
             updated_at = NOW()
         WHERE id = $2`,
        [encryptedKey, existing.rows[0].id]
      );
      log.ok('Configuración de Anthropic ACTUALIZADA');
    } else {
      // Insertar nueva
      await pool.query(
        `INSERT INTO ai_global_config (
          provider, api_key_enc, model, is_active,
          enable_contact_analysis, enable_sales_recommendations, enable_route_planner
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['claude', encryptedKey, 'claude-sonnet-4-6', true, true, true, true]
      );
      log.ok('Configuración de Anthropic CREADA');
    }
    
    // Verificar configuración
    const config = await pool.query('SELECT provider, model, is_active FROM ai_global_config LIMIT 1');
    log.info(`Proveedor: ${config.rows[0].provider}`);
    log.info(`Modelo: ${config.rows[0].model}`);
    log.info(`Activo: ${config.rows[0].is_active}`);
    
    log.section('CONFIGURACIÓN COMPLETADA ✅');
    console.log(`
${c.g}Anthropic Claude está configurado y listo para usar.${c.rs}

Próximos pasos:
1. Reinicia el servicio API para aplicar cambios:
   docker-compose restart api

2. Verifica la conexión en Super Admin → Configuración → IA
   O ejecuta: node scripts/test-anthropic.js

3. Las funciones de IA disponibles son:
   - Análisis de contactos
   - Recomendaciones de ventas
   - Briefing diario con IA
   - Coaching de ventas
   - Puntuación de oportunidades
`);
    
  } catch (error) {
    log.err(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

configureAnthropic();
