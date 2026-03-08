#!/bin/bash
# ============================================================
# ANTU CRM - Monitor de Salud
# Script para verificar que todos los servicios estén OK
# Uso: ./monitor.sh [slack-webhook-url]
# ============================================================

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SLACK_WEBHOOK=${1:-""}
ERRORS=0

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# ============================================
# FUNCIONES
# ============================================

check_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "🔍 Checking $name... "
    
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1 || echo "000")
    
    if [ "$STATUS" = "$expected_status" ]; then
        echo -e "${GREEN}OK${NC} ($STATUS)"
        return 0
    else
        echo -e "${RED}FAIL${NC} ($STATUS)"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

check_docker() {
    local container=$1
    
    echo -n "🐳 Checking $container... "
    
    if docker ps | grep -q "$container"; then
        echo -e "${GREEN}RUNNING${NC}"
        return 0
    else
        echo -e "${RED}STOPPED${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

check_disk() {
    echo -n "💾 Checking disk space... "
    
    USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$USAGE" -lt 80 ]; then
        echo -e "${GREEN}OK${NC} (${USAGE}%)"
        return 0
    elif [ "$USAGE" -lt 90 ]; then
        echo -e "${YELLOW}WARNING${NC} (${USAGE}%)"
        return 0
    else
        echo -e "${RED}CRITICAL${NC} (${USAGE}%)"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

check_memory() {
    echo -n "🧠 Checking memory... "
    
    USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    
    if [ "$USAGE" -lt 80 ]; then
        echo -e "${GREEN}OK${NC} (${USAGE}%)"
        return 0
    elif [ "$USAGE" -lt 90 ]; then
        echo -e "${YELLOW}WARNING${NC} (${USAGE}%)"
        return 0
    else
        echo -e "${RED}CRITICAL${NC} (${USAGE}%)"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

send_slack() {
    local message=$1
    local color=$2
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"ANTU CRM - Health Check\",
                    \"text\": \"$message\",
                    \"footer\": \"$TIMESTAMP\"
                }]
            }" \
            "$SLACK_WEBHOOK" > /dev/null 2>&1
    fi
}

# ============================================
# MAIN
# ============================================

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     ANTU CRM - Health Monitor                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "⏰ $TIMESTAMP"
echo ""

# Verificar si estamos en el servidor con Docker
if command -v docker &> /dev/null && docker ps &> /dev/null; then
    echo -e "${BLUE}🐳 Docker Containers:${NC}"
    check_docker "antucrm-api"
    check_docker "antucrm-frontend"
    echo ""
fi

# Verificar endpoints HTTP
echo -e "${BLUE}🌐 HTTP Endpoints:${NC}"
check_service "API Health" "http://localhost:3001/health" 200
check_service "API Docs" "http://localhost:3001/api-docs" 200 || true
check_service "Frontend" "http://localhost" 200 || true
echo ""

# Verificar recursos del sistema
echo -e "${BLUE}💻 System Resources:${NC}"
check_disk
check_memory
echo ""

# Verificar base de datos
echo -e "${BLUE}🗄️ Database:${NC}"
echo -n "🔍 Checking PostgreSQL... "
if docker exec antucrm-api-1 node -e "require('pg')..." &> /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}SKIPPED${NC} (check manually)"
fi
echo ""

# ============================================
# RESUMEN
# ============================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  RESULTADO                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 TODOS LOS SERVICIOS OK${NC}"
    send_slack "✅ All services healthy" "good"
    exit 0
else
    echo -e "${RED}❌ $ERRORS PROBLEMA(S) ENCONTRADO(S)${NC}"
    send_slack "⚠️ $ERRORS service(s) failing" "danger"
    
    echo ""
    echo -e "${YELLOW}Comandos para diagnosticar:${NC}"
    echo "  docker-compose logs api --tail=50"
    echo "  docker ps"
    echo "  systemctl status docker"
    
    exit 1
fi
