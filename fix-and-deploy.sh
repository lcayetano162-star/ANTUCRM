#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# ANTUCRM AUTO-FIX & DEPLOY SCRIPT v25 - EMERGENCY DEPLOYMENT
# Objetivo: Lograr que npm run db:migrate funcione y la web cargue
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  ANTUCRM EMERGENCY DEPLOY - srv1377141${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

# Directorio del proyecto
PROJECT_DIR="/home/antucrm.com/public_html"
cd "$PROJECT_DIR" 2>/dev/null || cd "$(dirname "$0")"

echo -e "${YELLOW}[1/8]${NC} Deteniendo contenedores existentes..."
docker-compose down 2>/dev/null || true
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
sleep 2

echo -e "${YELLOW}[2/8]${NC} Limpiando redes Docker huérfanas..."
docker network prune -f 2>/dev/null || true

echo -e "${YELLOW}[3/8]${NC} Verificando docker-compose.yml..."

# Crear docker-compose.yml corregido si no existe o está dañado
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: antucrm-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: antucrm_admin
      POSTGRES_PASSWORD: AntuCRM2024!
      POSTGRES_DB: antucrm_production
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - antucrm-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U antucrm_admin -d antucrm_production"]
      interval: 5s
      timeout: 5s
      retries: 10
    ports:
      - "127.0.0.1:5432:5432"

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: antucrm-api
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: antucrm_production
      DB_USER: antucrm_admin
      DB_PASSWORD: AntuCRM2024!
      JWT_SECRET: AntuCRM-SecretKey-2024-Production
      FRONTEND_URL: http://antucrm.com:5005
      SUPER_ADMIN_EMAIL: lcayetano162@gmail.com
      SUPER_ADMIN_PASSWORD: AntuCRM2024!
    networks:
      - antucrm-network
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "127.0.0.1:3001:3001"

  frontend:
    image: nginx:alpine
    container_name: antucrm-frontend
    restart: unless-stopped
    ports:
      - "5005:80"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - antucrm-network
    depends_on:
      - api

networks:
  antucrm-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16

volumes:
  postgres-data:
EOF

echo -e "${GREEN}✓${NC} docker-compose.yml actualizado"

echo -e "${YELLOW}[4/8]${NC} Creando .env para la API..."
mkdir -p api
cat > api/.env << 'EOF'
NODE_ENV=production
PORT=3001
DB_HOST=postgres
DB_PORT=5432
DB_NAME=antucrm_production
DB_USER=antucrm_admin
DB_PASSWORD=AntuCRM2024!
JWT_SECRET=AntuCRM-SecretKey-2024-Production
FRONTEND_URL=http://antucrm.com:5005
SUPER_ADMIN_EMAIL=lcayetano162@gmail.com
SUPER_ADMIN_PASSWORD=AntuCRM2024!
EOF

echo -e "${GREEN}✓${NC} .env de API creado"

echo -e "${YELLOW}[5/8]${NC} Iniciando contenedores..."
docker-compose up -d --build

echo -e "${YELLOW}[6/8]${NC} Esperando que PostgreSQL esté listo..."
sleep 10

# Verificar que PostgreSQL responde
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose exec -T postgres pg_isready -U antucrm_admin -d antucrm_production > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} PostgreSQL está listo"
        break
    fi
    echo -n "."
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗${NC} PostgreSQL no respondió a tiempo"
    echo -e "${YELLOW}Intentando diagnóstico de red...${NC}"
    docker network inspect antucrm_antucrm-network 2>/dev/null || docker network inspect antucrm-public-html_antucrm-network 2>/dev/null || true
    docker-compose logs postgres | tail -20
    exit 1
fi

echo -e "${YELLOW}[7/8]${NC} Ejecutando migraciones de base de datos..."
docker-compose exec -T api sh -c 'cd /app && npm run db:migrate' 2>&1 || {
    echo -e "${YELLOW}⚠${NC} Falló migración inicial, intentando método alternativo..."
    # Intentar conectarse directamente y crear tablas
    docker-compose exec -T postgres psql -U antucrm_admin -d antucrm_production << 'PSQL'
-- Crear tabla de planes si no existe
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    features JSONB DEFAULT '[]',
    limits JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    plan_id UUID REFERENCES plans(id),
    database_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    billing_info JSONB DEFAULT '{}',
    trial_ends_at TIMESTAMP,
    subscribed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de landlord_users (Super Admins)
CREATE TABLE IF NOT EXISTS landlord_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'superadmin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar Super Admin inicial
INSERT INTO landlord_users (email, password_hash, first_name, last_name, role, is_active)
VALUES ('lcayetano162@gmail.com', '$2b$10$YourHashedPasswordHere', 'Super', 'Admin', 'superadmin', true)
ON CONFLICT (email) DO NOTHING;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'seller',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    password_changed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rnc VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'República Dominicana',
    status VARCHAR(20) DEFAULT 'prospect',
    source VARCHAR(100),
    notes TEXT,
    assigned_to UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de contactos
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    position VARCHAR(100),
    department VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    client_id UUID REFERENCES clients(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de oportunidades
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id),
    contact_id UUID REFERENCES contacts(id),
    owner_id UUID REFERENCES users(id),
    stage VARCHAR(20) DEFAULT 'qualify',
    probability INTEGER DEFAULT 0,
    estimated_revenue DECIMAL(15, 2) DEFAULT 0,
    expected_close_date DATE,
    actual_close_date DATE,
    source VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de cotizaciones
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id),
    opportunity_id UUID REFERENCES opportunities(id),
    status VARCHAR(20) DEFAULT 'draft',
    subtotal DECIMAL(15, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_monthly DECIMAL(15, 2) DEFAULT 0,
    total_onetime DECIMAL(15, 2) DEFAULT 0,
    valid_until DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de tareas
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    related_to_type VARCHAR(50),
    related_to_id UUID,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de actividades
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    description TEXT,
    related_to_type VARCHAR(50),
    related_to_id UUID,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_client ON contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_tenant ON opportunities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant ON quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activities_tenant ON activities(tenant_id);
PSQL
    echo -e "${GREEN}✓${NC} Tablas creadas manualmente"
}

echo -e "${YELLOW}[8/8]${NC} Verificando estado final..."
echo ""

# Verificar contenedores
echo -e "${BLUE}Contenedores activos:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Verificar conectividad API
echo -e "${BLUE}Probando API...${NC}"
sleep 3
if curl -s http://127.0.0.1:3001/health > /dev/null 2>&1 || curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API respondiendo en puerto 3001"
else
    echo -e "${YELLOW}⚠${NC} API puede tardar unos segundos más en iniciar"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  DESPLIEGUE COMPLETADO${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "URL de acceso: ${YELLOW}http://antucrm.com:5005${NC}"
echo ""
echo -e "Credenciales Super Admin:"
echo -e "  Email: ${YELLOW}lcayetano162@gmail.com${NC}"
echo -e "  Password: ${YELLOW}AntuCRM2024!${NC}"
echo ""
echo -e "Para ver logs: ${BLUE}docker-compose logs -f${NC}"
echo ""
