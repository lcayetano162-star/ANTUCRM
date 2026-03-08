import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Receipt, Plus, Search, X, CheckCircle2, Send,
  Ban, FileText, ChevronDown, Trash2, AlertCircle, Printer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { invoicingApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

// ── TYPES ─────────────────────────────────────────────────────
type InvoiceStatus = 'draft'|'sent'|'paid'|'partial'|'overdue'|'cancelled'|'void'
type NcfType = 'B01'|'B02'|'B14'|'B15'|'B16'

interface InvoiceItem {
  id?: string; product_id?: string; description: string
  quantity: number; unit_price: number; discount_percent: number
  tax_rate: number; subtotal?: number; tax_amount?: number; total?: number
}
interface Invoice {
  id: string; invoice_number: string; ncf: string; ncf_type: NcfType
  client_id: string; client_name: string; status: InvoiceStatus
  subtotal: number; tax_amount: number; tax_rate: number; total: number
  amount_paid?: number; issue_date: string; due_date?: string
  payment_terms: number; payment_method?: string; notes?: string
  created_by_name?: string; created_at: string; items?: InvoiceItem[]
}

// ── CONSTANTS ─────────────────────────────────────────────────
const STATUS_CFG: Record<InvoiceStatus, { label: string; color: string; dot: string }> = {
  draft:     { label: 'Borrador',   color: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400' },
  sent:      { label: 'Enviada',    color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  paid:      { label: 'Pagada',     color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  partial:   { label: 'Parcial',    color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
  overdue:   { label: 'Vencida',    color: 'bg-red-100 text-red-700',       dot: 'bg-red-500 animate-pulse' },
  cancelled: { label: 'Cancelada',  color: 'bg-slate-100 text-slate-400',   dot: 'bg-slate-300' },
  void:      { label: 'Anulada',    color: 'bg-red-50 text-red-400',        dot: 'bg-red-300' },
}
const NCF_LABELS: Record<NcfType, string> = {
  B01: 'B01 — Crédito Fiscal',
  B02: 'B02 — Consumidor Final',
  B14: 'B14 — Gubernamental',
  B15: 'B15 — Regímenes Especiales',
  B16: 'B16 — Gubernamental Especial',
}
const PAYMENT_METHODS = ['Efectivo','Transferencia','Tarjeta de crédito','Tarjeta de débito','Cheque','Depósito']

const fmtCur = (n: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 2 }).format(n)
const fmtDate = (s: string) =>
  new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(s))

// ── DEMO DATA ─────────────────────────────────────────────────
const DEMO: Invoice[] = [
  { id: '1', invoice_number: 'FAC-202603-0001', ncf: 'B0100000042', ncf_type: 'B01', client_id: 'c1', client_name: 'Grupo Empresarial Torres', status: 'paid', subtotal: 8474.58, tax_amount: 1525.42, tax_rate: 0.18, total: 10000, amount_paid: 10000, issue_date: '2026-03-01', due_date: '2026-03-31', payment_terms: 30, payment_method: 'Transferencia', created_at: new Date(Date.now()-86400000*5).toISOString(), created_by_name: 'Admin' },
  { id: '2', invoice_number: 'FAC-202603-0002', ncf: 'B0200000018', ncf_type: 'B02', client_id: 'c2', client_name: 'Constructora del Caribe', status: 'sent', subtotal: 25423.73, tax_amount: 4576.27, tax_rate: 0.18, total: 30000, issue_date: '2026-03-03', due_date: '2026-04-02', payment_terms: 30, created_at: new Date(Date.now()-86400000*3).toISOString(), created_by_name: 'Admin' },
  { id: '3', invoice_number: 'FAC-202603-0003', ncf: 'B0100000043', ncf_type: 'B01', client_id: 'c3', client_name: 'Clínica San José', status: 'overdue', subtotal: 12711.86, tax_amount: 2288.14, tax_rate: 0.18, total: 15000, issue_date: '2026-02-01', due_date: '2026-03-02', payment_terms: 30, created_at: new Date(Date.now()-86400000*33).toISOString(), created_by_name: 'Admin' },
  { id: '4', invoice_number: 'FAC-202603-0004', ncf: 'B0100000044', ncf_type: 'B01', client_id: 'c4', client_name: 'Banco Nacional', status: 'partial', subtotal: 84745.76, tax_amount: 15254.24, tax_rate: 0.18, total: 100000, amount_paid: 50000, issue_date: '2026-03-05', due_date: '2026-04-04', payment_terms: 30, created_at: new Date(Date.now()-86400000*1).toISOString(), created_by_name: 'Admin' },
  { id: '5', invoice_number: 'FAC-202603-0005', ncf: 'B0200000019', ncf_type: 'B02', client_id: 'c5', client_name: 'Hotel Las Américas', status: 'draft', subtotal: 4237.29, tax_amount: 762.71, tax_rate: 0.18, total: 5000, issue_date: '2026-03-06', payment_terms: 30, created_at: new Date().toISOString(), created_by_name: 'Admin' },
]
const DEMO_ITEMS: Record<string, InvoiceItem[]> = {
  '1': [
    { description: 'Mantenimiento preventivo MFP-C300', quantity: 2, unit_price: 2500, discount_percent: 0, tax_rate: 0.18, subtotal: 5000, tax_amount: 900, total: 5900 },
    { description: 'Drum Unit C300 Color (DRUM-C300)', quantity: 1, unit_price: 3500, discount_percent: 0, tax_rate: 0.18, subtotal: 3500, tax_amount: 630, total: 4130 },
  ],
  '2': [
    { description: 'Servicio de instalación red impresoras (10 equipos)', quantity: 10, unit_price: 2500, discount_percent: 0, tax_rate: 0.18, subtotal: 25000, tax_amount: 4500, total: 29500 },
    { description: 'Mano de obra técnica adicional', quantity: 4, unit_price: 600, discount_percent: 10, tax_rate: 0.18, subtotal: 2160, tax_amount: 388.8, total: 2548.8 },
  ],
}

// ── INVOICE CARD (list item) ──────────────────────────────────
function InvoiceCard({ inv, active, onClick }: { inv: Invoice; active: boolean; onClick: () => void }) {
  const { t } = useLanguage()
  const s = STATUS_CFG[inv.status]
  const isOverdue = inv.status === 'overdue'
  return (
    <button onClick={onClick} className={cn('w-full text-left border rounded-xl p-3.5 transition-all hover:shadow-sm',
      active ? 'border-cyan-600 bg-cyan-50 shadow-sm' : isOverdue ? 'border-red-200 bg-red-50/50 hover:border-red-300' : 'border-slate-200 hover:border-slate-300 bg-white')}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-[10px] font-mono text-slate-400">{inv.invoice_number}</p>
          <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">{inv.client_name}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{inv.ncf} — {NCF_LABELS[inv.ncf_type].split(' — ')[1]}</p>
        </div>
        <Badge variant="secondary" className={cn('text-[10px] flex-shrink-0 flex items-center gap-1', s.color)}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{t(s.label)}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{fmtDate(inv.issue_date)}</span>
        <span className="font-bold text-slate-800 text-sm">{fmtCur(inv.total)}</span>
      </div>
      {inv.status === 'partial' && inv.amount_paid && (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-amber-600 mb-1">
            <span>{t('Pagado')}: {fmtCur(inv.amount_paid)}</span>
            <span>{t('Pendiente')}: {fmtCur(inv.total - inv.amount_paid)}</span>
          </div>
          <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(inv.amount_paid / inv.total) * 100}%` }} />
          </div>
        </div>
      )}
    </button>
  )
}

// ── INVOICE DETAIL ─────────────────────────────────────────────
function InvoiceDetail({ invoice, onStatusChange }: { invoice: Invoice; onStatusChange: (id: string, status: InvoiceStatus, extra?: any) => void }) {
  const { t } = useLanguage()
  const { user } = useAuthStore()
  const isAdmin = ['admin','superadmin','sales_manager'].includes(user?.role || '')
  const [items, setItems] = useState<InvoiceItem[]>(DEMO_ITEMS[invoice.id] || [])
  const [showPayModal, setShowPayModal] = useState(false)
  const [payAmount, setPayAmount] = useState(String(invoice.total))
  const [payMethod, setPayMethod] = useState('Transferencia')
  const [acting, setActing] = useState(false)

  useEffect(() => {
    invoicingApi.getById(invoice.id).then(res => setItems(res.data.items || [])).catch(() => {})
  }, [invoice.id])

  const act = async (status: InvoiceStatus, extra?: any) => {
    setActing(true)
    try {
      await invoicingApi.updateStatus(invoice.id, { status, ...extra })
    } catch { /* demo */ }
    onStatusChange(invoice.id, status, extra)
    toast.success(`Factura ${STATUS_CFG[status].label.toLowerCase()}`)
    setActing(false)
    setShowPayModal(false)
  }

  const s = STATUS_CFG[invoice.status]
  const canSend    = invoice.status === 'draft'
  const canPay     = ['sent','partial','overdue'].includes(invoice.status)
  const canCancel  = ['draft','sent'].includes(invoice.status)
  const canVoid    = !['void','cancelled'].includes(invoice.status)
  const pending    = invoice.total - (invoice.amount_paid || 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-mono text-slate-400">{invoice.invoice_number}</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight mt-0.5">{invoice.client_name}</h3>
            <p className="text-sm text-slate-500 font-mono mt-0.5">{invoice.ncf} — {NCF_LABELS[invoice.ncf_type]}</p>
          </div>
          <Badge variant="secondary" className={cn('text-sm px-3 py-1 flex items-center gap-1.5', s.color)}>
            <span className={`w-2 h-2 rounded-full ${s.dot}`} />{t(s.label)}
          </Badge>
        </div>

        {/* Action buttons */}
        {isAdmin && invoice.status !== 'void' && invoice.status !== 'cancelled' && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {canSend && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => act('sent')} disabled={acting}>
                <Send className="w-3 h-3" />{t('Marcar como Enviada')}
              </Button>
            )}
            {canPay && (
              <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowPayModal(true)} disabled={acting}>
                <CheckCircle2 className="w-3 h-3" />{t('Registrar Pago')}
              </Button>
            )}
            {canCancel && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-slate-500"
                onClick={() => act('cancelled')} disabled={acting}>
                <X className="w-3 h-3" />{t('Cancelar')}
              </Button>
            )}
            {canVoid && invoice.status !== 'draft' && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => { if (confirm(t('¿Anular esta factura? Esta acción es irreversible.'))) act('void') }} disabled={acting}>
                <Ban className="w-3 h-3" />{t('Anular')}
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 ml-auto"
              onClick={() => window.print()}>
              <Printer className="w-3 h-3" />{t('Imprimir')}
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-5">
          {/* Dates & Payment */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('Fecha de emisión')}</p>
              <p className="text-sm font-bold text-slate-800">{fmtDate(invoice.issue_date)}</p>
            </div>
            {invoice.due_date && (
              <div className={cn('rounded-xl p-3', invoice.status === 'overdue' ? 'bg-red-50' : 'bg-slate-50')}>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('Vencimiento')}</p>
                <p className={cn('text-sm font-bold', invoice.status === 'overdue' ? 'text-red-700' : 'text-slate-800')}>{fmtDate(invoice.due_date)}</p>
              </div>
            )}
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('Condición pago')}</p>
              <p className="text-sm font-bold text-slate-800">{invoice.payment_terms} días</p>
              {invoice.payment_method && <p className="text-xs text-slate-500 mt-0.5">{invoice.payment_method}</p>}
            </div>
          </div>

          {/* Items table */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('Líneas de factura')}</p>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">{t('Descripción')}</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">{t('Cant.')}</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">{t('Precio')}</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">{t('Desc.')}</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">{t('Total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-6 text-slate-400 text-xs">{t('Sin líneas de detalle')}</td></tr>
                  ) : items.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-700">{item.description}</td>
                      <td className="px-3 py-2.5 text-right text-slate-600">{item.quantity}</td>
                      <td className="px-3 py-2.5 text-right text-slate-600">{fmtCur(item.unit_price)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-500">{item.discount_percent > 0 ? `${item.discount_percent}%` : '—'}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmtCur(item.total ?? (item.quantity * item.unit_price))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-slate-600"><span>{t('Subtotal')}</span><span>{fmtCur(invoice.subtotal)}</span></div>
            <div className="flex justify-between text-sm text-slate-600"><span>ITBIS ({(invoice.tax_rate * 100).toFixed(0)}%)</span><span>{fmtCur(invoice.tax_amount)}</span></div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-bold text-slate-800"><span>{t('Total')}</span><span className="text-lg">{fmtCur(invoice.total)}</span></div>
            {invoice.amount_paid && invoice.amount_paid > 0 && (
              <>
                <div className="flex justify-between text-sm text-emerald-600"><span>{t('Pagado')}</span><span>{fmtCur(invoice.amount_paid)}</span></div>
                {pending > 0 && <div className="flex justify-between text-sm font-bold text-amber-700"><span>{t('Pendiente')}</span><span>{fmtCur(pending)}</span></div>}
              </>
            )}
          </div>

          {invoice.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">{t('Notas')}</p>
              <p className="text-sm text-amber-800">{invoice.notes}</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Pay modal */}
      <Dialog open={showPayModal} onOpenChange={setShowPayModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />{t('Registrar Pago')}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-xs text-emerald-600">{t('Total pendiente')}</p>
              <p className="text-2xl font-bold text-emerald-700">{fmtCur(pending)}</p>
            </div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">{t('Monto recibido')} (RD$)</label>
              <Input type="number" min="0" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="text-lg font-bold" /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">{t('Método de pago')}</label>
              <select className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayModal(false)}>{t('Cancelar')}</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                const paid = parseFloat(payAmount) || 0
                const newStatus: InvoiceStatus = paid >= invoice.total ? 'paid' : 'partial'
                act(newStatus, { amount_paid: paid, payment_method: payMethod })
              }} disabled={acting}>
              {acting ? t('Guardando...') : t('Confirmar Pago')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── CREATE INVOICE MODAL ──────────────────────────────────────
function CreateInvoiceModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (inv: Invoice) => void }) {
  const { t } = useLanguage()
  const [clientName, setClientName] = useState('')
  const [ncfType, setNcfType] = useState<NcfType>('B01')
  const [paymentTerms, setPaymentTerms] = useState('30')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_rate: 0.18 }
  ])
  const [loading, setLoading] = useState(false)

  const addItem = () => setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_rate: 0.18 }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, k: keyof InvoiceItem, v: any) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it))

  const totals = useMemo(() => {
    let subtotal = 0, tax = 0
    items.forEach(it => {
      const base = it.quantity * it.unit_price * (1 - it.discount_percent / 100)
      subtotal += base
      tax += base * it.tax_rate
    })
    return { subtotal, tax, total: subtotal + tax }
  }, [items])

  const submit = async () => {
    if (!clientName.trim()) { toast.error('El nombre del cliente es requerido'); return }
    if (items.some(it => !it.description.trim())) { toast.error('Todas las líneas deben tener descripción'); return }
    setLoading(true)
    const num = `FAC-${new Date().toISOString().slice(0,7).replace('-','')}-${String(Math.floor(Math.random()*9000)+1000)}`
    const ncf = `${ncfType}${String(Math.floor(Math.random()*90000)+10000).padStart(8,'0')}`
    const inv: Invoice = {
      id: Date.now().toString(), invoice_number: num, ncf, ncf_type: ncfType,
      client_id: Date.now().toString(), client_name: clientName, status: 'draft',
      ...totals, tax_rate: 0.18, payment_terms: parseInt(paymentTerms) || 30, notes,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + (parseInt(paymentTerms)||30) * 86400000).toISOString().split('T')[0],
      created_at: new Date().toISOString(), items
    }
    try { await invoicingApi.create({ client_id: inv.client_id, ncf_type: ncfType, items, payment_terms: parseInt(paymentTerms), notes }) } catch {}
    toast.success(`Factura ${num} creada`)
    onCreated(inv)
    onClose()
    setLoading(false)
    setClientName(''); setNotes(''); setItems([{ description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_rate: 0.18 }])
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center"><Receipt className="w-4 h-4 text-cyan-600" /></div>
            {t('Nueva Factura')}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <div className="space-y-4 py-2 pr-2">
            {/* Header fields */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-slate-600">{t('Cliente')} *</label>
                <Input placeholder={t('Nombre o razón social del cliente')} value={clientName} onChange={e => setClientName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">{t('Tipo NCF')}</label>
                <select className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white" value={ncfType} onChange={e => setNcfType(e.target.value as NcfType)}>
                  {Object.entries(NCF_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">{t('Condición de pago')} ({t('días')})</label>
                <select className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
                  {['0','15','30','45','60','90'].map(d => <option key={d} value={d}>{d === '0' ? 'Contado' : `${d} días`}</option>)}
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-slate-600">{t('Notas')} / {t('Términos')}</label>
                <Input placeholder={t('Observaciones, forma de pago, etc.')} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('Líneas de detalle')}</p>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addItem}>
                  <Plus className="w-3 h-3" />{t('Agregar línea')}
                </Button>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">{t('Descripción')} *</th>
                      <th className="text-right px-2 py-2 text-xs font-semibold text-slate-500 w-16">{t('Cant.')}</th>
                      <th className="text-right px-2 py-2 text-xs font-semibold text-slate-500 w-28">{t('Precio unit.')}</th>
                      <th className="text-right px-2 py-2 text-xs font-semibold text-slate-500 w-16">{t('Desc.')}%</th>
                      <th className="text-right px-2 py-2 text-xs font-semibold text-slate-500 w-16">ITBIS%</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 w-28">Total</th>
                      <th className="w-8 px-1"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, i) => {
                      const base = it.quantity * it.unit_price * (1 - it.discount_percent / 100)
                      const lineTotal = base + base * it.tax_rate
                      return (
                        <tr key={i}>
                          <td className="px-3 py-1.5"><Input className="h-8 text-sm" placeholder="Descripción del producto/servicio" value={it.description} onChange={e => updateItem(i, 'description', e.target.value)} /></td>
                          <td className="px-2 py-1.5"><Input className="h-8 text-sm text-right" type="number" min="0.01" step="0.01" value={it.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)} /></td>
                          <td className="px-2 py-1.5"><Input className="h-8 text-sm text-right" type="number" min="0" step="0.01" value={it.unit_price} onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)} /></td>
                          <td className="px-2 py-1.5"><Input className="h-8 text-sm text-right" type="number" min="0" max="100" step="1" value={it.discount_percent} onChange={e => updateItem(i, 'discount_percent', parseFloat(e.target.value) || 0)} /></td>
                          <td className="px-2 py-1.5">
                            <select className="h-8 w-full rounded-md border border-slate-200 px-1 text-xs bg-white" value={it.tax_rate} onChange={e => updateItem(i, 'tax_rate', parseFloat(e.target.value))}>
                              <option value="0.18">18%</option><option value="0.16">16%</option><option value="0">0%</option>
                            </select>
                          </td>
                          <td className="px-3 py-1.5 text-right font-semibold text-slate-800 text-xs whitespace-nowrap">{fmtCur(lineTotal)}</td>
                          <td className="px-1 py-1.5">
                            {items.length > 1 && <button onClick={() => removeItem(i)} className="text-slate-300 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals preview */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600"><span>{t('Subtotal')}</span><span>{fmtCur(totals.subtotal)}</span></div>
              <div className="flex justify-between text-slate-600"><span>ITBIS</span><span>{fmtCur(totals.tax)}</span></div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-800"><span>{t('Total')} RD$</span><span className="text-base">{fmtCur(totals.total)}</span></div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>{t('Cancelar')}</Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={submit} disabled={loading}>
            {loading ? t('Creando...') : t('Crear Factura')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function Invoicing() {
  const { t } = useLanguage()
  const { user } = useAuthStore()
  const isAdmin = ['admin','superadmin','sales_manager'].includes(user?.role || '')

  const [invoices, setInvoices] = useState<Invoice[]>(DEMO)
  const [selected, setSelected] = useState<Invoice | null>(DEMO[0])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    invoicingApi.getAll().then(res => { setInvoices(res.data.data); if (res.data.data[0]) setSelected(res.data.data[0]) }).catch(() => {})
  }, [])

  const filtered = useMemo(() => invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false
    if (search && !inv.client_name.toLowerCase().includes(search.toLowerCase()) && !inv.invoice_number.toLowerCase().includes(search.toLowerCase()) && !inv.ncf.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [invoices, search, statusFilter])

  const stats = useMemo(() => ({
    total: invoices.reduce((s, i) => s + i.total, 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0),
    pending: invoices.filter(i => ['sent','partial'].includes(i.status)).reduce((s, i) => s + (i.total - (i.amount_paid||0)), 0),
    overdue: invoices.filter(i => i.status === 'overdue').length,
  }), [invoices])

  const handleStatusChange = useCallback((id: string, status: InvoiceStatus, extra?: any) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status, ...extra } : inv))
    setSelected(prev => prev?.id === id ? { ...prev, status, ...extra } : prev)
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-cyan-600" />{t('Facturación')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('Facturas, comprobantes NCF y control de pagos')}</p>
        </div>
        <div className="flex items-center gap-2">
          {stats.overdue > 0 && (
            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-xs gap-1">
              <AlertCircle className="w-3 h-3" />{stats.overdue} vencida(s)
            </Badge>
          )}
          {isAdmin && (
            <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" />{t('Nueva Factura')}
            </Button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        {[
          { label: t('Facturado total'), val: fmtCur(stats.total), color: 'text-slate-700', bg: 'bg-slate-50' },
          { label: t('Cobrado'), val: fmtCur(stats.paid), color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: t('Por cobrar'), val: fmtCur(stats.pending), color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: t('Vencido'), val: fmtCur(invoices.filter(i => i.status === 'overdue').reduce((s,i) => s+i.total,0)), color: 'text-red-700', bg: 'bg-red-50' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4 border border-slate-100`}>
            <p className={`text-lg font-bold ${k.color}`}>{k.val}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Split view */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* List */}
        <div className="w-[320px] flex-shrink-0 flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar factura, cliente, NCF..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
          </div>
          <div className="flex flex-wrap gap-1">
            {(['all','draft','sent','paid','partial','overdue'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn('px-2 py-1 rounded-md text-[10px] font-medium border transition-all',
                  statusFilter === s
                    ? s === 'all' ? 'bg-slate-700 text-white border-slate-700'
                      : STATUS_CFG[s as InvoiceStatus].color + ' border-current'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300')}>
                {s === 'all' ? t('Todas') : t(STATUS_CFG[s as InvoiceStatus].label)}
              </button>
            ))}
            {statusFilter !== 'all' && <button onClick={() => setStatusFilter('all')} className="text-slate-400 hover:text-slate-600 px-1"><X className="w-3 h-3" /></button>}
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-1">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">{t('Sin facturas')}</p>
                </div>
              ) : filtered.map(inv => (
                <InvoiceCard key={inv.id} inv={inv} active={selected?.id === inv.id} onClick={() => setSelected(inv)} />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Detail */}
        <div className="flex-1 border border-slate-200 rounded-xl bg-white overflow-hidden">
          {selected
            ? <InvoiceDetail key={selected.id} invoice={selected} onStatusChange={handleStatusChange} />
            : <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Receipt className="w-16 h-16 mb-3 opacity-20" />
                <p className="font-medium">{t('Selecciona una factura')}</p>
              </div>
          }
        </div>
      </div>

      <CreateInvoiceModal open={showCreate} onClose={() => setShowCreate(false)}
        onCreated={inv => { setInvoices(prev => [inv, ...prev]); setSelected(inv) }} />
    </div>
  )
}
