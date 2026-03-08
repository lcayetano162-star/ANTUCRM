// ============================================
// UTILIDADES DE TRACKING
// ============================================

const crypto = require('crypto');

/**
 * Genera un ID de tracking único para emails
 */
function generateTrackingId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Genera el píxel de tracking (imagen 1x1 transparente)
 * Este píxel se inyecta en el HTML del email
 */
function generateTrackingPixel(trackingId) {
  const trackingUrl = `${process.env.API_URL}/track/open/${trackingId}`;
  
  return `
    <img src="${trackingUrl}" 
         width="1" 
         height="1" 
         alt="" 
         style="display:block;opacity:0;"
         border="0" />
  `;
}

/**
 * Genera una URL de tracking para un link
 */
function generateTrackingLink(trackingId, linkId, originalUrl) {
  return `${process.env.API_URL}/track/click/${trackingId}/${linkId}`;
}

/**
 * Extrae todos los links de un HTML y los reemplaza con URLs de tracking
 */
function injectLinkTracking(html, trackingId, campaignId) {
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>/gi;
  let match;
  const links = [];
  let linkIndex = 0;
  
  let trackedHtml = html;

  while ((match = linkRegex.exec(html)) !== null) {
    const originalUrl = match[1];
    
    // Ignorar links de unsubscribe, mailto, tel, anchors
    if (originalUrl.startsWith('mailto:') || 
        originalUrl.startsWith('tel:') || 
        originalUrl.startsWith('#') ||
        originalUrl.includes('unsubscribe')) {
      continue;
    }

    const linkId = `link_${linkIndex}_${Date.now()}`;
    const trackingUrl = generateTrackingLink(trackingId, linkId, originalUrl);
    
    links.push({
      link_id: linkId,
      original_url: originalUrl,
      tracking_url: trackingUrl
    });

    // Reemplazar en el HTML
    trackedHtml = trackedHtml.replace(
      match[0],
      match[0].replace(originalUrl, trackingUrl)
    );

    linkIndex++;
  }

  return { html: trackedHtml, links };
}

/**
 * Genera un link corto para WhatsApp
 */
function generateWhatsAppLink(phone, message) {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

module.exports = {
  generateTrackingId,
  generateTrackingPixel,
  generateTrackingLink,
  injectLinkTracking,
  generateWhatsAppLink
};
