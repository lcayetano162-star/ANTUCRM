# Sistema de Email Bidireccional - Antu CRM

## 📧 Visión General

Sistema completo para enviar emails desde el CRM y recibir respuestas de clientes, con análisis automático por IA.

## ✨ Características

### Outbound (CRM → Cliente)
- ✅ Enviar emails con editor rico
- ✅ Templates personalizables
- ✅ Adjuntos
- ✅ Tracking de aperturas
- ✅ Respuestas threadeadas
- ✅ Mejora de texto con IA

### Inbound (Cliente → CRM)
- ✅ Recepción vía webhook
- ✅ Parsing automático de emails
- ✅ Asociación a clientes existentes
- ✅ Creación de conversaciones

### IA Integration
- ✅ Análisis de sentimiento
- ✅ Detección de intención
- ✅ Extracción de entidades (productos, montos)
- ✅ Priorización automática
- ✅ Sugerencias de respuesta
- ✅ Detección de oportunidades

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE                                  │
│                     (Gmail/Outlook)                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ 1. Recibe email del CRM
                      │ 2. Responde al email
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PROVEEDOR SMTP                              │
│              (SendGrid / AWS SES / Mailgun)                      │
│                                                                  │
│  • Webhook configurado: POST /api/email/inbound                  │
│  • Parsea el email entrante                                      │
│  • Extrae: from, to, subject, body, attachments                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Webhook POST
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API ANTÚ CRM                             │
│                                                                  │
│  1. Recibe payload del webhook                                  │
│  2. Busca cliente por email                                     │
│  3. Crea/actualiza conversación                                 │
│  4. Guarda mensaje en BD                                        │
│  5. Envia a IA para análisis (async)                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Análisis async
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     OPENAI GPT-4o-mini                           │
│                                                                  │
│  • Sentiment analysis                                            │
│  • Intent detection                                              │
│  • Entity extraction                                             │
│  • Priority scoring                                              │
│  • Opportunity detection                                         │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Configuración

### 1. Configurar Variables de Entorno

```bash
# .env en /api

# OpenAI (para análisis de emails)
OPENAI_API_KEY=sk-xxx

# Encriptación (32 caracteres)
ENCRYPTION_KEY=tu-clave-secreta-de-32-chars!

# SMTP (para envío)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password

# Webhook (para recepción)
WEBHOOK_SECRET=tu-webhook-secret
```

### 2. Configurar Proveedor SMTP/Receptor

#### Opción A: SendGrid (Recomendado)

