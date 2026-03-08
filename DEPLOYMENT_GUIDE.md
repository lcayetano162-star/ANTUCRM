# Guía de Despliegue - AntúCRM

## Correcciones Realizadas

### 1. Filtros Desbordados (FIXED)
Se corrigieron los filtros que mostraban texto fuera de los márgenes:

| Archivo | Filtro | Anterior | Nuevo |
|---------|--------|----------|-------|
| Opportunities.tsx | Etapas | w-48 | w-56 min-w-[14rem] |
| Tasks.tsx | Estados | w-40 | w-44 min-w-[11rem] |
| Tasks.tsx | Prioridades | w-40 | w-48 min-w-[12rem] |
| Tasks.tsx | Asignados | w-44 | w-52 min-w-[13rem] |
| MyPerformance.tsx | Período | w-36 | w-44 min-w-[11rem] |
| MyPerformance.tsx | Vendedor | w-48 | w-56 min-w-[14rem] |

## Estructura del Proyecto Validada

```
antucrm/
├── frontend/                    # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/          # Componentes UI y Layouts
│   │   │   ├── ui/              # Componentes shadcn/ui
│   │   │   ├── mps/             # Cotizador MPS
│   │   │   ├── Layout.tsx       # Layout principal
│   │   │   ├── SuperAdminLayout.tsx
│   │   │   └── ActivityModal.tsx
│   │   ├── pages/               # Páginas del CRM
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Clients.tsx
│   │   │   ├── Contacts.tsx     # NUEVO
│   │   │   ├── Opportunities.tsx
│   │   │   ├── Quotes.tsx
│   │   │   ├── Tasks.tsx
│   │   │   ├── Marketing.tsx
│   │   │   ├── MyPerformance.tsx # NUEVO
│   │   │   ├── Login.tsx
│   │   │   └── super-admin/     # Panel Super Admin
│   │   ├── services/
│   │   │   └── api.ts           # APIs del frontend
│   │   ├── store/
│   │   │   └── authStore.ts     # Estado de autenticación
│   │   ├── lib/
│   │   │   └── utils.ts         # Utilidades
│   │   ├── hooks/
│   │   │   └── use-toast.ts
│   │   ├── types/
│   │   │   └── mps.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/         # Controladores API
│   │   │   ├── mpsQuoteController.ts
│   │   │   ├── mpsConfigController.ts
│   │   │   ├── mpsApprovalController.ts
│   │   │   ├── performanceController.ts
│   │   │   └── activityController.ts
│   │   ├── services/            # Lógica de negocio
│   │   │   ├── mpsCalculatorService.ts
│   │   │   ├── performanceService.ts
│   │   │   └── activityService.ts
│   │   ├── routes/              # Rutas API
│   │   │   ├── mpsQuoteRoutes.ts
│   │   │   ├── performanceRoutes.ts
│   │   │   └── activityRoutes.ts
│   │   ├── middleware/          # Middlewares
│   │   │   ├── validation.ts
│   │   │   └── auth.ts
│   │   ├── config/
│   │   │   └── database.ts      # Configuración PostgreSQL
│   │   ├── database/migrations/ # Scripts SQL
│   │   │   ├── 001_create_user_quotas.sql
│   │   │   ├── 002_create_activities.sql
│   │   │   └── 003_add_activity_targets.sql
│   │   ├── types/
│   │   │   └── mpsQuote.ts
│   │   ├── utils/
│   │   │   └── formatters.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
└── MI_DESEMPENO.md              # Documentación del módulo
```

## Recomendaciones de Servidor

### Configuración Actual
```
Servidor: Ubuntu-S-1VCPU-1GB-35GB-Intel-ATL1-01
- 1 vCPU Intel
- 1 GB RAM
- 35 GB Disco
- Ubuntu 22.04 LTS
```

### Evaluación para CRM Multi-Tenant SaaS

#### ⚠️ RECOMENDACIÓN: **UPGRADE NECESARIO**

La configuración actual (1GB RAM + 1 vCPU) es **insuficiente** para un CRM multi-tenant SaaS en producción.

### Configuración Recomendada

