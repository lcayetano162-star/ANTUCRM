#!/bin/bash
# ============================================
# Script de verificación del servidor
# ANTU CRM Enterprise
# ============================================

set -e

echo "=========================================="
echo "ANTU CRM - Server Verification"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir resultados
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# 1. Verificar Docker
echo "1. Checking Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_status 0 "Docker installed: $DOCKER_VERSION"
else
    print_status 1 "Docker not installed"
    echo "   Install: apt update && apt install -y docker.io"
fi

# 2. Verificar Docker Compose
echo ""
echo "2. Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_status 0 "Docker Compose installed: $COMPOSE_VERSION"
elif docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    print_status 0 "Docker Compose (plugin) installed: $COMPOSE_VERSION"
else
    print_status 1 "Docker Compose not installed"
    echo "   Install: apt install -y docker-compose-plugin"
fi

# 3. Verificar puertos
echo ""
echo "3. Checking ports..."
PORTS=(80 443 3001)
for PORT in "${PORTS[@]}"; do
    if netstat -tuln | grep -q ":$PORT "; then
        PROCESS=$(netstat -tulnp 2>/dev/null | grep ":$PORT " | awk '{print $7}' | cut -d'/' -f1)
        print_status 1 "Port $PORT is in use by PID: $PROCESS"
    else
        print_status 0 "Port $PORT is available"
    fi
done

# 4. Verificar directorio de deploy
echo ""
echo "4. Checking deployment directory..."
if [ -d "/opt/antucrm" ]; then
    print_status 0 "Directory /opt/antucrm exists"
    ls -la /opt/antucrm
else
    print_status 1 "Directory /opt/antucrm does not exist"
    echo "   Create: mkdir -p /opt/antucrm"
fi

# 5. Verificar archivo .env
echo ""
echo "5. Checking environment file..."
if [ -f "/opt/antucrm/.env" ]; then
    print_status 0 ".env file exists"
    echo "   Variables configured:"
    grep -E "^[A-Z_]+=" /opt/antucrm/.env | wc -l
else
    print_status 1 ".env file does not exist"
    echo "   The GitHub Actions workflow will create it"
fi

# 6. Verificar SSH
echo ""
echo "6. Checking SSH..."
if systemctl is-active --quiet sshd; then
    print_status 0 "SSH service is running"
else
    print_status 1 "SSH service is not running"
    echo "   Start: systemctl start sshd"
fi

# 7. Verificar clave SSH
echo ""
echo "7. Checking SSH authorized keys..."
if [ -f "$HOME/.ssh/authorized_keys" ]; then
    KEY_COUNT=$(wc -l < "$HOME/.ssh/authorized_keys")
    print_status 0 "Found $KEY_COUNT authorized keys"
else
    print_status 1 "No authorized_keys file found"
    echo "   Create: mkdir -p ~/.ssh && touch ~/.ssh/authorized_keys"
fi

# 8. Verificar espacio en disco
echo ""
echo "8. Checking disk space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -lt 80 ]; then
    print_status 0 "Disk usage: ${DISK_USAGE}%"
else
    print_status 1 "Disk usage: ${DISK_USAGE}% (WARNING: Running low on space)"
fi

# 9. Verificar memoria
echo ""
echo "9. Checking memory..."
MEMORY_INFO=$(free -h | awk 'NR==2{printf "Used: %s / Total: %s (%.2f%%)", $3,$2,$3*100/$2 }')
echo "   $MEMORY_INFO"

# 10. Verificar conectividad a la base de datos
echo ""
echo "10. Checking database connectivity..."
if [ -f "/opt/antucrm/.env" ]; then
    source /opt/antucrm/.env
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
            print_status 0 "Database connection successful"
        else
            print_status 1 "Database connection failed"
            echo "   Check DATABASE_URL in .env file"
        fi
    else
        print_status 1 "psql not installed (optional)"
    fi
else
    print_status 1 "Cannot check database (no .env file)"
fi

# 11. Verificar contenedores si existen
echo ""
echo "11. Checking Docker containers..."
if [ -f "/opt/antucrm/docker-compose.prod.yml" ]; then
    cd /opt/antucrm
    if docker compose -f docker-compose.prod.yml ps &> /dev/null; then
        CONTAINERS=$(docker compose -f docker-compose.prod.yml ps -q | wc -l)
        if [ "$CONTAINERS" -gt 0 ]; then
            print_status 0 "Running containers: $CONTAINERS"
            docker compose -f docker-compose.prod.yml ps
        else
            print_status 1 "No containers running"
        fi
    else
        print_status 1 "Docker Compose not configured"
    fi
else
    print_status 1 "docker-compose.prod.yml not found"
fi

echo ""
echo "=========================================="
echo "Verification Complete"
echo "=========================================="