1. Crear cuenta en [SendGrid](https://sendgrid.com)
2. Configurar dominio y verificar
3. Habilitar **Inbound Parse**:
   - Ir a Settings > Inbound Parse
   - Agregar host: `reply.antucrm.com`
   - Webhook URL: `https://tu-api.com/api/email/inbound`
4. Configurar email de envío en el CRM:
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP User: apikey
   SMTP Pass: SG.xxx (tu API key)
   ```

#### Opción B: AWS SES

1. Crear cuenta AWS y habilitar SES
2. Verificar dominio
3. Configurar SNS Topic para recepción
4. SNS envía a tu webhook

#### Opción C: Mailgun

1. Crear cuenta en Mailgun
2. Configurar dominio
3. Habilitar Routes:
   - Match: `.*@reply.antucrm.com`
   - Forward: `https://tu-api.com/api/email/inbound`

### 3. Ejecutar Migraciones

```bash
cd antucrm/api
npm run migrate
# Ejecuta: 031_email_conversations.sql
```

### 4. Configurar Cuenta en el CRM

Ir a **Configuración > Email > Cuentas** y agregar:

```yaml
Nombre: Ventas Antu
Email: ventas@antu-crm.com

SMTP:
  Host: smtp.sendgrid.net
  Port: 587
  Usuario: apikey
  Password: SG.xxx
  Seguro: true

IMAP (opcional para lectura):
  Host: imap.gmail.com
  Port: 993
  Usuario: ventas@antu-crm.com
  Password: xxx
```

## 📖 Uso

### Enviar Email

1. Ir a **Email** en el menú principal
2. Click en **Nuevo**
3. Completar:
   - Para: email del cliente
   - Asunto: tema del mensaje
   - Mensaje: cuerpo del email
4. Click en **Mejorar con IA** (opcional)
5. Click en **Enviar**

### Recibir Respuestas

Las respuestas llegan automáticamente:

1. Se crea/actualiza la **conversación**
2. Se guarda el **mensaje** en BD
3. La **IA analiza** el contenido
4. Se muestra el **sentimiento** y **prioridad**
5. Notificación al vendedor asignado

### Análisis de IA

Cada email entrante es analizado:

| Métrica | Descripción |
|---------|-------------|
| **Sentimiento** | Positive / Neutral / Negative |
| **Intención** | Question / Complaint / Request / Purchase Intent |
| **Prioridad** | Score 1-100 basado en urgencia |
| **Entidades** | Productos, montos, fechas detectadas |
| **Resumen** | 2 oraciones con el punto principal |
| **Oportunidad** | Detecta si es potencial venta |

## 🔌 API Endpoints

### Cuentas
```
GET    /api/email/accounts              # Listar cuentas
POST   /api/email/accounts              # Crear cuenta
POST   /api/email/accounts/test         # Probar conexión SMTP
```

### Conversaciones
```
GET    /api/email/conversations         # Listar conversaciones
GET    /api/email/conversations/:id     # Ver conversación
PATCH  /api/email/conversations/:id/close
```

### Enviar
```
POST   /api/email/send                  # Enviar email
{
  "to": "cliente@ejemplo.com",
  "subject": "Propuesta de valor",
  "body_text": "Hola...",
  "client_id": "uuid",
  "track_opens": true
}
```

### Webhook (Inbound)
```
POST   /api/email/inbound               # Recibir email
# Headers: X-Webhook-Secret
```

### Templates
```
GET    /api/email/templates             # Listar templates
POST   /api/email/templates             # Crear template
```

## 🎯 Casos de Uso

### Caso 1: Seguimiento Automático

```
1. Vendedor envía propuesta desde CRM
2. Cliente responde con dudas
3. IA detecta "preguntas sobre precio"
4. Sistema sugiere respuesta con info de precios
5. Vendedor responde rápidamente
6. Todo queda registrado en el CRM
```

### Caso 2: Detección de Oportunidades

```
1. Cliente envía email: "Quiero comprar 100 unidades"
2. IA detecta intención de compra + monto
3. Sistema crea alerta de oportunidad
4. Manager ve prioridad alta en dashboard
5. Vendedor contacta inmediatamente
```

### Caso 3: Escalamiento Automático

```
1. Cliente envía queja con sentimiento negativo
2. IA detecta urgencia y prioridad alta
3. Sistema notifica al manager
4. Se crea ticket en Service Desk
5. Vendedor original es notificado
```

## 🔒 Seguridad

- **Encriptación**: Passwords SMTP encriptados con AES-256
- **Webhooks**: Validación de firma en webhooks entrantes
- **Rate limiting**: 100 emails/hora por tenant
- **SPF/DKIM**: Configurar en DNS para evitar spam
- **Blacklist**: Validación de emails antes de enviar

## 📊 Monitoreo

### Métricas Importantes

```sql
-- Emails enviados hoy
SELECT COUNT(*) FROM email_messages 
WHERE direction = 'outbound' 
  AND DATE(sent_at) = CURRENT_DATE;

-- Tasa de apertura
SELECT 
  COUNT(*) FILTER (WHERE opened_at IS NOT NULL) * 100.0 / COUNT(*)
FROM email_messages 
WHERE direction = 'outbound';

-- Conversaciones pendientes
SELECT COUNT(*) FROM email_conversations 
WHERE status = 'active' AND unread_count > 0;
```

### Alertas

- Email reboteado → Notificar administrador
- Tasa de apertura < 20% → Revisar configuración
- Cola de emails > 100 → Escalar workers

## 🛠️ Troubleshooting

### Emails no llegan

```bash
# 1. Verificar webhook
curl -X POST https://tu-api.com/api/email/inbound \
  -H "Content-Type: application/json" \
  -d '{"to":"test@reply.antucrm.com","from":"test@test.com","subject":"Test","text":"Hola"}'

# 2. Revisar logs
tail -f /var/log/antucrm/email-webhook.log

# 3. Verificar DNS del dominio
dig MX antucrm.com
dig TXT antucrm.com | grep spf
```

### Error SMTP

```bash
# Probar conexión
telnet smtp.sendgrid.net 587

# Verificar credenciales
curl -X POST /api/email/accounts/test \
  -d '{"smtp_host":"smtp.sendgrid.net","smtp_port":587,"smtp_user":"apikey","smtp_password":"SG.xxx"}'
```

## 📝 Roadmap

- [ ] Integración con Gmail API (OAuth)
- [ ] Integración con Outlook 365
- [ ] Sugerencias de respuesta con IA en tiempo real
- [ ] Email sequences (drip campaigns)
- [ ] Análisis de competencia en emails
- [ ] Auto-categorización de emails
- [ ] Integración con calendario (proponer reuniones)

## 📞 Soporte

Para problemas con el sistema de email:
1. Revisar logs en `/var/log/antucrm/`
2. Verificar configuración en Settings > Email
3. Contactar: soporte@antu-crm.com
