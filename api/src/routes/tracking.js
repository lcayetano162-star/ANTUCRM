// ============================================
// RUTAS DE TRACKING (El "Chismoso")
// ============================================

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const geoip = require('geoip-lite');

/**
 * Píxel de apertura de email (GIF transparente 1x1)
 * GET /track/open/:tracking_id
 */
router.get('/open/:tracking_id', async (req, res) => {
  try {
    const { tracking_id } = req.params;

    // Obtener info del request
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Geolocalización
    const geo = geoip.lookup(ipAddress);

    // Buscar el email en la cola
    const email = await query(`
      SELECT campaign_id, contact_id, tenant_id 
      FROM email_queue WHERE tracking_id = $1
    `, [tracking_id]);

    if (email.rows.length > 0) {
      const { campaign_id, contact_id, tenant_id } = email.rows[0];

      // Verificar si ya existe apertura de este tracking_id
      const existingOpen = await query(`
        SELECT id FROM email_tracking_logs
        WHERE tracking_id = $1 AND event_type = 'open'
        LIMIT 1
      `, [tracking_id]);

      const isFirstOpen = existingOpen.rows.length === 0;

      // Insertar log de apertura
      await query(`
        INSERT INTO email_tracking_logs (
          tracking_id, campaign_id, contact_id, tenant_id,
          event_type, ip_address, user_agent, country_code, city
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        tracking_id,
        campaign_id,
        contact_id,
        tenant_id,
        'open',
        ipAddress,
        userAgent,
        geo?.country || null,
        geo?.city || null
      ]);

      // Actualizar contadores de campaña (solo primera apertura)
      if (isFirstOpen) {
        await query(`
          UPDATE marketing_campaigns 
          SET unique_open_count = unique_open_count + 1,
              open_count = open_count + 1
          WHERE id = $1
        `, [campaign_id]);

        // Incrementar lead_score del contacto
        await query(`
          UPDATE clients 
          SET lead_score = LEAST(lead_score + 5, 100),
              last_contact_at = NOW()
          WHERE id = $1
        `, [contact_id]);
      } else {
        // Solo incrementar open_count total
        await query(`
          UPDATE marketing_campaigns 
          SET open_count = open_count + 1
          WHERE id = $1
        `, [campaign_id]);
      }

      // Recalcular tasas
      await recalculateRates(campaign_id);
    }

  } catch (error) {
    console.error('Track open error:', error);
  }

  // Siempre responder con el píxel (incluso si hay error)
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // GIF transparente 1x1 pixel
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.send(pixel);
});

/**
 * Tracking de clics en links
 * GET /track/click/:tracking_id/:link_id
 */
router.get('/click/:tracking_id/:link_id', async (req, res) => {
  try {
    const { tracking_id, link_id } = req.params;

    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const geo = geoip.lookup(ipAddress);

    // Obtener datos del email
    const email = await query(`
      SELECT campaign_id, contact_id, tenant_id 
      FROM email_queue WHERE tracking_id = $1
    `, [tracking_id]);

    if (email.rows.length > 0) {
      const { campaign_id, contact_id, tenant_id } = email.rows[0];

      // Verificar si es clic único
      const existingClick = await query(`
        SELECT id FROM email_tracking_logs
        WHERE tracking_id = $1 AND event_type = 'click' AND link_id = $2
        LIMIT 1
      `, [tracking_id, link_id]);

      const isFirstClick = existingClick.rows.length === 0;

      // Insertar log de clic
      await query(`
        INSERT INTO email_tracking_logs (
          tracking_id, campaign_id, contact_id, tenant_id,
          event_type, link_id, ip_address, user_agent, country_code, city
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        tracking_id,
        campaign_id,
        contact_id,
        tenant_id,
        'click',
        link_id,
        ipAddress,
        userAgent,
        geo?.country || null,
        geo?.city || null
      ]);

      // Actualizar contadores
      if (isFirstClick) {
        await query(`
          UPDATE marketing_campaigns 
          SET unique_click_count = unique_click_count + 1,
              click_count = click_count + 1
          WHERE id = $1
        `, [campaign_id]);

        await query(`
          UPDATE campaign_links 
          SET unique_click_count = unique_click_count + 1,
              click_count = click_count + 1
          WHERE link_id = $1
        `, [link_id]);

        // Incrementar lead_score
        await query(`
          UPDATE clients 
          SET lead_score = LEAST(lead_score + 10, 100)
          WHERE id = $1
        `, [contact_id]);
      } else {
        await query(`
          UPDATE marketing_campaigns 
          SET click_count = click_count + 1
          WHERE id = $1
        `, [campaign_id]);

        await query(`
          UPDATE campaign_links 
          SET click_count = click_count + 1
          WHERE link_id = $1
        `, [link_id]);
      }

      await recalculateRates(campaign_id);
    }

    // Obtener URL original y redirigir
    const link = await query(`
      SELECT original_url FROM campaign_links WHERE link_id = $1
    `, [link_id]);

    if (link.rows.length > 0) {
      return res.redirect(link.rows[0].original_url);
    }

  } catch (error) {
    console.error('Track click error:', error);
  }

  // Redirigir a home si hay error
  res.redirect(process.env.FRONTEND_URL || '/');
});

