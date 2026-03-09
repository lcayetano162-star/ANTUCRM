# Módulo de Clientes (Contacts Module)

## Descripción

El Módulo de Clientes es la página principal después del dashboard de ventas en ANTU CRM. Proporciona una interfaz Fortune 500 para gestionar contactos con insights impulsados por IA, KPIs en tiempo real y acciones rápidas.

## Arquitectura

```
src/contacts/
├── controllers/
│   └── contacts.controller.ts    # REST API endpoints
├── services/
│   ├── contacts.service.ts       # Lógica de negocio principal
│   └── contacts-ai.service.ts    # Servicios de IA (Gemini)
├── dto/
│   ├── contact-query.dto.ts      # Validación de queries
│   ├── create-contact.dto.ts     # Creación de contactos
│   ├── update-contact.dto.ts     # Actualización de contactos
│   ├── ai-insight.dto.ts         # DTOs de IA
│   └── bulk-action.dto.ts        # Acciones masivas
├── types/
│   └── contacts.types.ts         # Definiciones de tipos
└── contacts.module.ts            # Definición del módulo
```

## Endpoints API

### Dashboard de Contactos
```http
GET /api/v1/contacts
```
Retorna el dashboard completo con:
- **AI Insights**: Alertas críticas, seguimientos, oportunidades y riesgos
- **KPIs**: Total contactos, contactos principales, activos, nuevos este mes
- **Filtros**: Disponibles según rol (estado, industria, tags, asignado)
- **Lista de Contactos**: Tarjetas enriquecidas con avatar, empresa, estado

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `page` | number | Página actual (default: 1) |
| `limit` | number | Items por página (default: 20) |
| `search` | string | Búsqueda por nombre, email o empresa |
| `status` | string | Filtrar por estado |
| `industry` | string | Filtrar por industria |
| `tagIds` | string[] | Filtrar por etiquetas |
| `assignedToId` | string | Filtrar por asignado |
| `isMainContact` | boolean | Solo contactos principales |
| `sortBy` | string | Campo de ordenamiento |
| `sortOrder` | asc/desc | Dirección del orden |

### Búsqueda Rápida
```http
GET /api/v1/contacts/search?q={query}&limit={limit}
```
Búsqueda optimizada para autocompletado.

### CRUD de Contactos
```http
GET    /api/v1/contacts/:id          # Detalle completo
POST   /api/v1/contacts              # Crear contacto
PATCH  /api/v1/contacts/:id          # Actualizar contacto
DELETE /api/v1/contacts/:id          # Eliminar contacto (soft delete)
```

### Acciones Masivas
```http
POST /api/v1/contacts/bulk
```
Acciones sobre múltiples contactos:
- `ASSIGN`: Reasignar a otro usuario
- `UPDATE_STATUS`: Cambiar estado
- `ADD_TAGS`: Agregar etiquetas
- `DELETE`: Eliminar múltiples contactos

### Endpoints de IA
```http
GET  /api/v1/contacts/:id/insights      # Insights de IA
POST /api/v1/contacts/:id/score         # Calcular score
GET  /api/v1/contacts/:id/next-action   # Próxima mejor acción
```

## Modelo de Datos

### Contact (Prisma)
```prisma
model Contact {
  id            String    @id @default(uuid())
  tenantId      String
  firstName     String
  lastName      String
  email         String?
  phone         String?
  mobile        String?
  jobTitle      String?
  department    String?
  isMainContact Boolean   @default(false)
  hasWhatsApp   Boolean   @default(false)
  status        ContactStatus @default(PROSPECT)
  score         Int       @default(0)
  avatar        String?
  
  companyId     String?
  assignedToId  String
  
  company       Company?  @relation(fields: [companyId], references: [id])
  assignedTo    User      @relation(fields: [assignedToId], references: [id])
  tags          ContactTag[]
  activities    Activity[]
  opportunities Opportunity[]
  notes         ContactNote[]
  tasks         Task[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
  
  @@index([tenantId, assignedToId])
  @@index([tenantId, companyId])
  @@index([email])
}
```

