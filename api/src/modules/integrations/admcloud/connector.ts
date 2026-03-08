import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { pool } from '../../../shared/config/database';
import { dispatchWebhookEvent } from '../../../shared/services/webhookService';

// Admcloud REST API base — endpoints son estándar (/api/Customers, /api/Items, etc.)
const ADMCLOUD_BASE = 'https://api.admcloud.net';

// ── AES-256-GCM encryption ────────────────────────────────────────────────────
const ENC_KEY = Buffer.from(
  (process.env.ENCRYPTION_KEY || 'admcloud_enc_key_32_bytes_fallback').padEnd(32).slice(0, 32),
  'utf8'
);

export function encryptPassword(plain: string): string {
  const iv     = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const enc    = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return [iv.toString('hex'), enc.toString('hex'), tag.toString('hex')].join(':');
}

export function decryptPassword(stored: string): string {
  const [ivHex, encHex, tagHex] = stored.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8');
}

// ── Connection type ───────────────────────────────────────────────────────────
export interface AdmcloudConnection {
  id: string;
  tenant_id: string;
  company: string;
  role: string;
  app_id: string;
  username: string;
  password_enc: string;
  sync_clients: boolean;
  sync_opportunities: boolean;
  sync_invoices: boolean;
  sync_inventory: boolean;
  sync_ar: boolean;
  sync_service: boolean;
  sync_marketing: boolean;
}

// ── HTTP client factory ───────────────────────────────────────────────────────
// Auth: Basic Auth (usuario:clave) + query params company/role/appid en cada petición
function buildClient(conn: AdmcloudConnection): AxiosInstance {
  const password = decryptPassword(conn.password_enc);
  return axios.create({
    baseURL: ADMCLOUD_BASE,
    auth: { username: conn.username, password },
    params: { company: conn.company, role: conn.role, appid: conn.app_id },
    timeout: 30_000,
    headers: { Accept: 'application/json' },
  });
}

// ── Paginated GET helper ──────────────────────────────────────────────────────
// Admcloud usa paginación estándar (?page=1&pageSize=100)
async function getAll(
  client: AxiosInstance,
  endpoint: string,
  extraParams: Record<string, any> = {}
): Promise<any[]> {
  const results: any[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const res = await client.get(endpoint, {
      params: { ...extraParams, page, pageSize },
    });

    const raw = res.data;
    // Admcloud puede devolver: array, { data: [...] }, { records: [...] }, { value: [...] }
    let rows: any[] = [];
    if (Array.isArray(raw))                  rows = raw;
    else if (Array.isArray(raw?.data))       rows = raw.data;
    else if (Array.isArray(raw?.records))    rows = raw.records;
    else if (Array.isArray(raw?.value))      rows = raw.value;
    else if (raw && typeof raw === 'object') rows = [raw];

    results.push(...rows);
    if (rows.length < pageSize) break;   // última página
    page++;
    if (page > 50) break;                // safety cap
  }

  return results;
}

// ── POST/PUT helper ───────────────────────────────────────────────────────────
async function upsertRemote(client: AxiosInstance, endpoint: string, data: any, id?: string): Promise<any> {
  if (id) {
    const res = await client.put(endpoint, { ...data, ID: id });
    return res.data;
  }
  const res = await client.post(endpoint, data);
  return res.data;
}

// ══════════════════════════════════════════════════════════════════════════════
// FIELD MAPPERS
// ══════════════════════════════════════════════════════════════════════════════

// Admcloud /api/Customers response fields (ajustar si cambia)
function mapCustomer(r: any, tenantId: string) {
  return {
    tenant_id:    tenantId,
    type:         'client',
    company_name: r.BusinessName || r.Name || r.CompanyName || '',
    rnc:          r.TaxId || r.RNC || r.NIT || null,
    phone:        r.Phone || r.Phone1 || r.Telephone || null,
    email:        r.Email || r.EmailAddress || null,
    address:      r.Address || r.Address1 || null,
    city:         r.City || r.Municipality || null,
    external_id:  String(r.ID || r.CustomerID || r.Code || ''),
    external_code: String(r.CustomerCode || r.Code || r.ID || ''),
  };
}

