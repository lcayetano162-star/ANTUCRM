# Arquitectura de Aislamiento Fiscal (Enterprise Grade)

## 📌 Documento de Diseño Arquitectónico (CSO & Lead Architect)
**Módulo:** Gestión de Aislamiento Fiscal Multi-tenant.
**Nivel de Exigencia:** Salesforce / SAP Equivalent.

---

## 1. Modificación al Esquema de Base de Datos (Prisma)
Para evitar tocar la estructura de tablas para cada posible cliente, aprovecharemos el modelo de `settings Json` que la arquitectura moderna de Antü CRM ya posee y crearemos un log de auditoría histórico.

```prisma
// En vez de alterar cada tabla, inyectamos en la Configuración Global:
model Tenant {
  id          String   @id @default(uuid())
  // ...
  // Almacenaremos "fiscalStartMonth": 1 (Jan) o 7 (Jul) 
  // Opcional: "fiscalStartDay": 1
  settings    Json?    @default("{}") 
}

// Nueva tabla (Opcional si se requiere trazabilidad auditable estilo SAP):
// "FiscalYearRecord" para guardar cortes "Duros"
model FiscalArchive {
  id          String   @id @default(uuid())
  fiscalYear  String   // "FY2025"
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  snapshots   Json     // JSON estático de las métricas que cerraron el año.
  createdAt   DateTime @default(now())
}
```

---

## 2. Capa de Abstracción de Datos (Global Filter API)
**Regla de Oro cumplida**: Los datos históricos no se mueven ("*No Data Movement*"). Solo se segmentan en memoria/BD al momento de consultar.

Para implementarlo de manera limpia sin tener que filtrar en 500 controladores diferentes, creamos el Servicio `FiscalYearEngine`.

### Ejemplo Práctico de Middleware (NestJS Prisma Extension)
```typescript
// En el AppModule o en PrismaService config:
prisma.$use(async (params, next) => {
  // Solo afectamos lectura de Oportunidades, Actividades y Dashboard
  const fiscalEntities = ['Opportunity', 'Activity', 'Task'];

  if (fiscalEntities.includes(params.model) && params.action.startsWith('find')) {
    
    // Obtenemos el tenantId de contexto (Ej: Cls (AsyncLocalStorage))
    const tenantContext = TenantContext.getStore();
    if (tenantContext && !tenantContext.requestingHistorical) {
       
       // Invocamos el FiscalEngine
       const bounds = FiscalYearEngine.getPrismaFiscalFilter(tenantContext.tenant);
       
       // INYECTAMOS el límite de fechas global
       // Si el usuario pidió un "where", le adjuntamos el rango mediante "AND"
       params.args.where = {
          AND: [
            params.args.where || {},
            bounds
          ]
       };
    }
  }
  return next(params);
});
```

---

## 3. Flujo de Trabajo (Switch en Pantalla del Usuario)
Para que el usuario pueda viajar en el tiempo de manera limpia:

1. **La Interfaz (Frontend):** En la esquina superior derecha del Dashboard general o en el módulo específico existirá un componente `FiscalYearSelector`.
2. Por defecto dice **"FY2026 (Actual)"**. El estado global asume `historicalRequest: false`.
3. Al cambiar a **"FY2025"** se dispara un flag `?fiscalYear=2025` al backend.
4. El backend detecta la bandera, recalcula el `startDate` y `endDate` equivalente a ese año histórico en particular de ese Tenant, e inyecta la consulta *exclusivamente* para ese bloque de fechas.

### El Archivo Histórico (Read-Only)
Para asegurar que no contaminamos métricas de años pasados:
- Si el componente `FiscalYearSelector` NO es el año "Actual", el *Frontend* muta de manera programática a modo **(Read-Only)**.
- Se ocultan los botones de "Crear Nueva Oportunidad", "Marcar Ganada" y "Editar". Es un modo *Museo*.

---

## 4. Gestión de Transición de Año (Rollover de SAP/Salesforce)
Cuando la fecha sobrepasa `fiscal_endDate` a las 23:59:59 horas:

1. Un **CRON Job** (`@Cron('0 0 * * *')`) corre todas las madrugadas.
2. Identifica los Tenants cuyo `endDate` expiró ayer.
3. El sistema rastrea las oportunidades creadas en ese año con estado diferente a `WON` / `LOST`.
4. Dependiendo de las preferencias (Setting) del Tenant en Antü, ocurren dos escenarios:
   - **Hard Close (Cierre Duro):** Pasa la oportunidad a `EXPIRED` (Nuevo estado o "Cerrada Perdida Automáticamente").
   - **Rollover (Arrastre):** Actualiza el `createdAt` / `rolloverDate` para empujar la oportunidad a la nueva caja de tiempo del FY actual del cliente sin perder el histórico del chat y notas, para que aparezca en el pipeline del 1ero de Enero (o comienzo del nuevo mes fiscal).

---

## 5. Análisis de Inteligencia Artificial (Antigravity Core)
La IA no usa la extensión Prisma "filtrada visualmente". La IA (NestJS Service) atacará **directo al Prisma Client sin filtros** para hacer su magia.

**Prompt Muestra de la IA del CSO:**
> "El tenant T-X acaba de pedir un análisis de pipeline FY2026. Al escanear sus datos crudos del FY2025 (RD$ 4M cerados M1), noto que este FY2026 (RD$ 1M M1) están 75% debajo en YoY y tienen un estancamiento en llamadas frías. Tu instrucción como IA es decirle amablemente al dueño de la empresa estas discrepancias y por qué van lentos frente al año pasado."
