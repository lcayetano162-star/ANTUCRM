import crypto from 'crypto';
import { query } from '../../../shared/config/database';

// ─── Encryption ───────────────────────────────────────────────────────────────
// AES-256-GCM: key from env (must be 32 bytes / 64 hex chars)
// Stored format: iv_hex:authTag_hex:ciphertext_hex

const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY || 'a'.repeat(64); // fallback: MUST be set in prod
const ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_HEX.slice(0, 64), 'hex');

export function encryptApiKey(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptApiKey(stored: string): string {
  const [ivHex, tagHex, ctHex] = stored.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const ciphertext = Buffer.from(ctHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
}

// ─── Log helper ───────────────────────────────────────────────────────────────
export async function logIntegrationCall(opts: {
  tenantId: string;
  serviceName: string;
  endpoint: string;
  method: string;
  statusCode?: number;
  durationMs?: number;
  requestPayload?: any;
  responseBody?: any;
  errorMessage?: string;
  triggeredBy?: string;
}) {
  try {
    await query(
      `INSERT INTO erp_integration_logs
         (tenant_id, service_name, endpoint, method, status_code, duration_ms,
          request_payload, response_body, error_message, triggered_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        opts.tenantId, opts.serviceName, opts.endpoint, opts.method,
        opts.statusCode ?? null, opts.durationMs ?? null,
        opts.requestPayload ? JSON.stringify(opts.requestPayload) : null,
        opts.responseBody  ? JSON.stringify(opts.responseBody)  : null,
        opts.errorMessage  ?? null,
        opts.triggeredBy   ?? null,
      ]
    );
  } catch (e) {
    console.error('[ERP] Error writing integration log:', e);
  }
}

// ─── Alegra invoice payload builder ──────────────────────────────────────────
export function buildAlegraInvoicePayload(invoice: any) {
  return {
    date: invoice.issue_date ? new Date(invoice.issue_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    dueDate: invoice.due_date ? new Date(invoice.due_date).toISOString().slice(0, 10) : null,
    client: { id: invoice.client_alegra_id || null, name: invoice.client_name || 'Cliente' },
    items: (invoice.line_items || []).map((li: any) => ({
      name: li.description || li.name,
      quantity: li.quantity || 1,
      price: li.unit_price || li.price || 0,
      tax: li.tax_rate ? [{ name: 'ITBIS', percentage: li.tax_rate }] : []
    })),
    observations: `NCF: ${invoice.ncf_number || ''} — Factura desde Antü CRM #${invoice.invoice_number || invoice.id}`,
    paymentForm: invoice.payment_method === 'cash' ? 'cash' : 'debit',
  };
}

// ─── Odoo inventory payload builder ──────────────────────────────────────────
export function buildOdooStockMovePayload(movement: any) {
  return {
    product_id: movement.product_odoo_id || movement.product_id,
    qty: Math.abs(movement.quantity),
    location_id: movement.type === 'out' ? 8 : 12, // warehouse → customers or suppliers → warehouse
    location_dest_id: movement.type === 'out' ? 5 : 8,
    reference: `AntuCRM-${movement.id}`,
  };
}

// ─── DGII RNC Lookup ──────────────────────────────────────────────────────────
// The DGII does not have a public REST API. We call their SOAP/web service endpoint.
// If unavailable, we return a structured error so the frontend can handle it gracefully.

const DGII_ENDPOINT = 'https://www.dgii.gov.do/app/WebApps/ConsultasWeb/consultas/rnc.aspx';

// Known sample RNCs for development/testing (RNCs reales públicos)
const DGII_MOCK_DB: Record<string, { razon_social: string; nombre_comercial: string; actividad_economica: string; estado: string }> = {
  '101001562': { razon_social: 'BANCO DE RESERVAS DE LA REPUBLICA DOMINICANA',   nombre_comercial: 'Banreservas',    actividad_economica: 'Servicios Bancarios',                   estado: 'ACTIVO' },
  '101003861': { razon_social: 'EMPRESA DISTRIBUIDORA DEL NORTE S.A.',             nombre_comercial: 'Edenorte',       actividad_economica: 'Distribución de Energía Eléctrica',     estado: 'ACTIVO' },
  '130000012': { razon_social: 'CLARO DOMINICANA S.A.',                            nombre_comercial: 'Claro',          actividad_economica: 'Telecomunicaciones',                     estado: 'ACTIVO' },
  '101512185': { razon_social: 'CENTRO CUESTA NACIONAL CxA',                       nombre_comercial: 'CCN',            actividad_economica: 'Comercio al por Menor',                  estado: 'ACTIVO' },
  '101005658': { razon_social: 'CERVECERIA NACIONAL DOMINICANA S.A.',              nombre_comercial: 'Presidente',     actividad_economica: 'Elaboración de Bebidas',                 estado: 'ACTIVO' },
};

export async function lookupRNC(rnc: string): Promise<{
  rnc: string;
  razon_social: string;
  nombre_comercial: string;
  actividad_economica: string;
  estado: string;
  source: 'dgii' | 'cache' | 'mock';
}> {
  const clean = rnc.replace(/[^0-9]/g, '');

  // 1. Check mock/known RNCs first (instant)
  if (DGII_MOCK_DB[clean]) {
    return { rnc: clean, ...DGII_MOCK_DB[clean], source: 'mock' };
  }

  // 2. Try DGII web service (their hidden JSON endpoint used by their own web)
  const dgiiApiUrl = `https://www.dgii.gov.do/app/WebApps/ConsultasWeb/TributarioCompleto.aspx/GetTributario`;

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(dgiiApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ value: clean }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const json = await resp.json();
      // DGII returns { d: "RNC|NAME|COMERCIAL|ACTIVITY|STATUS|..." } pipe-delimited
      const raw: string = json?.d ?? '';
      if (raw && raw !== 'null') {
        const parts = raw.split('|');
        return {
          rnc: clean,
          razon_social:       parts[1]?.trim() || '',
          nombre_comercial:   parts[2]?.trim() || '',
          actividad_economica: parts[4]?.trim() || '',
          estado:             parts[5]?.trim() || 'ACTIVO',
          source: 'dgii',
        };
      }
    }
  } catch {
    // DGII unreachable — return structured error below
  }

  // 3. RNC not found or DGII unreachable
  throw Object.assign(new Error(`RNC ${clean} no encontrado en la base de datos de la DGII`), { code: 'RNC_NOT_FOUND', rnc: clean });
}

// ─── Invoice dispatch to external ERP ────────────────────────────────────────
export async function dispatchInvoiceToERP(tenantId: string, invoice: any): Promise<void> {
  // Load all active ERP integrations for this tenant
  const result = await query(
    `SELECT service_name, api_url, api_key_encrypted, extra_config
       FROM erp_integrations
      WHERE tenant_id = $1 AND is_active = true AND service_name IN ('alegra','odoo','quickbooks')`,
    [tenantId]
  );

  for (const integration of result.rows) {
    const apiKey = integration.api_key_encrypted ? decryptApiKey(integration.api_key_encrypted) : '';
    const start = Date.now();

    if (integration.service_name === 'alegra') {
      await callAlegra(tenantId, integration.api_url, apiKey, invoice, start, integration.extra_config);
    } else if (integration.service_name === 'odoo') {
      await callOdoo(tenantId, integration.api_url, apiKey, invoice, start, integration.extra_config);
    } else if (integration.service_name === 'quickbooks') {
      await callQuickBooks(tenantId, integration.api_url, apiKey, invoice, start, integration.extra_config);
    }
  }
}

async function callAlegra(tenantId: string, apiUrl: string, apiKey: string, invoice: any, start: number, extra: any) {
  const endpoint = `${apiUrl || 'https://app.alegra.com/api/r1'}/invoices`;
  const payload = buildAlegraInvoicePayload(invoice);
  try {
    const [user, token] = apiKey.split(':'); // Alegra uses user:token basic auth
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${user}:${token}`).toString('base64'),
      },
      body: JSON.stringify(payload),
    });
    const body = await resp.json().catch(() => ({}));
    await logIntegrationCall({ tenantId, serviceName: 'alegra', endpoint, method: 'POST',
      statusCode: resp.status, durationMs: Date.now() - start,
      requestPayload: payload, responseBody: body,
      errorMessage: resp.ok ? undefined : JSON.stringify(body),
      triggeredBy: 'invoice.created' });
    if (resp.ok) {
      await query(`UPDATE erp_integrations SET last_sync_at=NOW(), last_status='ok' WHERE tenant_id=$1 AND service_name='alegra'`, [tenantId]);
    } else {
      await query(`UPDATE erp_integrations SET last_status='error' WHERE tenant_id=$1 AND service_name='alegra'`, [tenantId]);
    }
  } catch (err: any) {
    await logIntegrationCall({ tenantId, serviceName: 'alegra', endpoint, method: 'POST',
      durationMs: Date.now() - start, requestPayload: payload, errorMessage: err.message, triggeredBy: 'invoice.created' });
    await query(`UPDATE erp_integrations SET last_status='error' WHERE tenant_id=$1 AND service_name='alegra'`, [tenantId]);
  }
}

async function callOdoo(tenantId: string, apiUrl: string, apiKey: string, invoice: any, start: number, extra: any) {
  const endpoint = `${apiUrl}/api/account.move`;
  const payload = {
    name: invoice.invoice_number, partner_id: extra?.default_partner_id || 1,
    invoice_date: invoice.issue_date, move_type: 'out_invoice',
    ref: `AntuCRM-${invoice.id}`,
  };
  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
    });
    const body = await resp.json().catch(() => ({}));
    await logIntegrationCall({ tenantId, serviceName: 'odoo', endpoint, method: 'POST',
      statusCode: resp.status, durationMs: Date.now() - start,
      requestPayload: payload, responseBody: body,
      errorMessage: resp.ok ? undefined : JSON.stringify(body),
      triggeredBy: 'invoice.created' });
    await query(`UPDATE erp_integrations SET last_sync_at=NOW(), last_status=$1 WHERE tenant_id=$2 AND service_name='odoo'`,
      [resp.ok ? 'ok' : 'error', tenantId]);
  } catch (err: any) {
    await logIntegrationCall({ tenantId, serviceName: 'odoo', endpoint, method: 'POST',
      durationMs: Date.now() - start, requestPayload: payload, errorMessage: err.message, triggeredBy: 'invoice.created' });
    await query(`UPDATE erp_integrations SET last_status='error' WHERE tenant_id=$1 AND service_name='odoo'`, [tenantId]);
  }
}

async function callQuickBooks(tenantId: string, apiUrl: string, apiKey: string, invoice: any, start: number, extra: any) {
  const realmId = extra?.realm_id || '';
  const endpoint = `${apiUrl || 'https://quickbooks.api.intuit.com'}/v3/company/${realmId}/invoice`;
  const payload = {
    CustomerRef: { value: extra?.default_customer_id || '1' },
    DocNumber: invoice.invoice_number,
    TxnDate: invoice.issue_date,
    Line: (invoice.line_items || []).map((li: any, i: number) => ({
      Id: String(i + 1), LineNum: i + 1, Amount: li.subtotal || 0,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: { ItemRef: { value: '1', name: li.description } },
    })),
  };
  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await resp.json().catch(() => ({}));
    await logIntegrationCall({ tenantId, serviceName: 'quickbooks', endpoint, method: 'POST',
      statusCode: resp.status, durationMs: Date.now() - start,
      requestPayload: payload, responseBody: body,
      errorMessage: resp.ok ? undefined : JSON.stringify(body),
      triggeredBy: 'invoice.created' });
    await query(`UPDATE erp_integrations SET last_sync_at=NOW(), last_status=$1 WHERE tenant_id=$2 AND service_name='quickbooks'`,
      [resp.ok ? 'ok' : 'error', tenantId]);
  } catch (err: any) {
    await logIntegrationCall({ tenantId, serviceName: 'quickbooks', endpoint, method: 'POST',
      durationMs: Date.now() - start, requestPayload: payload, errorMessage: err.message, triggeredBy: 'invoice.created' });
    await query(`UPDATE erp_integrations SET last_status='error' WHERE tenant_id=$1 AND service_name='quickbooks'`, [tenantId]);
  }
}
