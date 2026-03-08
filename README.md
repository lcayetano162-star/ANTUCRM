# Antü CRM - Multi-Tenant SaaS

Sistema CRM completo con arquitectura multi-tenant (SaaS) que permite gestionar múltiples empresas desde un panel central de Super Admin.

## Características

### Panel de Super Admin (Landlord)
- **Dashboard**: Estadísticas del sistema
- **Planes**: Gestión de planes de suscripción
- **Empresas**: Crear, suspender, activar tenants
- **Super Admins**: Gestión de administradores del sistema

### CRM por Tenant
- **Clientes**: Prospectos, clientes, archivados
- **Oportunidades**: Pipeline de ventas completo
- **Cotizaciones**: Presupuestos y propuestas
- **Tareas**: Gestión de actividades

## Tecnologías

### Backend
- Node.js + Express
- PostgreSQL
- JWT Authentication
- bcrypt.js para hashing

### Frontend
- React + TypeScript
- Tailwind CSS
- shadcn/ui components
- Zustand para estado
- Axios para API calls

## Instalación

### 1. Clonar y configurar

```bash
cd antucrm
```

### 2. Configurar Base de Datos

Asegúrate de tener PostgreSQL instalado y ejecuta:

```bash
# Crear base de datos
createdb antucrm_production

# Configurar variables de entorno en .env
```

### 3. Instalar dependencias Backend

```bash
cd api
npm install
```

### 4. Ejecutar migraciones y seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Instalar dependencias Frontend

```bash
cd ../frontend
npm install
```

### 6. Iniciar desarrollo

Terminal 1 (Backend):
```bash
cd api
npm start
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## Credenciales de Demo

### Super Admin
- **Email**: lcayetano162@gmail.com
- **Password**: AntuCRM2024!

### Admin de Tenant
- **Email**: admin@antucrm.com
- **Password**: admin123

### Vendedor
- **Email**: vendedor@antucrm.com
- **Password**: vendedor123

## Estructura del Proyecto

```
antucrm/
├── api/                    # Backend Node.js
│   ├── src/
│   │   ├── config/        # Configuración DB
│   │   ├── middleware/    # Auth middleware
│   │   ├── routes/
│   │   │   ├── super-admin/  # Rutas Super Admin
│   │   │   └── ...          # Rutas tenant
│   │   └── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/              # React Frontend
│   ├── src/
│   │   ├── components/   # UI Components
│   │   ├── pages/        # Páginas
│   │   │   └── super-admin/  # Panel Super Admin
│   │   ├── services/     # API calls
│   │   └── store/        # Estado global
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Cambiar contraseña

### Super Admin
- `GET /api/super-admin/dashboard` - Estadísticas
- `GET /api/super-admin/plans` - Listar planes
- `POST /api/super-admin/plans` - Crear plan
- `GET /api/super-admin/tenants` - Listar tenants
- `POST /api/super-admin/tenants` - Crear tenant
- `GET /api/super-admin/admins` - Listar admins
- `POST /api/super-admin/admins` - Crear admin

### Tenant
- `GET /api/clients` - Listar clientes
- `GET /api/opportunities` - Listar oportunidades
- `GET /api/quotes` - Listar cotizaciones
- `GET /api/tasks` - Listar tareas

## Docker

Para ejecutar con Docker:

```bash
docker-compose up -d
```

Esto iniciará:
- Frontend en http://localhost:8080
- API en http://localhost:3001
- PostgreSQL en localhost:5432

## Licencia

Derechos Reservados - Antü CRM
