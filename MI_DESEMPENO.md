# Módulo Mi Desempeño - AntuCRM

## Descripción

El módulo **Mi Desempeño** permite a los vendedores y gerentes de AntuCRM visualizar y hacer seguimiento de las métricas de rendimiento de ventas, incluyendo cumplimiento de cuotas y actividades comerciales.

## Características

### Para Vendedores
- **Cuotas de Venta**: Visualización de cuota mensual y anual con porcentaje de cumplimiento
- **Actividades**: Seguimiento de llamadas, visitas, correos y oportunidades creadas
- **Histórico**: Historial de desempeño de los últimos 6 meses
- **Oportunidades**: Estadísticas de oportunidades ganadas, perdidas y en pipeline

### Para Gerentes y Administradores
- **Vista de Equipo**: Acceso al desempeño de todos los vendedores
- **Comparativas**: Comparación de métricas entre miembros del equipo
- **Gestión de Cuotas**: Capacidad para actualizar cuotas individuales

## Estructura de Archivos

### Frontend
```
frontend/src/
├── pages/
│   └── MyPerformance.tsx          # Página principal de desempeño
├── components/
│   └── ActivityModal.tsx          # Modal para registrar actividades
├── services/
│   └── api.ts                     # APIs de performance y actividades
```

### Backend
```
backend/src/
├── controllers/
│   ├── performanceController.ts   # Controlador de métricas
│   └── activityController.ts      # Controlador de actividades
├── services/
│   ├── performanceService.ts      # Lógica de métricas
│   └── activityService.ts         # Lógica de actividades
├── routes/
│   ├── performanceRoutes.ts       # Rutas de performance
│   └── activityRoutes.ts          # Rutas de actividades
└── database/migrations/
    ├── 001_create_user_quotas.sql # Tabla de cuotas
    ├── 002_create_activities.sql  # Tabla de actividades
    └── 003_add_activity_targets.sql # Targets de actividades
```

## API Endpoints

### Performance
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/performance/metrics` | Obtener métricas de un usuario |
| GET | `/api/performance/team` | Obtener métricas del equipo (solo managers) |
| GET | `/api/performance/history` | Obtener histórico de desempeño |
| PUT | `/api/performance/quota` | Actualizar cuota (solo managers) |

### Activities
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/activities` | Crear una nueva actividad |
| GET | `/api/activities` | Listar actividades con filtros |
| GET | `/api/activities/stats` | Obtener estadísticas |
| GET | `/api/activities/by-user/:userId` | Actividades de un usuario |
| GET | `/api/activities/by-related/:type/:id` | Actividades relacionadas |
| DELETE | `/api/activities/:id` | Eliminar actividad |

## Tipos de Actividades

- **call**: Llamada telefónica
- **visit**: Visita presencial
- **email**: Correo electrónico
- **whatsapp**: Mensaje de WhatsApp
- **note**: Nota o comentario

## Registro de Actividades

Las actividades pueden registrarse desde:
- **Módulo de Clientes**: Botón "Registrar Actividad" en el menú de acciones
- **Módulo de Contactos**: Botón "Registrar Actividad" en el menú de acciones
- **Módulo de Oportunidades**: Botón "Actividad" en la columna de acciones

## Base de Datos

### Tabla: user_quotas
```sql
- user_id (UUID, FK)
- monthly_quota (DECIMAL)
- yearly_quota (DECIMAL)
- calls_target (INTEGER)
- visits_target (INTEGER)
- emails_target (INTEGER)
- opportunities_target (INTEGER)
```

### Tabla: activities
```sql
- id (UUID, PK)
- type (ENUM: call, visit, email, whatsapp, note)
- description (TEXT)
- duration (INTEGER, minutos)
- outcome (TEXT)
- related_type (ENUM: client, opportunity, contact)
- related_id (UUID)
- user_id (UUID, FK)
- created_at (TIMESTAMP)
```

## Permisos

| Rol | Ver propio | Ver equipo | Actualizar cuotas |
|-----|------------|------------|-------------------|
| Vendedor | ✅ | ❌ | ❌ |
| Gerente | ✅ | ✅ | ✅ |
| Administrador | ✅ | ✅ | ✅ |

## Instalación

1. Ejecutar migraciones de base de datos:
```bash
cd backend
psql -U postgres -d antucrm -f src/database/migrations/001_create_user_quotas.sql
psql -U postgres -d antucrm -f src/database/migrations/002_create_activities.sql
psql -U postgres -d antucrm -f src/database/migrations/003_add_activity_targets.sql
```

2. Instalar dependencias del backend:
```bash
cd backend
npm install
```

3. Configurar variables de entorno:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=antucrm
DB_USER=postgres
DB_PASSWORD=password
```

4. Iniciar el servidor:
```bash
npm run dev
```

## Uso

### Acceder al módulo
1. Iniciar sesión en AntuCRM
2. Hacer clic en "Mi Desempeño" en el menú lateral

### Registrar una actividad
1. Ir a Clientes, Contactos u Oportunidades
2. Hacer clic en el menú de acciones (tres puntos)
3. Seleccionar "Registrar Actividad"
4. Completar el formulario y guardar

### Ver desempeño del equipo (solo gerentes)
1. Ir a "Mi Desempeño"
2. Usar el selector de vendedor en la parte superior
3. Seleccionar un miembro del equipo

## Notas

- Los datos de desempeño se calculan en tiempo real
- Las cuotas por defecto son: Mensual $500,000 / Anual $6,000,000
- Los targets de actividades por defecto son: 60 llamadas, 20 visitas, 100 correos, 10 oportunidades
