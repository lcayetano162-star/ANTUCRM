# Guía de Despliegue Rápido (Tren Bala) 🚀

Sigue estos pasos para desplegar ANTU CRM en tu Droplet de DigitalOcean sin errores.

## 1. Preparación en el Servidor
```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker y Docker Compose si no están
sudo apt install docker.io docker-compose -y
```

## 2. Configuración de Variables (.env)
Genera tus llaves primero:
```bash
node scripts/generate-production-keys.js
```

Crea tu archivo `.env` basado en `.env.example`:
```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/antu_crm?schema=public
JWT_SECRET=TU_LLAVE_GENERADA
ENCRYPTION_KEY=TU_LLAVE_GENERADA_64_CHARS
CORS_ORIGIN=http://TU_IP_DROPLET
```

## 3. Despliegue con Docker
```bash
# Construir y levantar
docker-compose up -d --build

# Verificar que las tablas se creen
docker-compose exec api npx prisma migrate deploy
```

## 4. Configurar IA (Anthropic)
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export ENCRYPTION_KEY="TU_LLAVE_EN_ENV"
export DATABASE_URL="postgresql://..."

node scripts/configure-anthropic.js
node scripts/test-anthropic.js
```

## 5. Verificación Final
```bash
node scripts/system-health-check.js
```

---
**Nota de Seguridad**: El sistema creará automáticamente el Super Admin (lcayetano162@gmail.com) al detectar que la tabla `landlord_users` está vacía en el primer arranque.