// Admcloud /api/Opportunities
function mapOpportunity(r: any, tenantId: string, clientMap: Map<string, string>) {
  const externalClientId = String(r.CustomerID || r.ClientID || r.AccountID || '');
  return {
    tenant_id:   tenantId,
    title:       r.Name || r.Description || r.Subject || 'Oportunidad Admcloud',
    amount:      parseFloat(r.Amount || r.ExpectedAmount || r.Value || '0') || 0,
    stage:       mapSalesStage(r.SalesStage || r.Stage || r.Status || ''),
    probability: parseInt(r.Probability || r.WinProbability || '0') || 0,
    client_id:   clientMap.get(externalClientId) || null,
    external_id: String(r.ID || r.OpportunityID || ''),
    close_date:  r.CloseDate || r.ExpectedCloseDate || null,
    source:      'admcloud',
  };
}

// Admcloud /api/CreditInvoices + /api/CashInvoices
function mapInvoice(r: any, tenantId: string, type: 'credit' | 'cash') {
  return {
    tenant_id:     tenantId,
    ncf:           r.NCF || r.FiscalNumber || r.InvoiceNumber || null,
    ncf_type:      mapNcfType(r.FiscalSequenceType || r.NCFType || ''),
    subtotal:      parseFloat(r.SubTotal || r.Subtotal || '0') || 0,
    tax_amount:    parseFloat(r.TaxAmount || r.ITBIS || r.Tax || '0') || 0,
    total:         parseFloat(r.Total || r.TotalAmount || r.Amount || '0') || 0,
    status:        mapInvoiceStatus(r.Status || r.State || ''),
    invoice_type:  type,
    external_id:   String(r.ID || r.InvoiceID || ''),
    notes:         r.Notes || r.Comments || r.Description || null,
    invoice_date:  r.InvoiceDate || r.Date || null,
    due_date:      r.DueDate || r.ExpirationDate || null,
  };
}

// Admcloud /api/Items
function mapItem(r: any, tenantId: string) {
  return {
    tenant_id:      tenantId,
    sku:            r.ItemCode || r.Code || r.SKU || `ADM-${r.ID}`,
    name:           r.Name || r.Description || r.ItemName || '',
    type:           mapItemType(r.ItemType || r.Type || ''),
    unit_price:     parseFloat(r.SalePrice || r.Price || r.UnitPrice || '0') || 0,
    unit_cost:      parseFloat(r.Cost || r.UnitCost || r.AverageCost || '0') || 0,
    stock_quantity: parseFloat(r.OnHand || r.Quantity || r.Stock || '0') || 0,
    reorder_point:  parseFloat(r.ReorderPoint || r.MinimumStock || '0') || 0,
    tax_rate:       parseFloat(r.TaxRate || r.ITBIS || '0') || 0,
    location:       r.Location || r.Warehouse || r.StorageLocation || null,
    external_id:    String(r.ID || r.ItemID || ''),
    is_active:      r.Active !== false && r.Status !== 'Inactive',
  };
}

// Admcloud /api/AR (Accounts Receivable)
function mapARRecord(r: any) {
  return {
    invoice_external_id: String(r.InvoiceID || r.ID || ''),
    ncf:                 r.NCF || r.FiscalNumber || null,
    client_name:         r.CustomerName || r.ClientName || r.BusinessName || '',
    amount:              parseFloat(r.Total || r.Amount || r.OriginalAmount || '0') || 0,
    balance:             parseFloat(r.Balance || r.PendingAmount || r.Outstanding || '0') || 0,
    due_date:            r.DueDate || r.ExpirationDate || null,
    days_overdue:        parseInt(r.DaysOverdue || r.DaysLate || '0') || 0,
    status:              (parseFloat(r.Balance || r.PendingAmount || '0') <= 0) ? 'paid' : 'pending',
  };
}

