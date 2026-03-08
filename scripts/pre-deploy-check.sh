#!/bin/bash
# ============================================================
# ANTU CRM - Pre-Deploy Check
# Script para ejecutar LOCALMENTE antes de hacer push
# Verifica que todo esté listo para producción
# ============================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
ERRORS=0
WARNINGS=0

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     ANTU CRM - Pre-Deploy Check                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Función para imprimir resultados
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅${NC} $2"
    else
        echo -e "${RED}❌${NC} $2"
        ERRORS=$((ERRORS + 1))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# ============================================
# 1. VERIFICAR ESTRUCTURA DE ARCHIVOS
# ============================================
echo -e "${BLUE}📁 Verificando estructura de archivos...${NC}"

REQUIRED_FILES=(
    "api/Dockerfile"
    "api/.dockerignore"
    "api/tsconfig.json"
    "api/tsconfig.build.json"
    "api/package.json"
    "api/package-lock.json"
    "docker-compose.yml"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file NO EXISTE"
        ERRORS=$((ERRORS + 1))
    fi
done

# ============================================
# 2. VERIFICAR package-lock.json
# ============================================
echo ""
echo -e "${BLUE}📦 Verificando sincronización de dependencias...${NC}"

cd api

# Verificar que package-lock.json exista y esté sincronizado
if [ ! -f "package-lock.json" ]; then
    print_status 1 "package-lock.json no existe"
    echo -e "  ${YELLOW}💡 Ejecuta: npm install${NC}"
else
    # Verificar sincronización
    npm ls --silent > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status 0 "package-lock.json está sincronizado"
    else
        print_warning "package-lock.json puede estar desfasado"
        echo -e "  ${YELLOW}💡 Ejecuta: rm -rf node_modules package-lock.json && npm install${NC}"
    fi
fi

# ============================================
# 3. INSTALAR DEPENDENCIAS
# ============================================
echo ""
echo -e "${BLUE}📦 Instalando dependencias (fresh install)...${NC}"

rm -rf node_modules
npm ci

if [ $? -eq 0 ]; then
    print_status 0 "npm ci exitoso"
else
    print_status 1 "npm ci falló"
    exit 1
fi

# ============================================
# 4. COMPILAR TYPESCRIPT
# ============================================
echo ""
echo -e "${BLUE}🏗️ Compilando TypeScript...${NC}"

npm run build

if [ $? -eq 0 ] && [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    print_status 0 "Build exitoso"
    echo -e "  ${GREEN}📁 Archivos generados:${NC}"
    ls -1 dist/ | head -5 | sed 's/^/     - /'
    [ $(ls dist/ | wc -l) -gt 5 ] && echo "     ... y $(($(ls dist/ | wc -l) - 5)) archivos más"
else
    print_status 1 "Build falló o no generó archivos"
    exit 1
fi

# ============================================
# 5. VERIFICAR .env.production
# ============================================
echo ""
echo -e "${BLUE}🔐 Verificando configuración de producción...${NC}"

cd ..

if [ -f "frontend/.env.production" ]; then
    VITE_API_URL=$(grep VITE_API_URL frontend/.env.production | cut -d= -f2)
    if [[ $VITE_API_URL == *"localhost"* ]] || [[ $VITE_API_URL == *"127.0.0.1"* ]]; then
        print_warning "VITE_API_URL apunta a localhost: $VITE_API_URL"
        echo -e "  ${YELLOW}💡 Actualiza con la IP de tu servidor${NC}"
    else
        print_status 0 "VITE_API_URL configurado: $VITE_API_URL"
    fi
else
    print_status 1 "frontend/.env.production no existe"
    echo -e "  ${YELLOW}💡 Crea el archivo con VITE_API_URL=http://TU_SERVIDOR:3000/api${NC}"
fi

# ============================================
# 6. VERIFICAR SENSITIVE FILES
# ============================================
echo ""
echo -e "${BLUE}🔒 Verificando archivos sensibles...${NC}"

SENSITIVE_FILES=(
    ".env"
    "api/.env"
    "frontend/.env"
)

for file in "${SENSITIVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_warning "$file existe (no debe subirse a git)"
        echo -e "  ${YELLOW}💡 Agrega a .gitignore${NC}"
    fi
done

# Verificar .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        print_status 0 ".env está en .gitignore"
    else
        print_warning ".env NO está en .gitignore"
    fi
else
    print_status 1 ".gitignore no existe"
fi

# ============================================
# 7. VERIFICAR DOCKER
# ============================================
echo ""
echo -e "${BLUE}🐳 Verificando configuración Docker...${NC}"

if command -v docker &> /dev/null; then
    print_status 0 "Docker instalado"
    
    if command -v docker-compose &> /dev/null; then
        print_status 0 "Docker Compose instalado"
    else
        print_warning "Docker Compose no encontrado"
    fi
else
    print_warning "Docker no instalado (solo necesario para test local)"
fi

# Verificar que Dockerfile tenga USER
if grep -q "USER" api/Dockerfile; then
    print_status 0 "Dockerfile usa usuario no-root"
else
    print_warning "Dockerfile no especifica USER (seguridad)"
fi

# ============================================
# 8. TEST BUILD DOCKER (OPCIONAL)
# ============================================
echo ""
echo -e "${BLUE}🐳 Probando build de Docker (puede tomar tiempo)...${NC}"

read -p "¿Probar build de Docker? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd api
    docker build -t antucrm-api:test .
    
    if [ $? -eq 0 ]; then
        print_status 0 "Docker build exitoso"
        docker rmi antucrm-api:test > /dev/null 2>&1
    else
        print_status 1 "Docker build falló"
    fi
    cd ..
else
    echo -e "  ${YELLOW}⏭️ Saltando test de Docker${NC}"
fi

# ============================================
# RESUMEN
# ============================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  RESUMEN                               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 TODO LISTO PARA DEPLOY!${NC}"
    echo ""
    echo -e "${GREEN}Puedes hacer push a main:${NC}"
    echo -e "  git add ."
    echo -e "  git commit -m 'ready for deploy'"
    echo -e "  git push origin main"
    echo ""
    echo -e "${GREEN}El pipeline CI/CD se encargará del resto.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  LISTO con advertencias${NC}"
    echo ""
    echo -e "${YELLOW}Puedes hacer deploy pero revisa las advertencias.${NC}"
    echo -e "  Errores: ${RED}0${NC}"
    echo -e "  Advertencias: ${YELLOW}$WARNINGS${NC}"
    exit 0
else
    echo -e "${RED}❌ NO LISTO - Corrige los errores antes de deploy${NC}"
    echo ""
    echo -e "  Errores: ${RED}$ERRORS${NC}"
    echo -e "  Advertencias: ${YELLOW}$WARNINGS${NC}"
    echo ""
    echo -e "${YELLOW}Correcciones sugeridas:${NC}"
    echo -e "  1. npm install (regenera package-lock.json)"
    echo -e "  2. Verificar que todos los archivos existan"
    echo -e "  3. Configurar frontend/.env.production"
    exit 1
fi