## Control de Acceso Basado en Roles (RBAC)

| Rol | Permisos |
|-----|----------|
| **USER (Vendedor)** | Ver/Editar solo sus contactos asignados |
| **MANAGER (Gerente)** | Ver contactos propios y de su equipo |
| **ADMIN (CEO/Admin)** | Acceso total a todos los contactos del tenant |

## Features de IA

### 1. Dashboard Insights
Genera alertas inteligentes:
- **CRITICAL_ALERT**: Clientes críticos que requieren atención inmediata
- **FOLLOW_UP**: Seguimientos pendientes
- **OPPORTUNITY**: Oportunidades detectadas
- **ENGAGEMENT**: Recomendaciones de engagement
- **RISK**: Señales de riesgo de pérdida

### 2. Contact Scoring
Score de 0-100 basado en:
- Frecuencia de interacción
- Valor de oportunidades
- Velocidad de respuesta
- Complejidad del perfil

### 3. Next Best Action
Recomienda la acción óptima:
- `CALL`: Llamada telefónica
- `EMAIL`: Correo electrónico
- `WHATSAPP`: Mensaje WhatsApp
- `MEETING`: Reunión presencial/virtual
- `WAIT`: Esperar (no saturar)

### 4. Health Score
Métricas de salud del contacto:
- Engagement rate (0-100)
- Tiempo promedio de respuesta
- Frecuencia de actividad
- Tendencia (improving/stable/declining)

## Tarjeta de Contacto (ContactCard)

```typescript
interface ContactCard {
  id: string;
  avatar: {
    initials: string;     // "JD" para John Doe
    color: string;        // Color generado por hash
    imageUrl?: string;    // URL de foto opcional
  };
  fullName: string;
  jobTitle: string;
  isMainContact: boolean; // Badge especial
  company: {
    id: string;
    name: string;
    industry?: string;
  };
  email: string;
  phone: string;
  hasWhatsApp: boolean;   // Icono de WhatsApp
  status: ContactStatus;  // ACTIVE | INACTIVE | PROSPECT | CUSTOMER | CHURNED
  score: number;          // 0-100
  lastActivity?: {
    date: Date;
    type: string;
    description: string;
    daysAgo: number;
  };
  pendingTasks: number;   // Indicador de tareas
  opportunities: {
    count: number;
    totalValue: number;
  };
  tags: ContactTag[];
}
```

## KPIs del Dashboard

| KPI | Descripción |
|-----|-------------|
| **Total Contacts** | Total de contactos activos con tendencia vs mes anterior |
| **Main Contacts** | Contactos principales (decision makers) |
| **Active Contacts** | Contactos con actividad reciente |
| **New This Month** | Contactos creados este mes |
| **With Opportunities** | Contactos con oportunidades abiertas |

## Integración con Frontend

### Ejemplo de uso con React Query:
```typescript
const { data: dashboard } = useQuery({
  queryKey: ['contacts', 'dashboard', filters],
  queryFn: () => api.get('/api/v1/contacts', { params: filters }),
});

const { data: insights } = useQuery({
  queryKey: ['contacts', contactId, 'insights'],
  queryFn: () => api.get(`/api/v1/contacts/${contactId}/insights`),
  enabled: !!contactId,
});
```

## WebSocket Events (Futuro)

```typescript
// contact:created
// contact:updated  
// contact:deleted
// contact:assigned
// contact:insight:new
```

## Testing

```bash
# Unit tests
npm run test contacts

# E2E tests
npm run test:e2e contacts
```

## Notas de Implementación

1. **Soft Delete**: Todos los contactos usan soft delete (`deletedAt`)
2. **Unicidad de Email**: Validación a nivel de tenant
3. **RLS**: Row Level Security asegura aislamiento multi-tenant
4. **Auditoría**: Todas las operaciones se registran en AuditLog
5. **AI Fallback**: Si Gemini no responde, se usan reglas heurísticas
