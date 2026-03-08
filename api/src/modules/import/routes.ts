import { Router, Request, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');
import rateLimit from 'express-rate-limit';
import * as XLSX from 'xlsx';
import { authenticateToken, requireAdmin } from '../../shared/middleware/auth';
import { query } from '../../shared/config/database';

const router = Router();

// Rate limiter específico para imports (más estricto debido a procesamiento pesado)
const importRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 imports por ventana
  message: {
    error: 'Demasiadas importaciones. Máximo 10 cada 15 minutos.',
    retryAfter: '900'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 
  } 
});

// ── Parse file buffer → array of row objects ────────────────────────────────
function parseFile(buffer: Buffer, filename: string): Record<string, any>[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

// ── Normalize column names (ignore case, spaces, accents) ────────────────────
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function pick(row: any, ...candidates: string[]): string {
  for (const c of candidates) {
    for (const k of Object.keys(row)) {
      if (norm(k) === norm(c) && row[k] !== '' && row[k] !== null && row[k] !== undefined) {
        return String(row[k]).trim();
      }
    }
  }
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/import/clients
// ─────────────────────────────────────────────────────────────────────────────
router.post('/clients', authenticateToken, requireAdmin, importRateLimiter, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
  const user = (req as any).user;

  // Create job record
  const jobRes = await query(
    `INSERT INTO import_jobs (tenant_id, import_type, file_name, status, created_by)
     VALUES ($1, 'clients', $2, 'processing', $3) RETURNING id`,
    [user.tenant_id, req.file.originalname, user.id]
  );
  const jobId = jobRes.rows[0].id;

  // Process async
  setImmediate(async () => {
    let success = 0, errors = 0;
    const errorList: any[] = [];
    try {
      const rows = parseFile(req.file!.buffer, req.file!.originalname);
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name = pick(row, 'name', 'nombre', 'company', 'empresa', 'razon social', 'razonsocial');
        const email = pick(row, 'email', 'correo', 'email address', 'emailaddress');
        const phone = pick(row, 'phone', 'telefono', 'tel', 'movil', 'celular');
        const country = pick(row, 'country', 'pais', 'país');
        const city = pick(row, 'city', 'ciudad');
        const industry = pick(row, 'industry', 'industria', 'sector');
        const status = pick(row, 'status', 'estado') || 'lead';
        if (!name) { errors++; errorList.push({ row: i+2, error: 'Nombre requerido' }); continue; }
        try {
          await query(
            `INSERT INTO clients (tenant_id, name, email, phone, country, city, industry, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             ON CONFLICT DO NOTHING`,
            [user.tenant_id, name, email || null, phone || null, country || null, city || null, industry || null, status]
          );
          success++;
        } catch (e: any) { errors++; errorList.push({ row: i+2, error: e.message }); }
      }
      await query(
        `UPDATE import_jobs SET status='completed', total_rows=$1, success_rows=$2, error_rows=$3, errors=$4, finished_at=NOW() WHERE id=$5`,
        [rows.length, success, errors, JSON.stringify(errorList.slice(0,50)), jobId]
      );
    } catch (e: any) {
      await query(`UPDATE import_jobs SET status='failed', errors=$1, finished_at=NOW() WHERE id=$2`,
        [JSON.stringify([{ error: e.message }]), jobId]);
    }
  });

  res.json({ jobId, message: 'Importación iniciada' });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/import/contacts
// ─────────────────────────────────────────────────────────────────────────────
router.post('/contacts', authenticateToken, requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
  const user = (req as any).user;

  const jobRes = await query(
    `INSERT INTO import_jobs (tenant_id, import_type, file_name, status, created_by)
     VALUES ($1, 'contacts', $2, 'processing', $3) RETURNING id`,
    [user.tenant_id, req.file.originalname, user.id]
  );
  const jobId = jobRes.rows[0].id;

  setImmediate(async () => {
    let success = 0, errors = 0;
    const errorList: any[] = [];
    try {
      const rows = parseFile(req.file!.buffer, req.file!.originalname);
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const firstName = pick(row, 'first name', 'firstname', 'nombre', 'first_name');
        const lastName  = pick(row, 'last name', 'lastname', 'apellido', 'last_name');
        const email     = pick(row, 'email', 'correo');
        const phone     = pick(row, 'phone', 'telefono', 'tel', 'celular');
        const position  = pick(row, 'position', 'cargo', 'title', 'puesto');
        const clientName = pick(row, 'company', 'empresa', 'client', 'cliente');
        if (!firstName && !email) { errors++; errorList.push({ row: i+2, error: 'Nombre o email requerido' }); continue; }
        try {
          // Find or skip client linking
          let clientId = null;
          if (clientName) {
            const cRes = await query(
              'SELECT id FROM clients WHERE tenant_id=$1 AND LOWER(name)=LOWER($2) LIMIT 1',
              [user.tenant_id, clientName]
            );
            if (cRes.rows[0]) clientId = cRes.rows[0].id;
          }
          await query(
            `INSERT INTO contacts (tenant_id, client_id, first_name, last_name, email, phone, position)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             ON CONFLICT DO NOTHING`,
            [user.tenant_id, clientId, firstName || '', lastName || '', email || null, phone || null, position || null]
          );
          success++;
        } catch (e: any) { errors++; errorList.push({ row: i+2, error: e.message }); }
      }
      await query(
        `UPDATE import_jobs SET status='completed', total_rows=$1, success_rows=$2, error_rows=$3, errors=$4, finished_at=NOW() WHERE id=$5`,
        [rows.length, success, errors, JSON.stringify(errorList.slice(0,50)), jobId]
      );
    } catch (e: any) {
      await query(`UPDATE import_jobs SET status='failed', errors=$1, finished_at=NOW() WHERE id=$2`,
        [JSON.stringify([{ error: e.message }]), jobId]);
    }
  });

  res.json({ jobId, message: 'Importación iniciada' });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/import/inventory
// ─────────────────────────────────────────────────────────────────────────────
router.post('/inventory', authenticateToken, requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
  const user = (req as any).user;

  const jobRes = await query(
    `INSERT INTO import_jobs (tenant_id, import_type, file_name, status, created_by)
     VALUES ($1, 'inventory', $2, 'processing', $3) RETURNING id`,
    [user.tenant_id, req.file.originalname, user.id]
  );
  const jobId = jobRes.rows[0].id;

  setImmediate(async () => {
    let success = 0, errors = 0;
    const errorList: any[] = [];
    try {
      const rows = parseFile(req.file!.buffer, req.file!.originalname);
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const sku       = pick(row, 'sku', 'codigo', 'code', 'part number', 'partnumber');
        const name      = pick(row, 'name', 'nombre', 'description', 'descripcion', 'item');
        const category  = pick(row, 'category', 'categoria', 'type', 'tipo');
        const quantity  = parseInt(pick(row, 'quantity', 'cantidad', 'stock', 'qty')) || 0;
        const unit_cost = parseFloat(pick(row, 'cost', 'costo', 'unit cost', 'unitcost', 'precio costo')) || 0;
        const unit_price = parseFloat(pick(row, 'price', 'precio', 'sale price', 'saleprice')) || 0;
        const min_stock = parseInt(pick(row, 'min stock', 'minstock', 'stock minimo', 'reorder')) || 0;
        if (!name) { errors++; errorList.push({ row: i+2, error: 'Nombre requerido' }); continue; }
        try {
          await query(
            `INSERT INTO inventory_items (tenant_id, sku, name, category, quantity, unit_cost, unit_price, min_stock)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             ON CONFLICT (tenant_id, sku) DO UPDATE SET name=$3, category=$4, quantity=$5, unit_cost=$6, unit_price=$7, min_stock=$8`,
            [user.tenant_id, sku || null, name, category || null, quantity, unit_cost, unit_price, min_stock]
          );
          success++;
        } catch (e: any) { errors++; errorList.push({ row: i+2, error: e.message }); }
      }
      await query(
        `UPDATE import_jobs SET status='completed', total_rows=$1, success_rows=$2, error_rows=$3, errors=$4, finished_at=NOW() WHERE id=$5`,
        [rows.length, success, errors, JSON.stringify(errorList.slice(0,50)), jobId]
      );
    } catch (e: any) {
      await query(`UPDATE import_jobs SET status='failed', errors=$1, finished_at=NOW() WHERE id=$2`,
        [JSON.stringify([{ error: e.message }]), jobId]);
    }
  });

  res.json({ jobId, message: 'Importación iniciada' });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/import/sales  (historial de ventas para IA)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/sales', authenticateToken, requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
  const user = (req as any).user;

  const jobRes = await query(
    `INSERT INTO import_jobs (tenant_id, import_type, file_name, status, created_by)
     VALUES ($1, 'sales', $2, 'processing', $3) RETURNING id`,
    [user.tenant_id, req.file.originalname, user.id]
  );
  const jobId = jobRes.rows[0].id;

  setImmediate(async () => {
    let success = 0, errors = 0;
    const errorList: any[] = [];
    try {
      const rows = parseFile(req.file!.buffer, req.file!.originalname);
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const clientName  = pick(row, 'client', 'cliente', 'company', 'empresa');
        const amount      = parseFloat(pick(row, 'amount', 'monto', 'total', 'revenue', 'ingresos')) || 0;
        const stage       = pick(row, 'stage', 'etapa', 'status', 'estado') || 'closed_won';
        const closedDate  = pick(row, 'close date', 'closedate', 'fecha cierre', 'fechacierre', 'date', 'fecha');
        const opName      = pick(row, 'opportunity', 'oportunidad', 'name', 'nombre', 'deal');
        if (!clientName && !opName) { errors++; errorList.push({ row: i+2, error: 'Cliente u oportunidad requerida' }); continue; }
        try {
          // Find client or create stub
          let clientId: string | null = null;
          if (clientName) {
            const cRes = await query(
              'SELECT id FROM clients WHERE tenant_id=$1 AND LOWER(name)=LOWER($2) LIMIT 1',
              [user.tenant_id, clientName]
            );
            if (cRes.rows[0]) {
              clientId = cRes.rows[0].id;
            } else {
              const newC = await query(
                `INSERT INTO clients (tenant_id, name, status) VALUES ($1,$2,'client') RETURNING id`,
                [user.tenant_id, clientName]
              );
              clientId = newC.rows[0].id;
            }
          }
          const parsedDate = closedDate ? new Date(closedDate) : new Date();
          const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
          const normalizedStage = ['closed_won','closed_lost','ganada','perdida'].includes(stage.toLowerCase().replace(' ','_'))
            ? (stage.toLowerCase().includes('perd') || stage.toLowerCase().includes('lost') ? 'closed_lost' : 'closed_won')
            : 'closed_won';
          await query(
            `INSERT INTO opportunities (tenant_id, client_id, name, estimated_revenue, stage, status, actual_close_date, expected_close_date, probability)
             VALUES ($1,$2,$3,$4,$5,'active',$6,$6,$7) ON CONFLICT DO NOTHING`,
            [user.tenant_id, clientId, opName || clientName, amount, normalizedStage,
             validDate.toISOString().split('T')[0],
             normalizedStage === 'closed_won' ? 100 : 0]
          );
          success++;
        } catch (e: any) { errors++; errorList.push({ row: i+2, error: e.message }); }
      }
      await query(
        `UPDATE import_jobs SET status='completed', total_rows=$1, success_rows=$2, error_rows=$3, errors=$4, finished_at=NOW() WHERE id=$5`,
        [rows.length, success, errors, JSON.stringify(errorList.slice(0,50)), jobId]
      );
    } catch (e: any) {
      await query(`UPDATE import_jobs SET status='failed', errors=$1, finished_at=NOW() WHERE id=$2`,
        [JSON.stringify([{ error: e.message }]), jobId]);
    }
  });

  res.json({ jobId, message: 'Importación iniciada' });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/import/opportunities  (pipeline activo)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/opportunities', authenticateToken, requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
  const user = (req as any).user;

  const jobRes = await query(
    `INSERT INTO import_jobs (tenant_id, import_type, file_name, status, created_by)
     VALUES ($1, 'opportunities', $2, 'processing', $3) RETURNING id`,
    [user.tenant_id, req.file.originalname, user.id]
  );
  const jobId = jobRes.rows[0].id;

  setImmediate(async () => {
    let success = 0, errors = 0;
    const errorList: any[] = [];
    const STAGE_MAP: Record<string, string> = {
      qualify: 'qualify', calificacion: 'qualify', calificación: 'qualify', prospecto: 'qualify',
      analysis: 'analysis', analisis: 'analysis', análisis: 'analysis',
      proposal: 'proposal', propuesta: 'proposal',
      negotiation: 'negotiation', negociacion: 'negotiation', negociación: 'negotiation',
      closed_won: 'closed_won', ganada: 'closed_won', won: 'closed_won', cerrada: 'closed_won',
      closed_lost: 'closed_lost', perdida: 'closed_lost', lost: 'closed_lost',
    };
    try {
      const rows = parseFile(req.file!.buffer, req.file!.originalname);
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const opName      = pick(row, 'opportunity', 'oportunidad', 'name', 'nombre', 'deal', 'negocio');
        const clientName  = pick(row, 'client', 'cliente', 'company', 'empresa', 'account', 'cuenta');
        const amount      = parseFloat(pick(row, 'amount', 'monto', 'total', 'revenue', 'valor', 'ingresos')) || 0;
        const stageRaw    = pick(row, 'stage', 'etapa', 'fase').toLowerCase().replace(/\s+/g,'');
        const stage       = STAGE_MAP[stageRaw] || 'qualify';
        const probability = parseInt(pick(row, 'probability', 'probabilidad', 'prob', '%')) || null;
        const closeDateRaw = pick(row, 'close date', 'closedate', 'expected close', 'fecha cierre', 'fecha esperada', 'cierre');
        const notes       = pick(row, 'notes', 'notas', 'description', 'descripcion', 'descripción', 'comments');

        if (!opName && !clientName) {
          errors++; errorList.push({ row: i + 2, error: 'Nombre de oportunidad o cliente requerido' }); continue;
        }
        try {
          let clientId: string | null = null;
          if (clientName) {
            const cRes = await query(
              'SELECT id FROM clients WHERE tenant_id=$1 AND LOWER(name)=LOWER($2) LIMIT 1',
              [user.tenant_id, clientName]
            );
            if (cRes.rows[0]) {
              clientId = cRes.rows[0].id;
            } else {
              const newC = await query(
                `INSERT INTO clients (tenant_id, name, status) VALUES ($1,$2,'client') RETURNING id`,
                [user.tenant_id, clientName]
              );
              clientId = newC.rows[0].id;
            }
          }
          const parsedClose = closeDateRaw ? new Date(closeDateRaw) : null;
          const validClose = parsedClose && !isNaN(parsedClose.getTime()) ? parsedClose.toISOString().split('T')[0] : null;

          // Security: closed_won/closed_lost stages require business logic gates
          // (gov_checklist, credit approval) that cannot be bypassed via import.
          // Force terminal stages back to prospecting so the user must move them
          // through the proper POST /:id/move flow.
          const safeStage = (stage === 'closed_won' || stage === 'closed_lost')
            ? 'prospecting'
            : stage;

          await query(
            `INSERT INTO opportunities
               (tenant_id, client_id, name, estimated_revenue, stage, status, probability, expected_close_date, notes)
             VALUES ($1,$2,$3,$4,$5,'active',$6,$7,$8)
             ON CONFLICT DO NOTHING`,
            [user.tenant_id, clientId, opName || clientName, amount, safeStage,
             probability, validClose, notes || null]
          );
          success++;
        } catch (e: any) { errors++; errorList.push({ row: i + 2, error: e.message }); }
      }
      await query(
        `UPDATE import_jobs SET status='completed', total_rows=$1, success_rows=$2, error_rows=$3, errors=$4, finished_at=NOW() WHERE id=$5`,
        [rows.length, success, errors, JSON.stringify(errorList.slice(0, 50)), jobId]
      );
    } catch (e: any) {
      await query(`UPDATE import_jobs SET status='failed', errors=$1, finished_at=NOW() WHERE id=$2`,
        [JSON.stringify([{ error: e.message }]), jobId]);
    }
  });

  res.json({ jobId, message: 'Importación de oportunidades iniciada' });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/import/status/:jobId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/status/:jobId', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await query(
      'SELECT * FROM import_jobs WHERE id=$1 AND tenant_id=$2',
      [req.params.jobId, user.tenant_id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Job no encontrado' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/import/history
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await query(
      `SELECT ij.*, u.first_name || ' ' || u.last_name AS created_by_name
       FROM import_jobs ij
       LEFT JOIN users u ON ij.created_by = u.id
       WHERE ij.tenant_id = $1
       ORDER BY ij.created_at DESC LIMIT 20`,
      [user.tenant_id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/import/template/:type — Download protected XLSX template
// ─────────────────────────────────────────────────────────────────────────────
const TEMPLATES: Record<string, { headers: string[]; example: (string | number)[] }> = {
  clients: {
    headers: ['nombre', 'email', 'telefono', 'pais', 'ciudad', 'industria', 'estado'],
    example: ['Empresa ABC', 'contacto@empresa.com', '809-555-1234', 'República Dominicana', 'Santo Domingo', 'Tecnología', 'client']
  },
  contacts: {
    headers: ['nombre', 'apellido', 'email', 'telefono', 'cargo', 'empresa'],
    example: ['Juan', 'Pérez', 'juan@empresa.com', '809-555-5678', 'Gerente de Compras', 'Empresa ABC']
  },
  opportunities: {
    headers: ['oportunidad', 'cliente', 'valor', 'etapa', 'probabilidad', 'fecha_cierre', 'notas'],
    example: ['Renovación Contrato 2025', 'Empresa ABC', 150000, 'proposal', 60, '2025-06-30', 'Interesados en plan anual']
  },
  sales: {
    headers: ['oportunidad', 'cliente', 'monto', 'estado', 'fecha_cierre'],
    example: ['Venta Enero 2025', 'Cliente XYZ', 85000, 'closed_won', '2025-01-15']
  },
  inventory: {
    headers: ['sku', 'nombre', 'categoria', 'cantidad', 'costo', 'precio', 'stock_minimo'],
    example: ['PRD-001', 'Impresora HP LaserJet', 'Equipos', 10, 12000, 18000, 2]
  }
};

router.get('/template/:type', authenticateToken, (req: Request, res: Response) => {
  const type = req.params.type as string;
  const tpl = TEMPLATES[type];
  if (!tpl) return res.status(400).json({ error: 'Tipo de plantilla no válido' });

  const wb = XLSX.utils.book_new();
  const wsData: any[][] = [tpl.headers, tpl.example];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = tpl.headers.map(() => ({ wch: 22 }));

  // Style header row (bold + background) — sheetjs-style uses !cell style property
  const numCols = tpl.headers.length;
  for (let c = 0; c < numCols; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[cellRef]) ws[cellRef] = { v: tpl.headers[c], t: 's' };
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '6D28D9' } }, // violet-700
      alignment: { horizontal: 'center' }
    };
  }

  // Style example row (italic, light gray)
  for (let c = 0; c < numCols; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 1, c });
    if (!ws[cellRef]) ws[cellRef] = { v: tpl.example[c], t: typeof tpl.example[c] === 'number' ? 'n' : 's' };
    ws[cellRef].s = {
      font: { italic: true, color: { rgb: '6B7280' } },
      fill: { fgColor: { rgb: 'F3F4F6' } }
    };
  }

  // Sheet protection: lock all cells, then define unlocked range for data entry (row 3+, all columns)
  // !protect locks the sheet; cells without 'locked' style become editable
  ws['!protect'] = {
    sheet: true,
    password: '',
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: true,  // allow inserting rows for data
    insertHyperlinks: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    autoFilter: false,
    pivotTables: false,
    selectLockedCells: true,
    selectUnlockedCells: true
  };

  // Unlock data area: all columns, from row 3 onwards (up to row 1002 = 1000 data rows)
  for (let r = 2; r < 1002; r++) {
    for (let c = 0; c < numCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
      ws[cellRef].s = { ...(ws[cellRef].s || {}), protection: { locked: false } };
    }
  }

  // Set range
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 1001, c: numCols - 1 } });

  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true });
  const filename = `plantilla_${type}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buf);
});

export default router;
