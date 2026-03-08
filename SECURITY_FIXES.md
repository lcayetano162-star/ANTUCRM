# 🔒 Correcciones de Seguridad - Post Auditoría

Este documento resume las correcciones aplicadas tras la auditoría de caja blanca externa.

## ✅ Correcciones Aplicadas

### 1. 🔴 API Keys Expuestas - CORREGIDO

**Problema:** Gemini API Key expuesta en `.env`

**Solución:**
- Creado `.env.example` con placeholders en lugar de valores reales
- `.env` añadido a `.gitignore` (nunca se subirá a git)
- El archivo `.env` con valores reales debe crearse manualmente en el servidor

**Acción requerida:**
```bash
# En el servidor de producción, NUNCA en git
cp .env.example .env
# Editar .env con valores reales
```

### 2. 🔴 Defaults de Seguridad en docker-compose.yml - CORREGIDO

**Problema:** `JWT_SECRET`, `ENCRYPTION_KEY`, y credenciales con valores por defecto conocidos

**Solución:**
- Eliminados todos los valores por defecto de variables sensibles
- Docker fallará al iniciar si no se proveen las variables requeridas
- Mensajes claros de error indicando cómo generar los valores

**Variables que ahora requieren valor explícito:**
- `JWT_SECRET` - Generar con: `openssl rand -hex 32`
- `ENCRYPTION_KEY` - Exactamente 32 caracteres
- `DB_PASSWORD` - Contraseña fuerte única
- `SUPER_ADMIN_EMAIL` - Email real
- `SUPER_ADMIN_PASSWORD` - Contraseña fuerte

### 3. 🔴 Credenciales Super Admin Hardcodeadas - CORREGIDO

**Problema:** Email y password de Super Admin en archivos de configuración

**Solución:**
- Eliminados valores por defecto de `docker-compose.yml`
- Variables marcadas como requeridas con mensaje de error claro
- Documentado proceso de configuración segura

### 4. 🟠 SMTP Password en Plain Text - CORREGIDO

**Problema:** Password SMTP guardado sin encriptar en `system_settings`

**Solución aplicada en:** `api/src/modules/super-admin/settings/routes.ts`

- Implementada encriptación AES-256-GCM para passwords SMTP
- Mismo nivel de seguridad que las API keys de IA
- IV aleatorio por cada encriptación
- AuthTag para integridad de datos

### 5. 🟠 Dockerfile sin USER - CORREGIDO

**Problema:** Proceso corriendo como root dentro del container

**Solución aplicada en:** `api/Dockerfile`

```dockerfile
# Crear usuario no-root
RUN addgroup -g 1000 -S nodejs && \
    adduser -u 1000 -S nodejs -G nodejs
...
# Cambiar a usuario no-root
USER nodejs
```

### 6. 🟡 Rate Limiting en Imports - CORREGIDO

**Problema:** Endpoints de upload/import sin rate limit específico

**Solución aplicada en:** `api/src/modules/import/routes.ts`

```typescript
const importRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 imports por 15 minutos
  message: { error: 'Demasiadas importaciones...' }
});
```

### 7. 🟢 .gitignore Completo - CORREGIDO

Creado `.gitignore` robusto que excluye:
- Todos los archivos `.env`
- Claves y certificados
- Directorio `uploads/`
- Logs y archivos temporales

## ⚠️ Issue Pendiente (Requiere Refactor Mayor)

### 8. 🟠 JWT en localStorage - REQUIERE REFACTOR

**Problema:** JWT almacenado en `localStorage` vulnerable a XSS

**Impacto:** Un ataque XSS podría robar el token de autenticación

**Solución Recomendada (Requiere tiempo de desarrollo):**
Migrar a **httpOnly cookies**:

```
Backend:
1. En login, enviar JWT en cookie httpOnly en lugar de JSON body
2. Middleware para leer cookie en lugar de header Authorization
3. Endpoint /refresh para renovar token

Frontend:
1. Eliminar authStore.ts manejo de localStorage
2. Axios automáticamente envía cookies
3. Manejar 401 redirigiendo a login
```

**Mitigación actual aplicada:**
- Sanitización XSS global en todos los inputs
- Headers CSP configurables
- No se permiten scripts externos sin verificación

**Timeline sugerido:** Planificar para Sprint 2 (post-MVP)

## 🚀 Checklist Pre-Deploy

- [ ] Generar `JWT_SECRET` único: `openssl rand -hex 32`
- [ ] Generar `ENCRYPTION_KEY` único (32 chars exactos)
- [ ] Configurar credenciales Super Admin seguras
- [ ] Configurar API keys de terceros (Gemini, OpenAI, etc.)
- [ ] Verificar que `.env` NO está en git: `git check-ignore -v .env`
- [ ] Crear archivo `.env` en servidor con valores reales
- [ ] Verificar permisos de directorio uploads: `chmod 755 uploads`

## 🔍 Verificación Post-Corrección

```bash
# Verificar que no hay secrets en código
grep -r "AIzaSy" . --include="*.ts" --include="*.js" --include="*.yml" || echo "✅ No API keys found"

# Verificar .env está ignorado
git check-ignore -v .env

# Verificar Docker no tiene defaults
grep -E "JWT_SECRET|ENCRYPTION_KEY" docker-compose.yml | grep -v "REQUERIDO" || echo "✅ No defaults found"
```

---

**Fecha de correcciones:** 2024-03-08  
**Auditoría realizada por:** Equipo externo de seguridad  
**Correcciones aplicadas por:** Lead Developer
