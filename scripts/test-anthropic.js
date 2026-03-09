#!/usr/bin/env node
const axios = require('axios');

async function testAnthropic() {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        messages: [{ role: 'user', content: 'Di "Conexión exitosa con Antu CRM" en español' }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    console.log('✅ CONEXIÓN EXITOSA');
    console.log('Respuesta:', response.data.content[0].text);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAnthropic();
