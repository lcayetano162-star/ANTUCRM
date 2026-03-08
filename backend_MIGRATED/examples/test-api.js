/**
 * Script para probar la API del Cotizador MPS
 * Uso: node test-api.js
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3001;

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('======================================');
  console.log('🧪 Test API Cotizador MPS');
  console.log('======================================\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣  Health Check...');
    const health = await makeRequest('/health');
    console.log(JSON.stringify(health, null, 2));
    console.log('');

    // Test 2: Calcular cotización simple
    console.log('2️⃣  Calculando cotización simple...');
    const simpleQuote = await makeRequest('/api/mps/calculate', 'POST', {
      oportunidadId: 'OP-TEST-001',
      modalidad: 'renta',
      plazoMeses: 36,
      tasaInteresAnual: 16,
      items: [
        {
          codigo: 'TEST001',
          descripcion: 'Equipo de prueba',
          nivelPrecio: 'precio_lista',
          precioEquipo: 100000,
          cxcBN: 0.01,
          volumenBN: 1000,
          cxcColor: 0.05,
          volumenColor: 500,
        },
      ],
    });
    console.log('✅ Cotización calculada:');
    console.log(`   - Inversión Hardware: $${simpleQuote.data?.financialSummary?.inversionHardware?.toLocaleString()}`);
    console.log(`   - Cuota Mensual Final: $${simpleQuote.data?.financialSummary?.cuotaMensualNegocioFinal?.toLocaleString()}`);
    console.log('');

    // Test 3: Caso real OP-017 (1x7200 + 9x8200)
    console.log('3️⃣  Calculando cotización OP-017 (caso real)...');
    const op017Items = [
      {
        codigo: 'EMC00AA',
        descripcion: 'ImageFORCE 6170 Speed License',
        nivelPrecio: 'precio_estrategico',
        precioEquipo: 7200,
        cxcBN: 0.008032,
        volumenBN: 2000,
        cxcColor: 0.09521,
        volumenColor: 50000,
      },
      ...Array(9).fill({
        codigo: 'EMC00AA',
        descripcion: 'ImageFORCE 6170 Speed License',
        nivelPrecio: 'precio_lista',
        precioEquipo: 8200,
        cxcBN: 0.006532,
        volumenBN: 0,
        cxcColor: 0.09375,
        volumenColor: 0,
      }),
    ];

    const op017Quote = await makeRequest('/api/mps/calculate', 'POST', {
      oportunidadId: 'OP-017',
      modalidad: 'renta',
      plazoMeses: 36,
      tasaInteresAnual: 16,
      items: op017Items,
    });

    console.log('✅ Cotización OP-017 calculada:');
    console.log(`   - Total Equipos: ${op017Quote.data?.gridTotals?.totalEquipos}`);
    console.log(`   - Inversión Hardware: $${op017Quote.data?.gridTotals?.totalPrecioEquipos?.toLocaleString()}`);
    console.log(`   - Total Servicios: $${op017Quote.data?.financialSummary?.totalServicios?.toLocaleString()}`);
    console.log(`   - Cuota Hardware Financiado: $${op017Quote.data?.financialSummary?.cuotaHardwareFinanciado?.toLocaleString()}`);
    console.log(`   - CUOTA MENSUAL NEGOCIO FINAL: $${op017Quote.data?.financialSummary?.cuotaMensualNegocioFinal?.toLocaleString()}`);
    console.log('');

    // Test 4: Recalcular con nuevo plazo
    console.log('4️⃣  Recalculando con plazo de 48 meses...');
    const recalculated = await makeRequest('/api/mps/recalculate', 'POST', {
      items: op017Quote.data?.items,
      plazoMeses: 48,
      tasaInteresAnual: 16,
      modalidad: 'renta',
      oportunidadId: 'OP-017',
    });

    console.log('✅ Recálculo completado:');
    console.log(`   - Nueva Cuota Mensual Final: $${recalculated.data?.financialSummary?.cuotaMensualNegocioFinal?.toLocaleString()}`);
    console.log('');

    console.log('======================================');
    console.log('✅ Todos los tests completados');
    console.log('======================================');
  } catch (error) {
    console.error('❌ Error en tests:', error.message);
    console.log('');
    console.log('💡 Asegúrate de que el servidor esté corriendo:');
    console.log('   npm run dev');
    process.exit(1);
  }
}

runTests();
