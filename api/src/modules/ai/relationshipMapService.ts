import { query } from '../../shared/config/database';

export interface MapNode {
  id: string;
  type: 'client' | 'contact' | 'opportunity' | 'user';
  label: string;
  subtitle?: string;
  meta?: Record<string, any>;
}

export interface MapEdge {
  source: string;
  target: string;
  label?: string;
}

export interface RelationshipMap {
  nodes: MapNode[];
  edges: MapEdge[];
  generatedAt: string;
}

export async function getRelationshipMap(tenantId: string, clientId: string): Promise<RelationshipMap> {
  const nodes: MapNode[] = [];
  const edges: MapEdge[] = [];

  // ── 1. Client ──────────────────────────────────────────────────────────────
  const clientRes = await query(
    `SELECT id, name, status, industry FROM clients WHERE id = $1 AND tenant_id = $2`,
    [clientId, tenantId]
  );
  if (clientRes.rows.length === 0) throw new Error('Cliente no encontrado');
  const client = clientRes.rows[0];

  nodes.push({
    id: `client:${client.id}`,
    type: 'client',
    label: client.name,
    subtitle: client.industry || client.status,
    meta: { status: client.status, industry: client.industry },
  });

  // ── 2. Contacts ────────────────────────────────────────────────────────────
  const contactsRes = await query(
    `SELECT id, first_name, last_name, job_title, email
     FROM contacts
     WHERE client_id = $1 AND tenant_id = $2
     ORDER BY created_at ASC
     LIMIT 10`,
    [clientId, tenantId]
  );
  for (const c of contactsRes.rows) {
    const nodeId = `contact:${c.id}`;
    nodes.push({
      id: nodeId,
      type: 'contact',
      label: `${c.first_name} ${c.last_name}`,
      subtitle: c.job_title || c.email,
      meta: { email: c.email, job_title: c.job_title },
    });
    edges.push({ source: `client:${client.id}`, target: nodeId, label: 'contacto' });
  }

  // ── 3. Opportunities ───────────────────────────────────────────────────────
  const oppsRes = await query(
    `SELECT o.id, o.name, o.stage, o.estimated_revenue, o.probability,
            o.owner_id, u.first_name || ' ' || u.last_name AS owner_name,
            o.ai_deal_score, o.ai_score_label
     FROM opportunities o
     LEFT JOIN users u ON o.owner_id = u.id
     WHERE o.client_id = $1 AND o.tenant_id = $2 AND o.status = 'active'
     ORDER BY o.created_at DESC
     LIMIT 8`,
    [clientId, tenantId]
  );

  const userSet = new Map<string, { id: string; name: string }>();

  for (const o of oppsRes.rows) {
    const oppNodeId = `opp:${o.id}`;
    const stageLabels: Record<string, string> = {
      qualify: 'Calificación', analysis: 'Análisis',
      proposal: 'Propuesta', negotiation: 'Negociación',
      closed_won: 'Ganada', closed_lost: 'Perdida',
    };
    nodes.push({
      id: oppNodeId,
      type: 'opportunity',
      label: o.name,
      subtitle: stageLabels[o.stage] || o.stage,
      meta: {
        stage: o.stage,
        revenue: o.estimated_revenue,
        probability: o.probability,
        score: o.ai_deal_score,
        scoreLabel: o.ai_score_label,
        owner: o.owner_name,
      },
    });
    edges.push({ source: `client:${client.id}`, target: oppNodeId, label: 'oportunidad' });

    // Link contacts to opportunities if they share the same client
    // (simplified: connect first contact to opportunity)
    if (contactsRes.rows.length > 0) {
      edges.push({ source: `contact:${contactsRes.rows[0].id}`, target: oppNodeId, label: 'involucrado' });
    }

    // Collect unique users
    if (o.owner_id && !userSet.has(o.owner_id)) {
      userSet.set(o.owner_id, { id: o.owner_id, name: o.owner_name || 'Sin nombre' });
    }
  }

  // ── 4. Users (owners) ──────────────────────────────────────────────────────
  for (const [userId, user] of userSet.entries()) {
    const userNodeId = `user:${userId}`;
    nodes.push({
      id: userNodeId,
      type: 'user',
      label: user.name,
      subtitle: 'Vendedor',
    });
    // Connect user to their opportunities
    for (const o of oppsRes.rows) {
      if (o.owner_id === userId) {
        edges.push({ source: userNodeId, target: `opp:${o.id}`, label: 'responsable' });
      }
    }
  }

  return { nodes, edges, generatedAt: new Date().toISOString() };
}
