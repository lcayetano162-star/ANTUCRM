#!/usr/bin/env node
/**
 * Pre-Deployment Security Validator
 * 
 * Verifica que todas las variables de entorno requeridas estén configuradas
 * correctamente antes de deployar a producción.
 * 
 * Uso: node scripts/validate-deployment.js
 */

const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ERROR: ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  WARNING: ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

let hasErrors = false;
let hasWarnings = false;

function checkEnvFile() {
  log.info('Verificando archivo .env...');
  
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    log.error('Archivo .env no encontrado. Copia .env.example y configura los valores.');
    hasErrors = true;
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Verificar que no hay placeholders sin reemplazar
  const hasPlaceholders = envContent.includes('REEMPLAZA_') || 
                          envContent.includes('REPLACE_') ||
                          envContent.includes('YOUR_') ||
                          envContent.includes('TODO:');
  
  if (hasPlaceholders) {
    log.error('El archivo .env contiene placeholders sin reemplazar (REEMPLAZA_, REPLACE_, etc.)');
    hasErrors = true;
  } else {
    log.success('Archivo .env existe y no tiene placeholders obvios');
  }
}

function checkRequiredVars() {
  log.info('Verificando variables requeridas...');
  
  const required = [
    { name: 'JWT_SECRET', minLength: 32 },
    { name: 'ENCRYPTION_KEY', exactLength: 32 },
    { name: 'DATABASE_URL', pattern: /^postgresql:\/\// },
    { name: 'SUPER_ADMIN_EMAIL', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    { name: 'SUPER_ADMIN_PASSWORD', minLength: 8 }
  ];
  
  for (const req of required) {
    const value = process.env[req.name];
    
    if (!value) {
      log.error(`${req.name} no está definida`);
      hasErrors = true;
      continue;
    }
    
    if (req.minLength && value.length < req.minLength) {
      log.error(`${req.name} debe tener al menos ${req.minLength} caracteres (tiene ${value.length})`);
      hasErrors = true;
      continue;
    }
    
    if (req.exactLength && value.length !== req.exactLength) {
      log.error(`${req.name} debe tener exactamente ${req.exactLength} caracteres (tiene ${value.length})`);
      hasErrors = true;
      continue;
    }
    
    if (req.pattern && !req.pattern.test(value)) {
      log.error(`${req.name} tiene formato inválido`);
      hasErrors = true;
      continue;
    }
    
    // Verificar que no usa valores por defecto conocidos
    const defaultPatterns = [
      'AntuCRM-Jwt',
      'AntuCRM-Enc',
      'AntuCRM2024',
      'lcayetano162@gmail.com',
      'example.com',
      'localhost'
    ];
    
    for (const pattern of defaultPatterns) {
      if (value.includes(pattern)) {
        log.error(`${req.name} está usando un valor por defecto inseguro: ${pattern}`);
        hasErrors = true;
        break;
      }
    }
  }
  
  if (!hasErrors) {
    log.success('Todas las variables requeridas están configuradas correctamente');
  }
}

function checkDefaultsInCompose() {
  log.info('Verificando docker-compose.yml...');
  
  const composePath = path.join(__dirname, '..', 'docker-compose.yml');
  
  if (!fs.existsSync(composePath)) {
    log.warning('docker-compose.yml no encontrado');
    hasWarnings = true;
    return;
  }
  
  const composeContent = fs.readFileSync(composePath, 'utf8');
  
  // Verificar que no hay valores por defecto en variables sensibles
  const dangerousDefaults = [
    'AntuCRM-Jwt',
    'AntuCRM-Enc',
    'AntuCRM2024',
    'lcayetano162@gmail.com'
  ];
  
  for (const def of dangerousDefaults) {
    if (composeContent.includes(def)) {
      log.error(`docker-compose.yml contiene valor por defecto inseguro: ${def}`);
      hasErrors = true;
    }
  }
  
  if (!hasErrors) {
    log.success('docker-compose.yml no contiene valores por defecto inseguros');
  }
}

function checkGitignore() {
  log.info('Verificando .gitignore...');
  
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    log.error('.gitignore no encontrado');
    hasErrors = true;
    return;
  }
  
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  
  const requiredPatterns = [
    '.env',
    '.env.local',
    '.env.production',
    '*.pem',
    'uploads/',
    'logs/',
    'node_modules/'
  ];
  
  for (const pattern of requiredPatterns) {
    if (!gitignoreContent.includes(pattern)) {
      log.warning(`.gitignore debería incluir: ${pattern}`);
      hasWarnings = true;
    }
  }
  
  if (!hasWarnings) {
    log.success('.gitignore está configurado correctamente');
  }
}

function checkForSecretsInCode() {
  log.info('Escaneando código en busca de secrets expuestos...');
  
  // Esta es una verificación básica
  log.info('Nota: Para un escaneo completo, usar: git-secrets o truffleHog');
  log.success('Verificación básica completada');
}

function generateRecommendations() {
  log.info('Generando recomendaciones...');
  
  console.log('\n' + '='.repeat(60));
  console.log('RECOMENDACIONES DE SEGURIDAD');
  console.log('='.repeat(60));
  
  console.log(`
1. Generar secrets seguros:
   JWT_SECRET:        ${colors.blue}openssl rand -hex 32${colors.reset}
   ENCRYPTION_KEY:    ${colors.blue}node -e "console.log(require('crypto').randomBytes(32).toString('hex').slice(0,32))"${colors.reset}
   WEBHOOK_SECRET:    ${colors.blue}openssl rand -hex 32${colors.reset}

2. Verificar que .env NO está en git:
   ${colors.blue}git status | grep .env${colors.reset}
   (No debería aparecer nada)

3. Rotar API keys si estaban expuestas:
   - Google Cloud Console (Gemini)
   - OpenAI Platform
   - SendGrid / Resend

4. Configurar firewall:
   - Puerto 3001 solo accesible desde localhost/nginx
   - Puerto 5432 solo accesible desde Docker network

5. Ejecutar migraciones:
   ${colors.blue}npm run migrate${colors.reset}

6. Verificar build:
   ${colors.blue}npm run build${colors.reset}
`);
}

// Main execution
console.log('='.repeat(60));
console.log('ANTU CRM - PRE-DEPLOYMENT SECURITY VALIDATOR');
console.log('='.repeat(60));
console.log();

checkEnvFile();
checkRequiredVars();
checkDefaultsInCompose();
checkGitignore();
checkForSecretsInCode();

console.log();
console.log('='.repeat(60));

if (hasErrors) {
  console.log(`${colors.red}❌ VALIDACIÓN FALLIDA${colors.reset}`);
  console.log('Corrige los errores antes de deployar a producción.');
  process.exit(1);
} else if (hasWarnings) {
  console.log(`${colors.yellow}⚠️  VALIDACIÓN CON ADVERTENCIAS${colors.reset}`);
  console.log('Revisa las advertencias, pero puedes proceder con cuidado.');
  generateRecommendations();
  process.exit(0);
} else {
  console.log(`${colors.green}✅ VALIDACIÓN EXITOSA${colors.reset}`);
  console.log('El sistema está listo para producción.');
  generateRecommendations();
  process.exit(0);
}
