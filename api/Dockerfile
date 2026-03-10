# ============================================
# ANTU CRM API - Dockerfile (Simplificado)
# ============================================

FROM node:20-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache wget

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias (incluyendo devDependencies para build)
RUN npm install --force && npm cache clean --force

# Copiar código fuente
COPY . .

# Generar cliente Prisma
RUN npx prisma generate

# Build de la aplicación
RUN npx nest build

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

# Comando de inicio
CMD ["node", "dist/main.js"]
