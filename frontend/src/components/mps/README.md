# Cotizador MPS (Managed Print Services)

## Descripción

Módulo de cotización especializado para equipos de impresión con cálculo financiero PMT.

## Características

- **Grid de Items (0% interés)**: Los equipos se calculan sin interés para mostrar el costo base
- **Resumen Financiero (PMT)**: El interés se aplica solo al total de la inversión en hardware
- **Niveles de Precio**: 
  - Precio de Lista (sin aprobación)
  - Precio Estratégico (requiere aprobación)
  - Precio Mayorista (requiere aprobación)
- **Flujo de Aprobaciones**: Los gerentes pueden aprobar/rechazar cotizaciones con precios especiales

## Estructura

```
components/mps/
├── MPSCalculator.tsx       # Componente principal del cotizador
├── MPSApprovalPanel.tsx    # Panel de aprobaciones para gerentes
└── README.md               # Esta documentación
```

## Uso

### Desde el módulo de Cotizaciones

El cotizador MPS está integrado en el módulo de Cotizaciones (`/quotes`):

1. **Vendedor**: Hace clic en "Cotizador MPS" para crear una nueva cotización
2. **Gerente**: Hace clic en "Aprobaciones MPS" para ver solicitudes pendientes

### Props de MPSCalculator

```typescript
interface MPSCalculatorProps {
  opportunityId?: string;      // ID de la oportunidad asociada
  opportunityName?: string;    // Nombre de la oportunidad
  onBack?: () => void;         // Callback al volver
  onQuoteGenerated?: (data) => void; // Callback cuando se genera la cotización
}
```

## Flujo de Trabajo

### 1. Crear Cotización MPS

1. El vendedor ingresa al Cotizador MPS
2. Configura: Modalidad, Plazo, Tasa de Interés, ID Oportunidad
3. Agrega equipos con sus datos (código, descripción, nivel de precio, precio, costos por copia, volúmenes)
4. Hace clic en "Calcular Cotización"
5. El sistema calcula:
   - Grid (0% interés): Mensualidad Hardware = Precio / Plazo
   - Resumen (PMT): Cuota = PMT(Inversión Total, Tasa, Plazo) + Servicios

### 2. Solicitar Aprobación (si aplica)

Si la cotización incluye niveles de precio que requieren aprobación:

1. El vendedor hace clic en "Solicitar Aprobación"
2. El gerente recibe la notificación en "Aprobaciones MPS"
3. El gerente puede:
   - **Aprobar**: El vendedor puede generar la cotización
   - **Rechazar**: El vendedor debe ajustar los precios

### 3. Generar Cotización

Una vez aprobada (o si no requiere aprobación):

1. El vendedor hace clic en "Generar Cotización"
2. La cotización se guarda y se vincula a la oportunidad
3. El valor de la cuota mensual se carga en la oportunidad

## API Endpoints

### Cálculo
- `POST /api/mps/calculate` - Calcular cotización completa
- `POST /api/mps/recalculate` - Recalcular con nuevos parámetros

### Configuración
- `GET /api/mps/config` - Obtener configuración
- `PUT /api/mps/config` - Actualizar configuración

### Aprobaciones
- `POST /api/mps/price-approval/request` - Crear solicitud
- `GET /api/mps/price-approval/pending` - Ver pendientes
- `POST /api/mps/price-approval/:id/respond` - Responder solicitud

## Fórmula PMT

```
Cuota = PV × [ r / (1 - (1 + r)^-N) ]

Donde:
- PV = Inversión Total en Hardware (sumatoria de Precio Equipo)
- r = Tasa de interés mensual (anual / 100 / 12)
- N = Plazo en meses
```

## Configuración

El administrador puede configurar:

- `enabled`: Habilitar/deshabilitar el módulo
- `requireApprovalFor`: Niveles de precio que requieren aprobación
- `defaultTasaInteres`: Tasa de interés por defecto
- `defaultPlazo`: Plazo en meses por defecto
