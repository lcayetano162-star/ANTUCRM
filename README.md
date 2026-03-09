# ANTU CRM - Enterprise MVP (Canon RD) 🚀

## 🚆 Despliegue "Tren Bala" (Producción)
Este repositorio está preparado para un despliegue rápido y seguro en producción.

### Guía de Inicio Rápido
1.  **Generar Llaves**: `node scripts/generate-production-keys.js`
2.  **Configurar `.env`**: Usa los valores generados.
3.  **Check de Salud**: `node scripts/system-health-check.js`
4.  **Desplegar**: `docker-compose up -d --build`

Ver [SOLUCION-COMPLETA-PRODUCCION.md](./SOLUCION-COMPLETA-PRODUCCION.md) para la guía detallada.
Ver [ANTHROPIC-SETUP-GUIDE.md](./ANTHROPIC-SETUP-GUIDE.md) para configurar la IA.

---

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

> **Enterprise-grade CRM Backend** built with NestJS for Canon RD. Features multi-tenancy with Row Level Security (RLS), JWT RS256 authentication, comprehensive audit logging, and RBAC authorization.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### 🔐 Authentication & Authorization
- **JWT RS256** asymmetric token signing
- **Multi-tenant** architecture with tenant isolation
- **RBAC** (Role-Based Access Control) with role hierarchy
- **Row Level Security (RLS)** at database level
- **Refresh token** rotation with secure storage
- **Account lockout** after failed login attempts
- **Invitation system** for user onboarding

### 🏢 Multi-Tenancy
- **Tenant isolation** via PostgreSQL RLS policies
- **AsyncLocalStorage** for request-scoped tenant context
- **Automatic tenant context** propagation through Prisma

### 📊 CRM Features
- **Contacts** management with custom fields
- **Companies** with hierarchy support
- **Opportunities** with pipeline stages
- **Activities** (calls, meetings, tasks, emails)
- **Documents** with file upload support
- **Products** and pricing
- **Tags** for organization
- **Custom fields** for extensibility

### 🛡️ Security & Compliance
- **Helmet** for security headers
- **Rate limiting** with Throttler
- **Input validation** with Zod schemas
- **SQL injection** prevention via Prisma
- **XSS protection** and CORS configuration
- **Audit logging** for all mutations
- **Data encryption** at rest

### 📈 Observability
- **Health checks** (`/health`, `/ready`, `/metrics`)
- **Structured logging** with configurable levels
- **Request/Response** interceptors
- **Performance monitoring**

## 🏗️ Architecture

```
├── src/
│   ├── auth/              # Authentication module
│   │   ├── decorators/    # @CurrentUser, @RequirePermissions
│   │   ├── dto/           # Login, Register, Refresh DTOs
│   │   ├── guards/        # JwtAuthGuard, TenantGuard, RolesGuard
│   │   └── strategies/    # JWT RS256 strategy
│   ├── common/            # Shared utilities
│   │   ├── filters/       # Global exception filter
│   │   ├── interceptors/  # Audit logging, Transform
│   │   ├── middleware/    # Tenant context middleware
│   │   └── pipes/         # Zod validation pipe
│   ├── config/            # Application configuration
│   ├── health/            # Health check endpoints
│   └── prisma/            # Prisma client with RLS
├── prisma/
│   └── schema.prisma      # Database schema
├── secrets/               # JWT keys (not in git)
└── docker-compose.yml     # Local development stack
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- OpenSSL (for generating JWT keys)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd antu-crm-backend

# Copy environment file
cp .env.example .env

# Generate JWT RSA keys
mkdir -p secrets
openssl genrsa -out secrets/jwt_private_key.pem 4096
openssl rsa -in secrets/jwt_private_key.pem -pubout -out secrets/jwt_public_key.pem
```

### 2. Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec api npx prisma migrate dev

# Seed initial data (optional)
docker-compose exec api npx prisma db seed
```

### 3. Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/register` | User registration |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | User logout |
| POST | `/api/v1/auth/invite` | Invite new user |
| POST | `/api/v1/auth/accept-invite` | Accept invitation |

### Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/ready` | Readiness probe |
| GET | `/metrics` | Prometheus metrics |

### Example Login Request

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-slug" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

### Example Response

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN",
    "tenantId": "tenant-uuid"
  }
}
```

## 🔒 Security

### JWT RS256 Configuration

The application uses asymmetric RSA keys for JWT signing:

- **Private Key**: Used to sign tokens (kept secret)
- **Public Key**: Used to verify tokens (can be shared)

Keys are loaded from the `/secrets` directory at runtime.

### Row Level Security (RLS)

PostgreSQL RLS policies ensure tenant data isolation:

```sql
-- Example RLS policy
CREATE POLICY tenant_isolation ON contacts
  USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

The tenant context is automatically set via `AsyncLocalStorage` on each request.

### Role Hierarchy

```
SUPER_ADMIN > ADMIN > MANAGER > USER > VIEWER
```

Permissions cascade down the hierarchy.

## 🚢 Deployment

### Production Build

```bash
# Build production image
docker build --target production -t antu-crm:latest .

# Run with production profile
docker-compose --profile production up -d
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Application port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `SECRETS_PATH` | Path to JWT keys | `/secrets` |
| `JWT_ACCESS_EXPIRATION` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL | `7d` |

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: antu-crm-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: antu-crm-api
  template:
    metadata:
      labels:
        app: antu-crm-api
    spec:
      containers:
        - name: api
          image: antu-crm:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
          volumeMounts:
            - name: jwt-keys
              mountPath: /secrets
              readOnly: true
      volumes:
        - name: jwt-keys
          secret:
            secretName: jwt-keys
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📄 License

Copyright © 2024 Canon RD. All rights reserved.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  <strong>Built with ❤️ by Canon RD Team</strong>
</p>
