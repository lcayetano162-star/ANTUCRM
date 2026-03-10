# ============================================
# ANTU CRM Frontend - Dockerfile
# Multi-stage build para React + Nginx
# ============================================

# --------------------------------------------
# Stage 1: Build
# --------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Argumentos de build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# --------------------------------------------
# Stage 2: Production (Nginx)
# --------------------------------------------
FROM nginx:alpine AS production

# Instalar wget para healthcheck
RUN apk add --no-cache wget

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar build de React
COPY --from=builder /app/dist /usr/share/nginx/html

# Crear directorio para SSL (opcional)
RUN mkdir -p /etc/nginx/ssl

# Exponer puertos
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
