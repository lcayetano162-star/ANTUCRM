# ================================================
# ANTU CRM API - Dockerfile Production
# ================================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias de build
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:20-alpine

# Crear usuario no-root para seguridad
RUN addgroup -g 1000 -S nodejs && \
    adduser -u 1000 -S nodejs -G nodejs

WORKDIR /app

# Crear directorios necesarios con permisos correctos
RUN mkdir -p /app/uploads /app/logs && \
    chown -R nodejs:nodejs /app

# Instalar dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar archivos compilados
COPY --from=builder /app/dist ./dist

# Cambiar a usuario no-root (seguridad)
USER nodejs

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "dist/server.js"]
