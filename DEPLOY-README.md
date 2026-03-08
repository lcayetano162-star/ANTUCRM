# 🚀 ANTUCRM EMERGENCY DEPLOY - INSTRUCCIONES

## ⚡ EJECUCIÓN RÁPIDA (Copiar y pegar en SSH)

```bash
cd /home/antucrm.com/public_html
chmod +x fix-and-deploy.sh diagnose.sh verify.sh
./fix-and-deploy.sh
```

---

## 📋 ¿Qué hace este script?

1. **Detiene** todos los contenedores existentes
2. **Limpia** redes Docker huérfanas
3. **Crea** un `docker-compose.yml` corregido con red explícita
4. **Configura** variables de entorno correctas
5. **Inicia** PostgreSQL, API y Frontend
6. **Espera** a que PostgreSQL esté listo (healthcheck)
7. **Ejecuta** migraciones de base de datos
8. **Verifica** que todo esté funcionando

---

## 🔧 Si falla la migración

### Opción A: Diagnóstico detallado
```bash
./diagnose.sh
```

### Opción B: Verificación final
```bash
./verify.sh
```

### Opción C: Reinicio manual
```bash
docker-compose down
docker-compose up -d --build
sleep 15
docker-compose exec api npm run db:migrate
```

---

## 🌐 URLs de acceso

| Servicio | URL |
|----------|-----|
| Frontend | http://antucrm.com:5005 |
| API | http://localhost:3001 |
| PostgreSQL | localhost:5432 |

---

## 🔐 Credenciales

**Super Admin:**
- Email: `lcayetano162@gmail.com`
- Password: `AntuCRM2024!`

**Base de datos:**
- User: `antucrm_admin`
- Password: `AntuCRM2024!`
- Database: `antucrm_production`

---

## 🐛 Solución de problemas

### Error: "ECONNREFUSED" al conectar a PostgreSQL

El script ya incluye correcciones para esto:
- Red Docker explícita con subnet fija
- Healthcheck en PostgreSQL
- Variables de entorno correctas en todos los servicios

### Error: "relation already exists" en migraciones

Es normal, el script maneja estos errores silenciosamente.

### Error: "No such container"

Ejecuta desde el directorio correcto:
```bash
cd /home/antucrm.com/public_html
./fix-and-deploy.sh
```

---

## 📊 Comandos útiles

```bash
# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api
docker-compose logs -f postgres

# Reiniciar un servicio
docker-compose restart api

# Entrar al contenedor de la API
docker-compose exec api sh

# Conectar a PostgreSQL manualmente
docker-compose exec postgres psql -U antucrm_admin -d antucrm_production
```

---

## ✅ Checklist de éxito

Después de ejecutar `./fix-and-deploy.sh`, verifica:

- [ ] Contenedores están "Up" (verde)
- [ ] PostgreSQL responde a healthchecks
- [ ] Migraciones completaron sin errores críticos
- [ ] http://antucrm.com:5005 carga el login
- [ ] Puedes iniciar sesión con las credenciales de Super Admin

---

**Tiempo estimado de ejecución:** 2-3 minutos

**Generado:** $(date)
