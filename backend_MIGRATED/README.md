# Cotizador MPS - Backend API

API Backend para el módulo de cotizaciones MPS (Managed Print Services) de AntuCRM.

## 🎯 Descripción

Este servicio calcula cotizaciones financieras para equipos de impresión con la fórmula PMT, aplicando interés solo al resumen final mientras el grid de items se calcula al 0%.

## 📁 Estructura

```
backend/
├── src/
│   ├── controllers/     # Controladores HTTP
│   ├── services/        # Lógica de negocio (cálculos)
│   ├── routes/          # Definición de rutas
│   ├── middleware/      # Middlewares (validación, logging)
│   ├── types/           # Tipos TypeScript
│   ├── utils/           # Utilidades (formatters)
│   └── server.ts        # Punto de entrada
├── package.json
├── tsconfig.json
└── .env.example
```

## 🚀 Instalación

```bash
cd backend
npm install
```

## 🏃 Ejecución

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm run build
npm start
```

## 📡 Endpoints

### `POST /api/mps/calculate`
Calcula una cotización MPS completa.

**Request Body:**
```json
{
  "oportunidadId": "OP-017",
  "modalidad": "renta",
  "plazoMeses": 36,
  "tasaInteresAnual": 16,
  "items": [
    {
      "codigo": "EMC00AA",
      "descripcion": "ImageFORCE 6170 Speed License",
      "nivelPrecio": "precio_estrategico",
      "precioEquipo": 7200,
      "cxcBN": 0.008032,
      "volumenBN": 2000,
      "cxcColor": 0.09521,
      "volumenColor": 50000
    },
    {
      "codigo": "EMC00AA",
      "descripcion": "ImageFORCE 6170 Speed License",
      "nivelPrecio": "precio_lista",
      "precioEquipo": 8200,
      "cxcBN": 0.006532,
      "volumenBN": 0,
      "cxcColor": 0.09375,
      "volumenColor": 0
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-generado",
    "oportunidadId": "OP-017",
    "fechaCreacion": "2024-01-15T10:30:00.000Z",
    "items": [
      {
        "id": "...",
        "codigo": "EMC00AA",
        "descripcion": "ImageFORCE 6170 Speed License",
        "nivelPrecio": "precio_estrategico",
        "precioEquipo": 7200,
        "cxcBN": 0.008032,
        "volumenBN": 2000,
        "cxcColor": 0.09521,
        "volumenColor": 50000,
        "servicioBN": 16.06,
        "servicioColor": 4760.50,
        "mensualidadHardware": 200.00,
        "mensualidadNegocio": 4976.56
      }
    ],
    "gridTotals": {
      "totalEquipos": 2,
      "totalPrecioEquipos": 15400,
      "totalServicioBN": 16.06,
      "totalServicioColor": 4760.50,
      "totalMensualidadHardware": 427.78,
      "totalMensualidadNegocio": 5204.34
    },
    "financialSummary": {
      "periodoMeses": 36,
      "modalidad": "renta",
      "totalServicios": 4776.56,
      "inversionHardware": 15400,
      "tasaInteresAnual": 16,
      "tasaInteresMensual": 0.013333,
      "cuotaHardwareFinanciado": 542.72,
      "cuotaMensualNegocioFinal": 5319.28
    }
  }
}
```

### `POST /api/mps/recalculate`
Recalcula una cotización con nuevos parámetros (plazo, tasa) sin modificar los items.

**Request Body:**
```json
{
  "items": [...], // Items previamente calculados
  "plazoMeses": 48,
  "tasaInteresAnual": 18,
  "modalidad": "renta",
  "oportunidadId": "OP-017"
}
```

### `POST /api/mps/validate`
Valida los datos de entrada sin calcular.

### `GET /api/mps/example`
Retorna un ejemplo de estructura de entrada.

### `GET /health`
Health check del servidor.

## 🔢 Lógica de Cálculo

### Paso 1: Grid (0% Interés)

Para cada ítem:
```
servicioBN = volumenBN × cxcBN
servicioColor = volumenColor × cxcColor
mensualidadHardware = precioEquipo ÷ plazoMeses
mensualidadNegocio = mensualidadHardware + servicioBN + servicioColor
```

### Paso 2: Resumen (PMT)

```
totalServicios = Σ(servicioBN + servicioColor)
inversionHardware = Σ(precioEquipo)

tasaMensual = tasaAnual ÷ 100 ÷ 12

cuotaHardwareFinanciado = PMT(inversionHardware, tasaMensual, plazoMeses)
                      = PV × [ r / (1 - (1 + r)^-N) ]

cuotaMensualNegocioFinal = totalServicios + cuotaHardwareFinanciado
```

## 📊 Ejemplo del Caso de Uso

**Input:**
- 1 equipo a $7,200
- 9 equipos a $8,200
- Plazo: 36 meses
- Tasa: 16% anual

**Cálculos Grid (0%):**
- Inversión Hardware: $7,200 + (9 × $8,200) = $81,000
- Mensualidad Hardware por ítem: $7,200/36 = $200, $8,200/36 = $227.78

**Cálculo PMT Final:**
- PV = $81,000
- r = 0.16/12 = 0.013333
- N = 36
- Cuota Hardware = $81,000 × [0.013333 / (1 - (1.013333)^-36)] = $2,847.72
- Total Servicios = $4,260.50
- **Cuota Mensual Negocio Final = $7,124.28**

## 🛡️ Seguridad

- Helmet.js para headers de seguridad
- CORS configurado por entorno
- Validación de inputs
- Manejo de errores centralizado

## 📄 Licencia

MIT - AntuCRM Team
