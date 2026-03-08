/**
 * Routes - Interactions Timeline API
 * 
 * Endpoints:
 * - GET /api/interactions/timeline/:clientId - Timeline de cliente
 * - GET /api/interactions/thread/:threadId - Conversación completa
 * - POST /api/interactions/search - Búsqueda de texto
 * - GET /api/interactions/summary/:clientId - Resumen para dashboard
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../shared/middleware/auth';
import { interactionService } from './interactionService';

const router = Router();

// ─── GET /api/interactions/timeline/:clientId ────────────────────────────────
router.get('/timeline/:clientId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { clientId } = req.params;
    const { 
      channels,      // email,whatsapp,sms,call,note (comma separated)
      limit = '50', 
      offset = '0',
      includePrivate = 'false'
    } = req.query;

    // Parsear canales
    const channelArray = channels 
      ? (channels as string).split(',') as any[]
      : undefined;

    const timeline = await interactionService.getClientTimeline(
      user.tenant_id,
      clientId,
      {
        channels: channelArray,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        includePrivate: includePrivate === 'true'
      }
    );

    res.json({
      success: true,
      data: timeline,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: timeline.length === parseInt(limit as string)
      }
    });
  } catch (error: any) {
    console.error('[Interactions] Timeline error:', error);
    res.status(500).json({ error: error.message || 'Error fetching timeline' });
  }
});

// ─── GET /api/interactions/thread/:threadId ──────────────────────────────────
router.get('/thread/:threadId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { threadId } = req.params;

    const thread = await interactionService.getThread(user.tenant_id, threadId);

    res.json({
      success: true,
      data: thread
    });
  } catch (error: any) {
    console.error('[Interactions] Thread error:', error);
    res.status(500).json({ error: error.message || 'Error fetching thread' });
  }
});

// ─── POST /api/interactions/search ───────────────────────────────────────────
router.post('/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { q: searchTerm, client_id } = req.body;

    if (!searchTerm || searchTerm.length < 3) {
      return res.status(400).json({ error: 'Search term must be at least 3 characters' });
    }

    const results = await interactionService.search(
      user.tenant_id,
      searchTerm,
      client_id
    );

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error: any) {
    console.error('[Interactions] Search error:', error);
    res.status(500).json({ error: error.message || 'Error searching interactions' });
  }
});

// ─── GET /api/interactions/summary/:clientId ─────────────────────────────────
router.get('/summary/:clientId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { clientId } = req.params;

    const summary = await interactionService.getSummary(user.tenant_id, clientId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    console.error('[Interactions] Summary error:', error);
    res.status(500).json({ error: error.message || 'Error fetching summary' });
  }
});

// ─── POST /api/interactions/note (Nota interna) ──────────────────────────────
router.post('/note', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { client_id, content } = req.body;

    if (!client_id || !content) {
      return res.status(400).json({ error: 'client_id and content are required' });
    }

    const note = await interactionService.saveInteraction({
      tenant_id: user.tenant_id,
      client_id,
      user_id: user.id,
      channel: 'note',
      direction: 'internal',
      content,
      from_address: user.email,
      to_address: 'internal',
      is_private: true
    });

    res.status(201).json({
      success: true,
      data: note
    });
  } catch (error: any) {
    console.error('[Interactions] Note error:', error);
    res.status(500).json({ error: error.message || 'Error creating note' });
  }
});

export default router;
