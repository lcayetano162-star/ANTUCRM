#!/bin/bash
# Script de verificación final del despliegue

echo "═══════════════════════════════════════════════════════════════"
echo "  VERIFICACIÓN FINAL - ANTUCRM"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

echo "[1] Verificando contenedores..."
if docker ps | grep -q "antucrm"; then
    echo -e "${GREEN}✓${NC} Contenedores de AntuCRM encontrados"
    docker ps --filter "name=antucrm" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${RED}✗${NC} No se encontraron contenedores de AntuCRM"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "[2] Verificando API..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")
if [ "$API_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓${NC} API respondiendo correctamente (HTTP 200)"
elif [ "$API_RESPONSE" = "000" ]; then
    echo -e "${RED}✗${NC} API no accesible en localhost:3001"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${YELLOW}⚠${NC} API respondió con HTTP $API_RESPONSE"
fi
echo ""

echo "[3] Verificando Frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5005 2>/dev/null || echo "000")
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Frontend respondiendo correctamente (HTTP 200)"
elif [ "$FRONTEND_RESPONSE" = "000" ]; then
    echo -e "${RED}✗${NC} Frontend no accesible en localhost:5005"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${YELLOW}⚠${NC} Frontend respondió con HTTP $FRONTEND_RESPONSE"
fi
echo ""

echo "[4] Verificando PostgreSQL..."
if docker-compose exec -T postgres pg_isready -U antucrm_admin -d antucrm_production > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL está listo y aceptando conexiones"
else
    echo -e "${RED}✗${NC} PostgreSQL no responde"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "[5] Verificando tablas en base de datos..."
TABLE_COUNT=$(docker-compose exec -T postgres psql -U antucrm_admin -d antucrm_production -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
if [ -n "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Se encontraron $TABLE_COUNT tablas en la base de datos"
else
    echo -e "${RED}✗${NC} No se encontraron tablas (las migraciones pueden haber fallado)"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "═══════════════════════════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ TODAS LAS VERIFICACIONES PASARON${NC}"
    echo ""
    echo "🌐 La aplicación debería estar accesible en:"
    echo "   http://antucrm.com:5005"
    echo ""
    echo "🔐 Credenciales Super Admin:"
    echo "   Email: lcayetano162@gmail.com"
    echo "   Password: AntuCRM2024!"
else
    echo -e "${RED}❌ SE ENCONTRARON $ERRORS PROBLEMA(S)${NC}"
    echo ""
    echo "Ejecute: ./diagnose.sh para más detalles"
fi
echo "═══════════════════════════════════════════════════════════════"

exit $ERRORS
