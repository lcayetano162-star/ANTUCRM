#!/bin/bash

# Script para probar la API del Cotizador MPS
# Uso: ./test-api.sh

BASE_URL="http://localhost:3001"

echo "======================================"
echo "🧪 Test API Cotizador MPS"
echo "======================================"
echo ""

# Test 1: Health Check
echo "1️⃣  Health Check..."
curl -s "$BASE_URL/health" | jq .
echo ""

# Test 2: Obtener ejemplo
echo "2️⃣  Obteniendo ejemplo de estructura..."
curl -s "$BASE_URL/api/mps/example" | jq .
echo ""

# Test 3: Calcular cotización simple
echo "3️⃣  Calculando cotización simple..."
curl -s -X POST "$BASE_URL/api/mps/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "oportunidadId": "OP-TEST-001",
    "modalidad": "renta",
    "plazoMeses": 36,
    "tasaInteresAnual": 16,
    "items": [
      {
        "codigo": "TEST001",
        "descripcion": "Equipo de prueba",
        "nivelPrecio": "precio_lista",
        "precioEquipo": 100000,
        "cxcBN": 0.01,
        "volumenBN": 1000,
        "cxcColor": 0.05,
        "volumenColor": 500
      }
    ]
  }' | jq .
echo ""

# Test 4: Calcular cotización con caso real (1x7200 + 9x8200)
echo "4️⃣  Calculando cotización con caso real (OP-017)..."
curl -s -X POST "$BASE_URL/api/mps/calculate" \
  -H "Content-Type: application/json" \
  -d @example-quote.json | jq .
echo ""

echo "======================================"
echo "✅ Tests completados"
echo "======================================"
