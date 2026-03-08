# 🔧 Corrección de Problemas de Persistencia

## Problemas Reportados

### 1. ❌ Clientes no se guardan en el servidor (se pierden al refrescar)
### 2. ❌ Tenants nuevos se crean con datos de demo falsos

---

## Diagnóstico

### Problema 1: Clientes no persistentes

**Causa probable:** El frontend está haciendo las peticiones correctamente, pero hay varios puntos donde puede estar fallando:

1. **API_URL mal configurada** - Si `VITE_API_URL` apunta a localhost en producción
2. **Token expirado** - El JWT expira y las peticiones son rechazadas sin mensaje claro
3. **Error silencioso** - El backend falla pero no muestra error al usuario
4. **CORS** - Peticiones bloqueadas por políticas de CORS

### Problema 2: Tenants con datos de demo

**Causa identificada:** El archivo `api/src/config/seed.js` tiene esta lógica:

```javascript
if (process.env.NODE_ENV === 'production' || process.env.SKIP_DEMO_SEED === 'true') {
  console.log('⏭️  Saltando demo tenant (producción o SKIP_DEMO_SEED=true)');
  // ...
  process.exit(0);
}
```

**PERO** si `NODE_ENV` no está configurado como 'production', se ejecuta todo el seeding creando:
- Tenant demo 'Antü CRM Principal'
- Usuarios de demo (admin@antucrm.com, vendedor@antucrm.com, etc.)
- Clientes de ejemplo
- Oportunidades falsas

---

## Soluciones Aplicadas

### 1. Verificar configuración del Frontend

Asegurar que `VITE_API_URL` esté correctamente configurada en el archivo `.env` del frontend:

```bash
# .env (en la raíz del proyecto, usado por docker-compose)
# y también antucrm/frontend/.env.local (para desarrollo)

VITE_API_URL=https://api.tudominio.com/api
# NO usar localhost en producción
```

### 2. Verificar variables de entorno del Servidor

```bash
# .env en el servidor
NODE_ENV=production
SKIP_DEMO_SEED=true
DATABASE_URL=postgresql://... (URL real)
```

### 3. Limpieza de Datos de Demo

Ejecutar el script de limpieza:

```bash
# Verificar estado
node scripts/fix-persistence-issues.js check

# Limpiar datos de demo
node scripts/fix-persistence-issues.js clean

# Aplicar correcciones
node scripts/fix-persistence-issues.js fix
```

### 4. SQL Manual de Limpieza (si es necesario)

```sql
-- Eliminar usuarios demo
DELETE FROM users WHERE email IN (
  'admin@antucrm.com', 
  'vendedor@antucrm.com', 
  'gerente@antucrm.com'
);

-- Eliminar clientes demo
DELETE FROM clients WHERE name IN (
  'Tecnología Avanzada SRL',
  'Soluciones Digitales RD', 
  'Constructora del Caribe',
  'Importadora Nacional',
  'Servicios Financieros ABC'
);

-- Eliminar tenant demo
DELETE FROM tenants WHERE slug = 'antucrm-principal';
```

---

## Verificación Post-Corrección

### Verificar que los clientes se guardan correctamente:

```bash
# 1. Crear un cliente de prueba
curl -X POST https://api.tudominio.com/api/clients \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Cliente Test", "email": "test@test.com"}'

# 2. Verificar en base de datos
psql $DATABASE_URL -c "SELECT * FROM clients WHERE name = 'Cliente Test';"
```

### Verificar creación de tenants limpios:

```bash
# Crear tenant desde Super Admin
# Luego verificar que no tiene datos de demo:
psql $DATABASE_URL -c "SELECT COUNT(*) FROM clients WHERE tenant_id = 'NUEVO_TENANT_ID';"
# Debe devolver 0
```

---

## Checklist Pre-Deploy

- [ ] `NODE_ENV=production` está configurado
- [ ] `SKIP_DEMO_SEED=true` está configurado
- [ ] `VITE_API_URL` apunta al servidor correcto
- [ ] Script de seed no se ejecuta automáticamente en deploy
- [ ] Datos de demo han sido limpiados
- [ ] Test de creación de cliente funciona
- [ ] Test de creación de tenant funciona

---

## Comandos Útiles

```bash
# Verificar logs del API
docker logs antucrm-api

# Verificar si hay errores de CORS
docker logs antucrm-api | grep -i cors

# Verificar si hay errores de autenticación
docker logs antucrm-api | grep -i "401\|auth"

# Revisar variables de entorno en el contenedor
docker exec antucrm-api env | grep NODE_ENV
```
