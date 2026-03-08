# 🔄 Guía de Integración - Timeline Unificado

## ¿Qué se creó?

1. **SQL Migration** (`029_interactions_timeline.sql`)
   - Tabla `interactions` con todos los campos necesarios
   - Índices optimizados para búsquedas rápidas
   - Campo `ai_insight` JSONB para análisis de Claude

2. **Service** (`interactionService.ts`)
   - `saveInteraction()` - Guarda cualquier interacción
   - `getClientTimeline()` - Obtiene timeline de cliente
   - `updateStatus()` - Actualiza desde webhooks

3. **Webhooks** (`webhooks.ts`)
   - Handlers para Resend y WhatsApp
   - Verificación de firmas
   - Auto-asignación de contactos

4. **Routes** (`routes.ts`)
   - API endpoints para el frontend
   - Búsqueda de texto completo

5. **AI Analysis** (`aiAnalysis.ts`)
   - Integración con Claude
   - Procesamiento en batch

---

## 🔌 CÓMO INTEGRAR EN TU CÓDIGO EXISTENTE

### 1. Después de enviar email con Resend

```typescript
// En tu servicio de email existente
import { logResendEmail } from '../interactions/webhooks';

async function sendEmailWithTracking(
  tenantId: string,
  userId: string,
  emailData: any,
  clientId?: string
) {
  // 1. Enviar con Resend (tu código actual)
  const resendResponse = await resend.emails.send({
    from: emailData.from,
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html
  });
  
  // 2. LOGUEAR EN TIMELINE (nuevo)
  await logResendEmail(
    tenantId,
    userId,
    {
      id: resendResponse.id,
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      html: emailData.html
    },
    {
      client_id: clientId,
      contact_id: emailData.contact_id,
      opportunity_id: emailData.opportunity_id
    }
  );
  
  return resendResponse;
}
```

### 2. Después de enviar WhatsApp

```typescript
// En tu servicio de WhatsApp
import { logWhatsAppSent } from '../interactions/webhooks';

async function sendWhatsAppMessage(
  tenantId: string,
  userId: string,
  to: string,
  body: string,
  contactId?: string
) {
  // 1. Enviar mensaje (tu código actual)
  const message = await twilioClient.messages.create({
    from: `whatsapp:${twilioNumber}`,
    to: `whatsapp:${to}`,
    body
  });
  
  // 2. LOGUEAR EN TIMELINE (nuevo)
  await logWhatsAppSent(
    tenantId,
    userId,
    {
      messageId: message.sid,
      to: to,
      body: body,
      threadId: `wa_${to}_${twilioNumber}`
    },
    {
      contact_id: contactId
    }
  );
  
  return message;
}
```

### 3. Configurar Webhooks

```typescript
// En tu server.ts principal
import interactionRoutes from './modules/interactions/routes';
import { handleResendWebhook, handleWhatsAppWebhook } from './modules/interactions/webhooks';

// API Routes
app.use('/api/interactions', interactionRoutes);

// Webhooks (sin autenticación, pero con verificación de firma)
app.post('/webhooks/resend', handleResendWebhook);
app.post('/webhooks/whatsapp', handleWhatsAppWebhook);
```

---

## 🗄️ Estructura de la Base de Datos

### Tabla: interactions

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK auto-generado |
| `tenant_id` | UUID | Multi-tenancy |
| `client_id` | UUID | FK a clients |
| `contact_id` | UUID | FK a contacts |
| `opportunity_id` | UUID | FK a opportunities |
| `user_id` | UUID | Vendedor responsable |
| `channel` | ENUM | email, whatsapp, sms, call, note |
| `direction` | ENUM | inbound, outbound, internal |
| `status` | ENUM | pending, sent, delivered, read |
| `content` | TEXT | Contenido completo |
| `from_address` | VARCHAR | Email o teléfono origen |
| `to_address` | VARCHAR | Email o teléfono destino |
| `external_id` | VARCHAR | ID en proveedor (Resend/Twilio) |
| `thread_id` | VARCHAR | Agrupa conversaciones |
| `ai_insight` | JSONB | Análisis de Claude |

### Ejemplo de ai_insight (JSONB):

```json
{
  "sentiment": "positive",
  "sentiment_score": 0.87,
  "summary": "Cliente interesado en upgrade",
  "topics": ["upgrade", "pricing", "support"],
  "intent": "purchase_intent",
  "urgency": "high",
  "keywords": ["urgente", "comprar", "ahora"],
  "suggested_action": "schedule_demo"
}
```

---

## 🔧 API Endpoints para Frontend

```
GET  /api/interactions/timeline/:clientId?channels=email,whatsapp&limit=50
GET  /api/interactions/thread/:threadId
GET  /api/interactions/summary/:clientId
POST /api/interactions/search
POST /api/interactions/note
```

### Ejemplo de respuesta:

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "channel": "email",
      "direction": "inbound",
      "content": "Hola, estoy interesado en...",
      "from_address": "cliente@empresa.com",
      "to_address": "vendedor@antucrm.com",
      "ai_insight": {
        "sentiment": "positive",
        "sentiment_score": 0.85,
        "summary": "Cliente interesado en demo"
      },
      "created_at": "2024-03-08T15:30:00Z"
    }
  ]
}
```

---

## ⚙️ Configurar Worker de AI

Para analizar interacciones automáticamente, agrega esto a un cron job:

```typescript
// workers/aiAnalysisWorker.ts
import { processPendingAnalysis } from '../modules/interactions/aiAnalysis';

// Ejecutar cada 5 minutos
setInterval(async () => {
  try {
    const processed = await processPendingAnalysis(10);
    if (processed > 0) {
      console.log(`[AI Worker] Processed ${processed} interactions`);
    }
  } catch (error) {
    console.error('[AI Worker] Error:', error);
  }
}, 5 * 60 * 1000);
```

---

## ✅ Checklist de Implementación

- [ ] Ejecutar migración SQL: `npm run migrate`
- [ ] Importar `logResendEmail` en tu servicio de email
- [ ] Importar `logWhatsAppSent` en tu servicio de WhatsApp
- [ ] Configurar webhooks en Resend Console
- [ ] Configurar webhooks en Twilio/Meta
- [ ] Probar envío de email y verificar en BD
- [ ] Probar recepción de WhatsApp
- [ ] Verificar que AI analysis funciona