#### Mínima Recomendada (para hasta 50 usuarios):
```
- CPU: 2 vCPUs
- RAM: 4 GB
- Disco: 50 GB SSD
- Sistema: Ubuntu 22.04 LTS ✓ (correcto)
```

#### Óptima (para hasta 200 usuarios):
```
- CPU: 4 vCPUs
- RAM: 8 GB
- Disco: 100 GB SSD
- Sistema: Ubuntu 22.04 LTS
```

#### Enterprise (para 500+ usuarios):
```
- CPU: 8 vCPUs
- RAM: 16 GB
- Disco: 200 GB SSD
- Sistema: Ubuntu 22.04 LTS
- Separar: Base de datos en instancia dedicada
```

### Justificación Técnica

| Componente | Uso de Recursos | Requerimiento |
|------------|-----------------|---------------|
| **PostgreSQL** | 512MB-1GB RAM mínimo | 1GB es insuficiente |
| **Node.js Backend** | 256-512MB RAM | Con carga, puede crecer |
| **Nginx** | 50-100MB RAM | Ligero |
| **Sistema** | 200-300MB RAM | Ubuntu base |
| **Buffer** | 20% extra | Para picos de carga |
| **TOTAL** | ~1.5-2GB RAM | **1GB NO ES SUFICIENTE** |

### Problemas Esperados con 1GB RAM

1. **OOM (Out of Memory)**: PostgreSQL será terminado por el sistema
2. **Swap excesivo**: Lentitud extrema
3. **Timeouts**: Las peticiones API fallarán
4. **Caídas del servicio**: Backend se reiniciará constantemente

## Pasos de Despliegue

### 1. Preparar el Servidor (con configuración actual)

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx
```

### 2. Configurar PostgreSQL

```bash
# Crear base de datos
sudo -u postgres createdb antucrm

# Crear usuario
sudo -u postgres createuser -P antucrm_user

# Ejecutar migraciones
psql -U antucrm_user -d antucrm -f backend/src/database/migrations/001_create_user_quotas.sql
psql -U antucrm_user -d antucrm -f backend/src/database/migrations/002_create_activities.sql
psql -U antucrm_user -d antucrm -f backend/src/database/migrations/003_add_activity_targets.sql
```

### 3. Desplegar Backend

```bash
cd /var/www/antucrm/backend

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales de producción

# Iniciar con PM2
pm2 start dist/server.js --name "antucrm-api"
pm2 save
pm2 startup
```

### 4. Desplegar Frontend

```bash
cd /var/www/antucrm/frontend

# Instalar dependencias
npm install

# Compilar para producción
npm run build

# Copiar a directorio de Nginx
sudo cp -r dist/* /var/www/html/
```

### 5. Configurar Nginx

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Configuración de Variables de Entorno

### Backend (.env)
```env
# Servidor
NODE_ENV=production
PORT=3001

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=antucrm
DB_USER=antucrm_user
DB_PASSWORD=tu_password_seguro

# JWT
JWT_SECRET=tu_clave_secreta_muy_larga_y_segura
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=https://tu-dominio.com
```

### Frontend (.env.production)
```env
VITE_API_URL=https://tu-dominio.com/api
```

## Checklist Pre-Despliegue

- [ ] Filtros corregidos (no desbordan)
- [ ] Migraciones SQL ejecutadas
- [ ] Variables de entorno configuradas
- [ ] Backend compila sin errores
- [ ] Frontend compila sin errores
- [ ] Nginx configurado
- [ ] SSL/TLS configurado (Let's Encrypt)
- [ ] PM2 configurado para auto-inicio
- [ ] Backups automatizados configurados
- [ ] Monitoreo configurado (opcional: Datadog/New Relic)

## Comandos Útiles

```bash
# Ver logs del backend
pm2 logs antucrm-api

# Reiniciar backend
pm2 restart antucrm-api

# Ver estado de PostgreSQL
sudo systemctl status postgresql

# Ver uso de recursos
htop

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Soporte

Para problemas de despliegue, verificar:
1. Logs de PM2: `pm2 logs`
2. Logs de Nginx: `/var/log/nginx/error.log`
3. Logs de PostgreSQL: `/var/log/postgresql/`
4. Uso de recursos: `free -h` y `df -h`