// Admcloud /api/Incidents (Servicio Técnico)
function mapIncident(r: any, tenantId: string) {
  return {
    tenant_id:   tenantId,
    title:       r.Subject || r.Title || r.Description || r.Name || 'Ticket Admcloud',
    priority:    mapPriority(r.Priority || ''),
    status:      mapTicketStatus(r.Status || r.State || ''),
    external_id: String(r.ID || r.IncidentID || r.CaseNumber || ''),
    notes:       r.Notes || r.Description || r.Resolution || null,
    created_date: r.CreatedDate || r.OpenDate || null,
  };
}

// Admcloud /api/Contacts (Marketing)
function mapContact(r: any, tenantId: string) {
  const fullName = r.Name || r.FullName || `${r.FirstName || ''} ${r.LastName || ''}`.trim() || 'Sin nombre';
  const parts = fullName.split(' ');
  return {
    tenant_id:   tenantId,
    first_name:  r.FirstName || parts[0] || '',
    last_name:   r.LastName || parts.slice(1).join(' ') || '',
    email:       r.Email || r.EmailAddress || null,
    phone:       r.Phone || r.MobilePhone || r.Telephone || null,
    position:    r.JobTitle || r.Position || r.Title || null,
    external_id: String(r.ID || r.ContactID || ''),
    source:      'admcloud',
  };
}

// ── Status mappers ────────────────────────────────────────────────────────────
function mapSalesStage(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('prospect') || l.includes('lead') || l.includes('nuevo')) return 'prospecting';
  if (l.includes('qualif') || l.includes('calif')) return 'qualification';
  if (l.includes('prop') || l.includes('quot') || l.includes('cotiz')) return 'proposal';
  if (l.includes('negoc')) return 'negotiation';
  if (l.includes('won') || l.includes('gan') || l.includes('closed won')) return 'closed_won';
  if (l.includes('lost') || l.includes('perd')) return 'closed_lost';
  return 'prospecting';
}

function mapInvoiceStatus(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('paid') || l.includes('pag') || l.includes('cobr')) return 'paid';
  if (l.includes('void') || l.includes('cancel') || l.includes('anu')) return 'cancelled';
  if (l.includes('overdue') || l.includes('venc')) return 'overdue';
  if (l.includes('partial') || l.includes('parcial')) return 'partial';
  if (l.includes('sent') || l.includes('enviad')) return 'sent';
  return 'draft';
}

function mapNcfType(s: string): string {
  if (s.includes('01') || s.toLowerCase().includes('credit') || s.toLowerCase().includes('fiscal')) return 'B01';
  if (s.includes('02') || s.toLowerCase().includes('consumer') || s.toLowerCase().includes('final')) return 'B02';
  if (s.includes('14')) return 'B14';
  if (s.includes('15')) return 'B15';
  return 'B02';
}

function mapItemType(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('service') || l.includes('servic')) return 'service';
  if (l.includes('expense') || l.includes('gasto')) return 'expense';
  return 'product';
}

function mapPriority(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('high') || l.includes('alta') || l.includes('urgent')) return 'high';
  if (l.includes('low') || l.includes('baja')) return 'low';
  if (l.includes('critic')) return 'critical';
  return 'medium';
}

function mapTicketStatus(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('clos') || l.includes('resolv') || l.includes('cerr')) return 'closed';
  if (l.includes('progress') || l.includes('open') || l.includes('curso')) return 'in_progress';
  if (l.includes('pend') || l.includes('wait')) return 'pending';
  return 'open';
}

// ══════════════════════════════════════════════════════════════════════════════
// SYNC FUNCTIONS — usan endpoints REST reales de Admcloud
// ══════════════════════════════════════════════════════════════════════════════

