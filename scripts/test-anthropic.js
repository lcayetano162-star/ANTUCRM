#!/usr/bin/env node
/**
 * Script de prueba para verificar conexión con Anthropic
 * Prueba la API key configurada en la base de datos
 */

const { Pool } = require('pg');
const https = require('https');
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

// ── Decryption helper ────────────────────────────────────────────────────────
function decryptKey(ciphertext, encryptionKey) {
  const CIPHER_KEY = encryptionKey.padEnd(32).slice(0, 32);
  const KEY = Buffer.from(CIPHER_KEY);
  const [ivHex, tagHex, encHex] = ciphertext.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(encHex, 'hex')).toString('utf8') + decipher.final('utf8');
}

// ── HTTP helper ──────────────────────────────────────────────────────────────
function httpPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname, path, method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Content-Length': Buffer.byteLength(payload), 
        ...headers 
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { 
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error?.message || JSON.stringify(parsed)}`));
          } else {
            resolve(parsed); 
          }
        }
        catch { 
          reject(new Error(`Invalid JSON response: ${data}`)); 
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function testAnthropic() {
  log.section('TEST DE CONEXIÓN ANTHROPIC / CLAUDE');
  
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!ENCRYPTION_KEY) {
    log.err('ENCRYPTION_KEY no está definida');
    process.exit(1);
  }
  
  if (ENCRYPTION_KEY.length !== 32) {
    log.err(`ENCRYPTION_KEY debe tener exactamente 32 caracteres`);
    process.exit(1);
  }
  
  if (!DATABASE_URL) {
    log.err('DATABASE_URL no está definida');
    process.exit(1);
  }
  
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    // Obtener configuración
    const result = await pool.query('SELECT * FROM ai_global_config LIMIT 1');
    
    if (result.rows.length === 0) {
      log.err('No hay configuración de IA en la base de datos');
      log.info('Ejecuta primero: node scripts/configure-anthropic.js');
      process.exit(1);
    }
    
    const config = result.rows[0];
    
    log.info(`Proveedor: ${config.provider}`);
    log.info(`Modelo: ${config.model}`);
    log.info(`Activo: ${config.is_active}`);
    
    if (!config.is_active) {
      log.warn('La IA está desactivada en la configuración');
    }
    
    if (config.provider !== 'claude') {
      log.warn(`El proveedor es "${config.provider}", no "claude"`);
    }
    
    // Desencriptar API key
    let apiKey;
    try {
      apiKey = decryptKey(config.api_key_enc, ENCRYPTION_KEY);
      log.ok('API key desencriptada correctamente');
    } catch (e) {
      log.err('No se pudo desencriptar la API key');
      log.info('Verifica que ENCRYPTION_KEY sea la misma usada para encriptar');
      process.exit(1);
    }
    
    // Probar conexión con Anthropic
    log.info('Enviando petición de prueba a Anthropic API...');
    log.info('Esto puede tomar 2-5 segundos...');
    
    const startTime = Date.now();
    
    try {
      const response = await httpPost(
        'api.anthropic.com',
        '/v1/messages',
        { 
          'x-api-key': apiKey, 
          'anthropic-version': '2023-06-01' 
        },
        { 
          model: config.model || 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{ 
            role: 'user', 
            content: 'Responde únicamente con: {"status":"ok","message":"Conexión exitosa con Antü CRM"}' 
          }]
        }
      );
      
      const elapsed = Date.now() - startTime;
      
      log.ok(`Respuesta recibida en ${elapsed}ms`);
      
      if (response.content && response.content[0] && response.content[0].text) {
        const text = response.content[0].text;
        log.info(`Respuesta: ${text.substring(0, 100)}...`);
        
        // Intentar parsear JSON
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.status === 'ok') {
              log.ok('✅ CONEXIÓN EXITOSA CON ANTHROPIC');
            }
          }
        } catch (e) {
          log.warn('La respuesta no es JSON válido, pero la conexión funcionó');
        }
      }
      
      log.section('TEST COMPLETADO ✅');
      console.log(`
${c.g}La integración con Anthropic Claude está funcionando correctamente.${c.rs}

Puedes usar estas funciones de IA:
• Análisis inteligente de contactos
• Recomendaciones de ventas
• Briefing diario automático
• Coaching de ventas con IA
• Puntuación de oportunidades

Todo está listo para producción.
`);
      
    } catch (error) {
      const msg = error.message || 'Error desconocido';
      
      if (msg.includes('401')) {
        log.err('API key inválida (401)');
        log.info('Verifica que la API key sea correcta y esté activa en Anthropic Console');
      } else if (msg.includes('403')) {
        log.err('API key sin permisos (403)');
        log.info('Verifica que la key tenga acceso al modelo seleccionado');
      } else if (msg.includes('429')) {
        log.err('Límite de requests alcanzado (429)');
        log.info('Espera unos segundos y vuelve a intentarlo');
      } else if (msg.includes('model')) {
        log.err('Modelo no encontrado');
        log.info('Verifica que el modelo exista en Anthropic Console');
      } else {
        log.err(`Error: ${msg}`);
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    log.err(`Error de base de datos: ${error.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testAnthropic();
