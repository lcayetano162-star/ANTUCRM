#!/bin/bash
# Script de diagnóstico de red y conectividad para AntuCRM

echo "═══════════════════════════════════════════════════════════════"
echo "  DIAGNÓSTICO DE RED - ANTUCRM"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "[1] Contenedores Docker:"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.State}}"
echo ""

echo "[2] Redes Docker disponibles:"
docker network ls
echo ""

echo "[3] Inspección de red antucrm:"
docker network inspect antucrm_antucrm-network 2>/dev/null || docker network inspect $(docker network ls -q | head -5) 2>/dev/null | head -50
echo ""

echo "[4] IPs de contenedores:"
docker inspect -f '{{.Name}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(docker ps -aq) 2>/dev/null || echo "No se pudieron obtener IPs"
echo ""

echo "[5] Verificando PostgreSQL internamente:"
docker-compose exec -T postgres sh -c 'pg_isready -U antucrm_admin -d antucrm_production' 2>&1 || echo "PostgreSQL no responde"
echo ""

echo "[6] Verificando conexión desde API a PostgreSQL:"
docker-compose exec -T api sh -c 'nc -zv postgres 5432' 2>&1 || echo "No hay conectividad a postgres:5432"
echo ""

echo "[7] Logs de PostgreSQL (últimas 20 líneas):"
docker-compose logs --tail=20 postgres 2>&1 || echo "No se pudieron obtener logs"
echo ""

echo "[8] Logs de API (últimas 20 líneas):"
docker-compose logs --tail=20 api 2>&1 || echo "No se pudieron obtener logs"
echo ""

echo "[9] Variables de entorno en API:"
docker-compose exec -T api sh -c 'echo DB_HOST=$DB_HOST, DB_PORT=$DB_PORT, DB_NAME=$DB_NAME' 2>&1 || echo "No se pudieron leer variables"
echo ""

echo "═══════════════════════════════════════════════════════════════"