export async function syncClients(conn: AdmcloudConnection, logId: string): Promise<Map<string, string>> {
  const client = buildClient(conn);
  const records = await getAll(client, '/api/Customers');
  const externalToInternal = new Map<string, string>();
  let created = 0, updated = 0, failed = 0;

  for (const r of records) {
    try {
      const mapped = mapCustomer(r, conn.tenant_id);
      if (!mapped.company_name || !mapped.external_id) continue;

      const existing = await pool.query(
        'SELECT id FROM clients WHERE tenant_id=$1 AND external_id=$2 LIMIT 1',
        [conn.tenant_id, mapped.external_id]
      );

      let internalId: string;
      if (existing.rows.length > 0) {
        internalId = existing.rows[0].id;
        await pool.query(
          `UPDATE clients SET
             company_name=$1, rnc=$2, phone=$3, email=$4, address=$5, city=$6, updated_at=NOW()
           WHERE id=$7`,
          [mapped.company_name, mapped.rnc, mapped.phone, mapped.email, mapped.address, mapped.city, internalId]
        );
        updated++;
      } else {
        const ins = await pool.query(
          `INSERT INTO clients (tenant_id,type,company_name,rnc,phone,email,address,city,external_id,status,created_at,updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',NOW(),NOW()) RETURNING id`,
          [mapped.tenant_id, mapped.type, mapped.company_name, mapped.rnc,
           mapped.phone, mapped.email, mapped.address, mapped.city, mapped.external_id]
        );
        internalId = ins.rows[0].id;
        created++;
      }
      externalToInternal.set(mapped.external_id, internalId);
    } catch { failed++; }
  }

  await pool.query(
    'UPDATE admcloud_sync_logs SET records_pulled=$1,records_created=$2,records_updated=$3,records_failed=$4 WHERE id=$5',
    [records.length, created, updated, failed, logId]
  );

  if (created + updated > 0) {
    dispatchWebhookEvent(conn.tenant_id, 'client.synced_from_admcloud', { created, updated }).catch(() => {});
  }
  return externalToInternal;
}

export async function syncOpportunities(
  conn: AdmcloudConnection, logId: string, clientMap: Map<string, string>
) {
  const client = buildClient(conn);
  // Admcloud tiene endpoint específico para oportunidades abiertas
  const [open, all] = await Promise.all([
    getAll(client, '/api/Opportunities/Open').catch(() => []),
    getAll(client, '/api/Opportunities').catch(() => []),
  ]);
  const records = all.length >= open.length ? all : [...open, ...all.filter(a => !open.find(o => o.ID === a.ID))];
  let created = 0, updated = 0, failed = 0;

  for (const r of records) {
    try {
      const mapped = mapOpportunity(r, conn.tenant_id, clientMap);
      const existing = await pool.query(
        'SELECT id FROM opportunities WHERE tenant_id=$1 AND external_id=$2 LIMIT 1',
        [conn.tenant_id, mapped.external_id]
      );

      if (existing.rows.length > 0) {
        await pool.query(
          'UPDATE opportunities SET name=$1,estimated_revenue=$2,stage=$3,client_id=$4,updated_at=NOW() WHERE id=$5',
          [mapped.title, mapped.amount, mapped.stage, mapped.client_id, existing.rows[0].id]
        );
        updated++;
      } else {
        await pool.query(
          `INSERT INTO opportunities (tenant_id,name,estimated_revenue,stage,client_id,external_id,source,status,created_at,updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'active',NOW(),NOW())`,
          [mapped.tenant_id, mapped.title, mapped.amount, mapped.stage,
           mapped.client_id, mapped.external_id, mapped.source]
        );
        created++;
      }
    } catch { failed++; }
  }

  await pool.query(
    'UPDATE admcloud_sync_logs SET records_pulled=$1,records_created=$2,records_updated=$3,records_failed=$4 WHERE id=$5',
    [records.length, created, updated, failed, logId]
  );
}

