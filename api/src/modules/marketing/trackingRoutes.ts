import { Router, Request, Response } from 'express';
import { query } from '../../shared/config/database';
import { generateTrackingId } from '../../shared/utils/tracking';
import geoip from 'geoip-lite';

const router = Router();

// GET /api/tracking/open/:tracking_id - 1x1 pixel for email open tracking
router.get('/open/:tracking_id', async (req: Request, res: Response) => {
  try {
    const { tracking_id } = req.params;
    const ip = req.ip || req.connection.remoteAddress || '';
    const geo = geoip.lookup(ip);
    const userAgent = req.headers['user-agent'] || '';

    await query(
      `INSERT INTO email_tracking_logs (tracking_id, event_type, ip_address, user_agent, country, city, created_at)
       VALUES ($1, 'open', $2, $3, $4, $5, NOW())`,
      [tracking_id, ip, userAgent, geo?.country || null, geo?.city || null]
    ).catch(() => {}); // Don't fail on tracking error

    // Return 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.send(pixel);
  } catch (error) {
    // Silently fail - don't break email rendering
    res.status(200).send();
  }
});

// GET /api/tracking/click/:tracking_id/:link_id - Click tracking redirect
router.get('/click/:tracking_id/:link_id', async (req: Request, res: Response) => {
  try {
    const { tracking_id, link_id } = req.params;
    const ip = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const geo = geoip.lookup(ip);

    await query(
      `INSERT INTO email_tracking_logs (tracking_id, event_type, link_id, ip_address, user_agent, country, city, created_at)
       VALUES ($1, 'click', $2, $3, $4, $5, $6, NOW())`,
      [tracking_id, link_id, ip, userAgent, geo?.country || null, geo?.city || null]
    ).catch(() => {});

    const linkResult = await query('SELECT original_url FROM campaign_links WHERE id = $1', [link_id]);
    if (linkResult.rows.length > 0) {
      return res.redirect(linkResult.rows[0].original_url);
    }
    res.redirect('/');
  } catch (error) {
    res.redirect('/');
  }
});

// POST /api/tracking/webhook - Email provider webhook (bounces, unsubscribes)
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    for (const event of events) {
      if (event.email && event.event) {
        await query(
          `INSERT INTO email_tracking_logs (tracking_id, event_type, ip_address, created_at)
           VALUES ($1, $2, '0.0.0.0', NOW())`,
          [event.tracking_id || generateTrackingId(), event.event]
        ).catch(() => {});
      }
    }
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

// POST /api/tracking/whatsapp - WhatsApp link click tracking
router.post('/whatsapp', async (req: Request, res: Response) => {
  try {
    const { tracking_id, contact_id } = req.body;
    await query(
      `INSERT INTO whatsapp_links (tracking_id, contact_id, clicked_at) VALUES ($1, $2, NOW())`,
      [tracking_id, contact_id]
    ).catch(() => {});
    res.json({ tracked: true });
  } catch (error) {
    res.status(500).json({ error: 'Error registrando click WhatsApp' });
  }
});

export default router;
