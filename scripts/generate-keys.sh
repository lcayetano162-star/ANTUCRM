#!/bin/bash
# Script para generar claves JWT RSA

SECRETS_DIR="${1:-./secrets}"

echo "Generando claves JWT en $SECRETS_DIR..."

mkdir -p "$SECRETS_DIR"

# Generar clave privada
openssl genrsa -out "$SECRETS_DIR/jwt_private_key.pem" 4096 2>/dev/null

# Generar clave pública
openssl rsa -in "$SECRETS_DIR/jwt_private_key.pem" -pubout -out "$SECRETS_DIR/jwt_public_key.pem" 2>/dev/null

echo "✅ Claves generadas exitosamente:"
echo "   - $SECRETS_DIR/jwt_private_key.pem"
echo "   - $SECRETS_DIR/jwt_public_key.pem"
