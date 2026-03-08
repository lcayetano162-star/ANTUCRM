#!/bin/bash
# Script para crear configuración de producción segura

echo "🚀 Creando configuración de producción..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Debes ejecutar este script desde la raíz del proyecto"
    exit 1
fi

# Generar secrets
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d '\n' | cut -c1-32)

echo ""
echo "📋 Secrets generados:"
echo "  JWT_SECRET=${JWT_SECRET:0:10}..."
echo "  ENCRYPTION_KEY=${ENCRYPTION_KEY:0:10}..."

# Crear .env.production
cat > .env.production << EOF
# ============================================
# ANTU CRM - PRODUCCIÓN
# ============================================

# Database
DATABASE_URL=postgresql://antucrm_prod:${DB_PASSWORD:-CHANGE_ME}@localhost:5432/antucrm_prod

# JWT & Security
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Environment
NODE_ENV=production
SKIP_DEMO_SEED=true

# API & Frontend URLs
API_URL=https://api.antucrm.com
FRONTEND_URL=https://app.antucrm.com
APP_URL=https://app.antucrm.com

# Email
RESEND_API_KEY=resend_key_here
RESEND_FROM=noreply@antucrm.com

# Super Admin (cambiar antes de deploy)
SUPER_ADMIN_EMAIL=superadmin@antucrm.com
SUPER_ADMIN_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# AI Keys - ANTHROPIC RECOMENDADO
# La API key de Anthropic se configurará con: node scripts/configure-anthropic.js
ANTHROPIC_API_KEY=sk-ant-api03-cambiar-por-tu-key-real

# AI Keys alternativas (opcional)
OPENAI_API_KEY=sk-openai_key_here
GEMINI_API_KEY=gemini_key_here

# WhatsApp (optional)
WHATSAPP_API_TOKEN=token_here
EOF

echo ""
echo "✅ Archivo .env.production creado"
echo ""
echo "⚠️  IMPORTANTE: Edita el archivo y cambia:"
echo "  1. DB_PASSWORD - Contraseña de la base de datos"
echo "  2. SUPER_ADMIN_PASSWORD - Contraseña del super admin"
echo "  3. API_URL y FRONTEND_URL - URLs reales de tu dominio"
echo "  4. ANTHROPIC_API_KEY - Tu API key de Anthropic (Claude)"
echo ""
echo "📝 Para aplicar:"
echo "  cp .env.production .env"
echo "  # Edita .env con tus valores reales"
echo "  docker-compose up -d"
echo ""
echo "🤖 Configurar Anthropic (después del primer deploy):"
echo "  node scripts/configure-anthropic.js"
echo "  node scripts/test-anthropic.js"