/**
 * Webhook para eventos de email (bounces, complaints, deliveries)
 * POST /track/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];

    for (const event of events) {
      const { event: eventType, email, tracking_id, reason, timestamp } = event;

      if (!tracking_id) continue;

      const emailData = await query(`
        SELECT campaign_id, contact_id, tenant_id 
        FROM email_queue WHERE tracking_id = $1
      `, [tracking_id]);

      if (emailData.rows.length === 0) continue;

      const { campaign_id, contact_id, tenant_id } = emailData.rows[0];

      switch (eventType) {
        case 'bounce':
          await query(`
            INSERT INTO email_tracking_logs (
              tracking_id, campaign_id, contact_id, tenant_id,
              event_type, error_message
            ) VALUES ($1, $2, $3, $4, 'bounce', $5)
          `, [tracking_id, campaign_id, contact_id, tenant_id, reason]);

          await query(`
            UPDATE email_queue SET status = 'bounced' WHERE tracking_id = $1
          `, [tracking_id]);

          await query(`
            UPDATE marketing_campaigns 
            SET bounce_count = bounce_count + 1
            WHERE id = $1
          `, [campaign_id]);
          break;

        case 'complaint':
          await query(`
            INSERT INTO email_tracking_logs (
              tracking_id, campaign_id, contact_id, tenant_id,
              event_type
            ) VALUES ($1, $2, $3, $4, 'complaint')
          `, [tracking_id, campaign_id, contact_id, tenant_id]);

          await query(`
            UPDATE marketing_campaigns 
            SET complaint_count = complaint_count + 1
            WHERE id = $1
          `, [campaign_id]);
          break;

        case 'delivered':
          await query(`
            UPDATE email_queue SET status = 'delivered', delivered_at = NOW()
            WHERE tracking_id = $1
          `, [tracking_id]);

          await query(`
            UPDATE marketing_campaigns 
            SET delivered_count = delivered_count + 1
            WHERE id = $1
          `, [campaign_id]);
          break;

        case 'unsubscribe':
          await query(`
            INSERT INTO email_tracking_logs (
              tracking_id, campaign_id, contact_id, tenant_id,
              event_type
            ) VALUES ($1, $2, $3, $4, 'unsubscribe')
          `, [tracking_id, campaign_id, contact_id, tenant_id]);

          await query(`
            UPDATE marketing_campaigns 
            SET unsubscribe_count = unsubscribe_count + 1
            WHERE id = $1
          `, [campaign_id]);
          break;
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * Generar link de WhatsApp
 * POST /track/whatsapp
 */
router.post('/whatsapp', async (req, res) => {
  try {
    const { contact_id, message_template } = req.body;
    const tenantId = req.headers['x-tenant-id'] || req.body.tenant_id;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID requerido'
      });
    }

    // Obtener datos del contacto
    const contact = await query(`
      SELECT phone, first_name, last_name, company_name 
      FROM clients WHERE id = $1 AND tenant_id = $2
    `, [contact_id, tenantId]);

    if (contact.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contacto no encontrado'
      });
    }

    const { phone, first_name, last_name, company_name } = contact.rows[0];

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'El contacto no tiene número de teléfono'
      });
    }

    // Personalizar mensaje
    let message = message_template
      .replace(/{{first_name}}/g, first_name || '')
      .replace(/{{last_name}}/g, last_name || '')
      .replace(/{{company_name}}/g, company_name || '');

    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message);

    // Limpiar número de teléfono
    const cleanPhone = phone.replace(/\D/g, '');

    // Generar link
    const waLink = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    // Guardar en BD
    const result = await query(`
      INSERT INTO whatsapp_links (
        tenant_id, contact_id, phone_number, message, encoded_message, wa_link
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [tenantId, contact_id, cleanPhone, message, encodedMessage, waLink]);

    res.json({
      success: true,
      data: {
        link: waLink,
        id: result.rows[0].id
      }
    });

  } catch (error) {
    console.error('WhatsApp link error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar link'
    });
  }
});

// Helper: Recalcular tasas de campaña
async function recalculateRates(campaignId) {
  await query(`
    UPDATE marketing_campaigns 
    SET 
      open_rate = CASE 
        WHEN delivered_count > 0 THEN ROUND(unique_open_count::decimal / delivered_count * 100, 2)
        ELSE 0 
      END,
      click_rate = CASE 
        WHEN delivered_count > 0 THEN ROUND(unique_click_count::decimal / delivered_count * 100, 2)
        ELSE 0 
      END,
      updated_at = NOW()
    WHERE id = $1
  `, [campaignId]);
}

module.exports = router;
