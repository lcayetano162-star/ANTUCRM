# Configuración de Anthropic Claude (IA) 🤖

Antu CRM utiliza Anthropic Claude para sus funciones avanzadas de análisis. Sigue estos pasos para activarlo en tu servidor.

## 1. Requisitos Previos
- API Key de Anthropic (`sk-ant-...`)
- `ENCRYPTION_KEY` configurada en tu archivo `.env` (hex de 64 caracteres)
- Base de datos operativa

## 2. Configuración en la Base de Datos
No necesitas insertar manualmente en SQL. Usa el script automatizado:

```bash
# Servidor: Configurar variables temporales para el script
export ANTHROPIC_API_KEY="tu-api-key"
export ENCRYPTION_KEY="tu-encryption-key-del-env"
export DATABASE_URL="tu-database-url-del-env"

# Ejecutar script
node scripts/configure-anthropic.js
```

## 3. Prueba de Conexión
Verifica que la IA responda correctamente:

```bash
node scripts/test-anthropic.js
```

Si ves un mensaje `✅ Anthropic is working perfectly!`, la integración está lista.

## 4. Reinicio de Servicio
Para que el servidor NestJS reconozca el nuevo proveedor en caliente (Hot-Reload de IA), reinicia el contenedor:

```bash
docker-compose restart api
```

## Seguridad
- La API Key se guarda **encriptada** en la tabla `ai_provider_configs`.
- El sistema utiliza **AES-256-CBC** para asegurar que nadie, ni siquiera con acceso a la BD, pueda leer la llave sin el `ENCRYPTION_KEY`.