export async function syncInvoices(conn: AdmcloudConnection, logId: string) {
  const client = buildClient(conn);
  // Admcloud tiene facturas a crédito y al contado separadas
  const [creditInvoices, cashInvoices] = await Promise.all([
    getAll(client, '/api/CreditInvoices').catch(() => []),
    getAll(client, '/api/CashInvoices').catch(() => []),
  ]);

  const allInvoices = [
    ...creditInvoices.map(r => ({ ...r, _type: 'credit' as const })),
    ...cashInvoices.map(r => ({ ...r, _type: 'cash' as const })),
  ];
  let created = 0, updated = 0, failed = 0;

  for (const r of allInvoices) {
    try {
      const mapped = mapInvoice(r, conn.tenant_id, r._type);
      const extId = `${r._type}_${mapped.external_id}`;

      const existing = await pool.query(
        'SELECT id FROM invoices WHERE tenant_id=$1 AND external_id=$2 LIMIT 1',
        [conn.tenant_id, extId]
      );

      if (existing.rows.length > 0) {
        await pool.query(
          'UPDATE invoices SET status=$1,total=$2,updated_at=NOW() WHERE id=$3',
          [mapped.status, mapped.total, existing.rows[0].id]
        );
        updated++;
      } else {
        await pool.query(
          `INSERT INTO invoices (tenant_id,ncf,ncf_type,subtotal,tax_amount,total,status,external_id,notes,created_at,updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
          [mapped.tenant_id, mapped.ncf, mapped.ncf_type, mapped.subtotal,
           mapped.tax_amount, mapped.total, mapped.status, extId, mapped.notes]
        );
        created++;
      }
    } catch { failed++; }
  }

  await pool.query(
    'UPDATE admcloud_sync_logs SET records_pulled=$1,records_created=$2,records_updated=$3,records_failed=$4 WHERE id=$5',
    [allInvoices.length, created, updated, failed, logId]
  );
}

export async function syncInventory(conn: AdmcloudConnection, logId: string) {
  const client = buildClient(conn);
  const records = await getAll(client, '/api/Items');
  let created = 0, updated = 0, failed = 0;

  for (const r of records) {
    try {
      const mapped = mapItem(r, conn.tenant_id);
      if (!mapped.name) continue;

      const existing = await pool.query(
        'SELECT id FROM inventory_products WHERE tenant_id=$1 AND external_id=$2 LIMIT 1',
        [conn.tenant_id, mapped.external_id]
      );

      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE inventory_products SET
             name=$1,unit_price=$2,unit_cost=$3,stock_quantity=$4,
             reorder_point=$5,location=$6,is_active=$7,updated_at=NOW()
           WHERE id=$8`,
          [mapped.name, mapped.unit_price, mapped.unit_cost, mapped.stock_quantity,
           mapped.reorder_point, mapped.location, mapped.is_active, existing.rows[0].id]
        );
        updated++;
      } else {
        await pool.query(
          `INSERT INTO inventory_products
             (tenant_id,sku,name,type,unit_price,unit_cost,stock_quantity,reorder_point,location,external_id,is_active,created_at,updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())`,
          [mapped.tenant_id, mapped.sku, mapped.name, mapped.type, mapped.unit_price,
           mapped.unit_cost, mapped.stock_quantity, mapped.reorder_point,
           mapped.location, mapped.external_id, mapped.is_active]
        );
        created++;
      }
    } catch { failed++; }
  }

  await pool.query(
    'UPDATE admcloud_sync_logs SET records_pulled=$1,records_created=$2,records_updated=$3,records_failed=$4 WHERE id=$5',
    [records.length, created, updated, failed, logId]
  );
}

export async function syncAccountsReceivable(conn: AdmcloudConnection, logId: string) {
  const client = buildClient(conn);
  // /api/AR devuelve el aging/saldo de cuentas por cobrar
  const records = await getAll(client, '/api/AR');
  const arData = records.map(mapARRecord);
  let updated = 0;

  for (const ar of arData) {
    try {
      if (ar.invoice_external_id) {
        // Actualizar estado de facturas existentes por su ID externo (crédito o contado)
        for (const prefix of ['credit_', 'cash_', '']) {
          const res = await pool.query(
            'UPDATE invoices SET status=$1,updated_at=NOW() WHERE tenant_id=$2 AND external_id=$3',
            [ar.status, conn.tenant_id, `${prefix}${ar.invoice_external_id}`]
          );
          if ((res.rowCount ?? 0) > 0) { updated++; break; }
        }
      }
    } catch { /* continuar */ }
  }

  await pool.query(
    'UPDATE admcloud_sync_logs SET records_pulled=$1,records_created=0,records_updated=$2,records_failed=0 WHERE id=$3',
    [arData.length, updated, logId]
  );
  return arData;
}

