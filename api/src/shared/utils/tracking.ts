import crypto from 'crypto';

export function generateTrackingId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateTrackingPixel(trackingId: string): string {
  const trackingUrl = `${process.env.API_URL}/track/open/${trackingId}`;
  return `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:block;opacity:0;" border="0" />`;
}

export function generateTrackingLink(trackingId: string, linkId: string, originalUrl: string): string {
  return `${process.env.API_URL}/track/click/${trackingId}/${linkId}`;
}

export function injectLinkTracking(html: string, trackingId: string, campaignId: string) {
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>/gi;
  let match;
  const links: { link_id: string; original_url: string; tracking_url: string }[] = [];
  let linkIndex = 0;
  let trackedHtml = html;

  while ((match = linkRegex.exec(html)) !== null) {
    const originalUrl = match[1];
    if (
      originalUrl.startsWith('mailto:') ||
      originalUrl.startsWith('tel:') ||
      originalUrl.startsWith('#') ||
      originalUrl.includes('unsubscribe')
    ) continue;

    const linkId = `link_${linkIndex}_${Date.now()}`;
    const trackingUrl = generateTrackingLink(trackingId, linkId, originalUrl);
    links.push({ link_id: linkId, original_url: originalUrl, tracking_url: trackingUrl });
    trackedHtml = trackedHtml.replace(match[0], match[0].replace(originalUrl, trackingUrl));
    linkIndex++;
  }

  return { html: trackedHtml, links };
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
