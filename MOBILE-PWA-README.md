# Antu CRM - Mobile PWA Implementation

## Overview

Antu CRM ahora incluye una aplicación móvil PWA (Progressive Web App) completa que permite a los vendedores gestionar su trabajo de ventas desde cualquier lugar, incluso sin conexión a internet.

## Características Móviles

### 📱 Interfaz Mobile-First
- Diseño optimizado para pantallas táctiles
- Navegación inferior tipo app nativa
- Transiciones y animaciones fluidas
- Soporte para modo oscuro

### 📍 Geolocalización y Check-in
- Check-in automático con GPS
- Registro de visitas a clientes
- Historial de ubicaciones
- Detección de clientes cercanos

### 🎙️ Notas de Voz
- Grabación de audio integrada
- Transcripción automática con IA
- Sincronización offline
- Asociación con clientes/oportunidades

### 📇 Escáner de Tarjetas
- OCR para captura de tarjetas de presentación
- Extracción automática de datos
- Creación rápida de contactos

### 🔔 Notificaciones Push
- Alertas de tareas pendientes
- Recordatorios de seguimiento
- Notificaciones de oportunidades

### 🌐 Funcionamiento Offline
- Sincronización en segundo plano
- Cola de acciones pendientes
- Acceso a datos cacheados
- Background sync API

## Estructura de Archivos

```
antucrm/
├── frontend/
│   ├── public/
│   │   ├── manifest.json          # Configuración PWA
│   │   └── service-worker.js      # Service worker para offline
│   ├── src/
│   │   ├── pages/mobile/
│   │   │   ├── MobileLayout.tsx   # Layout principal móvil
│   │   │   ├── MobileDashboard.tsx
│   │   │   ├── MobileClients.tsx
│   │   │   ├── MobileOpportunities.tsx
│   │   │   ├── MobileTasks.tsx
│   │   │   └── MobileCheckIn.tsx
│   │   ├── components/mobile/
│   │   │   ├── GeolocationCheckIn.tsx
│   │   │   ├── VoiceRecorder.tsx
│   │   │   └── BusinessCardScanner.tsx
│   │   └── hooks/
│   │       ├── usePWA.ts          # Hook para funcionalidad PWA
│   │       └── useIsMobile.ts     # Detección de dispositivo
│   └── index.html                 # Meta tags PWA
│
└── api/
    ├── src/
    │   ├── modules/mobile/
    │   │   ├── controller.ts      # Endpoints móviles
    │   │   └── routes.ts
    │   └── database/migrations/
    │       └── 030_mobile_tables.sql
    └── server.ts                  # Registro de rutas
```

## Endpoints API Móvil

### Dashboard
- `GET /api/mobile/dashboard/stats` - Estadísticas del dashboard
- `GET /api/mobile/dashboard/tasks` - Tareas de hoy
- `GET /api/mobile/dashboard/opportunities` - Oportunidades calientes

### Clientes
- `GET /api/mobile/clients` - Lista de clientes
- `GET /api/mobile/clients/nearby` - Clientes cercanos (requiere lat/lng)
- `PATCH /api/mobile/clients/:id/hot` - Marcar como caliente

### Oportunidades
- `GET /api/mobile/opportunities` - Lista de oportunidades
- `PATCH /api/mobile/opportunities/:id/stage` - Cambiar etapa

### Tareas
- `GET /api/mobile/tasks?filter=today|upcoming|completed`
- `POST /api/mobile/tasks/:id/complete`

### Check-in
- `POST /api/mobile/checkin` - Crear check-in
- `GET /api/mobile/checkins/history` - Historial de check-ins

### Notas de Voz
- `POST /api/mobile/voice-note` - Guardar nota de voz
- `POST /api/mobile/transcribe` - Transcribir audio

### Scanner
- `POST /api/mobile/scan-card` - Escanear tarjeta de presentación

### Push Notifications
- `POST /api/mobile/push-subscription` - Suscribirse a notificaciones
- `DELETE /api/mobile/push-subscription` - Cancelar suscripción

## Instalación y Uso

### Para Usuarios

1. **Instalar la app:**
   - Abre Antu CRM en Chrome/Safari/Edge móvil
   - Toca "Agregar a pantalla de inicio" o "Instalar app"
   - La app se instalará como aplicación nativa

2. **Funciones principales:**
   - **Check-in:** Toca el botón verde flotante para registrar visitas
   - **Notas de voz:** Toca el botón rojo para grabar notas
   - **Scanner:** Toca el botón azul para escanear tarjetas
   - **Navegación:** Usa la barra inferior para cambiar de sección

### Para Desarrolladores

1. **Configurar VAPID keys para push notifications:**
   ```bash
   # Generar keys
   npx web-push generate-vapid-keys
   
   # Agregar a .env
   VAPID_PUBLIC_KEY=xxx
   VAPID_PRIVATE_KEY=yyy
   ```

2. **Ejecutar migraciones:**
   ```bash
   cd antucrm/api
   npm run migrate
   ```

3. **Construir para producción:**
   ```bash
   cd antucrm/frontend
   npm run build
   ```

## Requisitos Técnicos

### Navegadores Soportados
- Chrome/Edge 80+
- Safari 14+ (iOS 14.5+)
- Firefox 75+
- Samsung Internet 12+

### Permisos Requeridos
- **Ubicación:** Para check-in y clientes cercanos
- **Cámara:** Para escáner de tarjetas
- **Micrófono:** Para notas de voz
- **Notificaciones:** Para push notifications

### Características Web API Utilizadas
- Service Workers
- Background Sync API
- Web Push API
- Geolocation API
- MediaRecorder API
- Camera API (getUserMedia)
- File System Access API (where available)

## Próximas Mejoras

- [ ] Integración con OpenAI Whisper para transcripción
- [ ] OCR avanzado con Google Vision API
- [ ] Modo completamente offline
- [ ] Sincronización de archivos adjuntos
- [ ] Llamadas VoIP integradas
- [ ] Mensajería interna entre vendedores

## Soporte

Para reportar problemas o solicitar características:
- Email: soporte@antu-crm.com
- WhatsApp: +56 9 XXXX XXXX
- Dashboard: Sección "Ayuda" en el menú