export async function syncServiceTickets(conn: AdmcloudConnection, logId: string) {
  const client = buildClient(conn);
  // /api/Incidents para tickets de servicio técnico
  const records = await getAll(client, '/api/Incidents');
  let created = 0, updated = 0, failed = 0;

  for (const r of records) {
    try {
      const mapped = mapIncident(r, conn.tenant_id);
      const existing = await pool.query(
        'SELECT id FROM service_tickets WHERE tenant_id=$1 AND external_id=$2 LIMIT 1',
        [conn.tenant_id, mapped.external_id]
      );

      if (existing.rows.length > 0) {
        await pool.query(
          'UPDATE service_tickets SET status=$1,priority=$2,updated_at=NOW() WHERE id=$3',
          [mapped.status, mapped.priority, existing.rows[0].id]
        );
        updated++;
      } else {
        await pool.query(
          `INSERT INTO service_tickets (tenant_id,title,priority,status,external_id,notes,created_at,updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())`,
          [mapped.tenant_id, mapped.title, mapped.priority, mapped.status,
           mapped.external_id, mapped.notes]
        );
        created++;
      }
    } catch { failed++; }
  }

  await pool.query(
    'UPDATE admcloud_sync_logs SET records_pulled=$1,records_created=$2,records_updated=$3,records_failed=$4 WHERE id=$5',
    [records.length, created, updated, failed, logId]
  );
}

export async function syncMarketing(conn: AdmcloudConnection, logId: string) {
  const client = buildClient(conn);
  // /api/Contacts para contactos de marketing
  const records = await getAll(client, '/api/Contacts');
  let created = 0, updated = 0, failed = 0;

  for (const r of records) {
    try {
      const mapped = mapContact(r, conn.tenant_id);
      if (!mapped.email && !mapped.phone) continue;

      const existing = await pool.query(
        'SELECT id FROM contacts WHERE tenant_id=$1 AND external_id=$2 LIMIT 1',
        [conn.tenant_id, mapped.external_id]
      );

      if (existing.rows.length > 0) {
        await pool.query(
          'UPDATE contacts SET first_name=$1,last_name=$2,email=$3,phone=$4,updated_at=NOW() WHERE id=$5',
          [mapped.first_name, mapped.last_name, mapped.email, mapped.phone, existing.rows[0].id]
        );
        updated++;
      } else {
        await pool.query(
          `INSERT INTO contacts (tenant_id,first_name,last_name,email,phone,external_id,source,created_at,updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())`,
          [mapped.tenant_id, mapped.first_name, mapped.last_name,
           mapped.email, mapped.phone, mapped.external_id, mapped.source]
        );
        created++;
      }
    } catch { failed++; }
  }

  await pool.query(
    'UPDATE admcloud_sync_logs SET records_pulled=$1,records_created=$2,records_updated=$3,records_failed=$4 WHERE id=$5',
    [records.length, created, updated, failed, logId]
  );
}

// ── Test connection ───────────────────────────────────────────────────────────
export async function testConnection(conn: AdmcloudConnection): Promise<{ ok: boolean; message: string }> {
  try {
    const client = buildClient(conn);
    // GET /api/Company es liviano y verifica auth + credenciales
    const res = await client.get('/api/Company');
    const companyName = res.data?.Name || res.data?.BusinessName || 'empresa';
    return { ok: true, message: `Conexión exitosa — ${companyName}` };
  } catch (err: any) {
    const status = err.response?.status;
    if (status === 401) return { ok: false, message: 'Credenciales inválidas (usuario o clave incorrectos)' };
    if (status === 403) return { ok: false, message: 'Sin permisos. Verifica el rol y el App ID de integración.' };
    if (status === 404) return { ok: false, message: 'Empresa no encontrada. Verifica el campo "company".' };
    return { ok: false, message: err.message || 'Error de conexión con Admcloud' };
  }
}
