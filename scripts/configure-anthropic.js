#!/usr/bin/env node
const { Pool } = require('pg');

async function configureAnthropic() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const result = await pool.query('SELECT id FROM ai_global_config LIMIT 1');
    
    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO ai_global_config (provider, api_key_enc, model, is_active)
         VALUES ('claude', $1, 'claude-3-sonnet-20240229', true)`,
        [process.env.ANTHROPIC_API_KEY]
      );
      console.log('✅ Anthropic configurado');
    } else {
      console.log('✅ Anthropic ya estaba configurado');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

configureAnthropic();
