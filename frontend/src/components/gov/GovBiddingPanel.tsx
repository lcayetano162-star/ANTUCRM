// ============================================================
// ANTU CRM — GovBiddingPanel
// Expediente digital para Licitaciones Gubernamentales
// Compliance: Ley 47-25 RD (vigente enero 2026)
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { govApi } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Building2, Clock, RefreshCw, CheckCircle2, AlertTriangle,
  Upload, ShieldCheck, Wifi, Plus, Trash2, AlertCircle
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────
interface ChecklistItem {
  id: string;
  name: string;
  category: 'Legal' | 'Técnica' | 'Económica' | 'Declaración Jurada';
  description?: string;
  is_mandatory: boolean;
  status: 'pending' | 'uploaded' | 'verified';
  uploaded_by_name?: string;
  uploaded_at?: string;
  verification_timestamp?: string;
  version_47_25_compliant?: boolean;
  sort_order: number;
}

interface GovOpportunity {
  id: string;
  name: string;
  is_gov: boolean;
  gov_type?: string;
  gov_process_id?: string;
  submission_deadline?: string;
}

interface Props {
  opportunityId: string;
  govType?: string;
  submissionDeadline?: string;
  readOnly?: boolean;
}

// ── Countdown Timer ───────────────────────────────────────────
function useCountdown(deadline?: string) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;
    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return remaining;
}

function CountdownDisplay({ deadline }: { deadline?: string }) {
  const { t } = useLanguage();
  const remaining = useCountdown(deadline);

  if (!deadline) return null;

  const isExpired = remaining === 0;
  const isUrgent = remaining !== null && remaining < 48 * 60 * 60 * 1000;

  const hours = remaining !== null ? Math.floor(remaining / 3600000) : 0;
  const mins  = remaining !== null ? Math.floor((remaining % 3600000) / 60000) : 0;
  const secs  = remaining !== null ? Math.floor((remaining % 60000) / 1000) : 0;

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-bold',
      isExpired ? 'bg-gray-100 text-gray-500' :
      isUrgent  ? 'bg-red-100 text-red-700 animate-pulse' :
                  'bg-amber-50 text-amber-700'
    )}>
      <Clock className="w-4 h-4" />
      {isExpired
        ? t('Plazo vencido')
        : `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      }
      {isUrgent && !isExpired && (
        <span className="text-xs font-normal ml-1">{t('Menos de 48h')}</span>
      )}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:  { label: 'Pendiente',  color: 'bg-slate-100 text-slate-600',   icon: AlertCircle },
  uploaded: { label: 'Cargado',    color: 'bg-blue-100 text-blue-700',     icon: Upload },
  verified: { label: 'Verificado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
};

const CATEGORY_COLORS: Record<string, string> = {
  'Legal':              'bg-purple-50 text-purple-700 border-purple-200',
  'Técnica':            'bg-blue-50 text-blue-700 border-blue-200',
  'Económica':          'bg-green-50 text-green-700 border-green-200',
  'Declaración Jurada': 'bg-orange-50 text-orange-700 border-orange-200',
};

// ── Main Component ────────────────────────────────────────────
export function GovBiddingPanel({ opportunityId, govType, submissionDeadline, readOnly = false }: Props) {
  const { t } = useLanguage();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [opportunity, setOpportunity] = useState<GovOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Legal', is_mandatory: true });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await govApi.getChecklist(opportunityId);
      setOpportunity(res.data.opportunity);
      setChecklist(res.data.checklist);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error cargando expediente');
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (item: ChecklistItem, status: ChecklistItem['status']) => {
    try {
      const payload: any = { status };
      // Auto-flag 47-25 compliance when verifying
      if (status === 'verified') payload.version_47_25_compliant = true;
      await govApi.updateItem(item.id, payload);
      setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, ...payload } : c));
    } catch (err: any) {
      alert(err.response?.data?.detail || err.response?.data?.error || 'Error actualizando estado');
    }
  };

  const handleLoadTemplate = async () => {
    if (!window.confirm(t('¿Cargar plantilla de documentos para este tipo de proceso? Se agregarán los requisitos estándar de la Ley 47-25.'))) return;
    try {
      await govApi.loadTemplate(opportunityId);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error cargando plantilla');
    }
  };

  const handleSyncPortal = async () => {
    setSyncing(true);
    try {
      const res = await govApi.syncPortal({ opportunity_id: opportunityId, gov_process_id: opportunity?.gov_process_id });
      alert(`${t('Sincronización completada')}: ${res.data.message}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error sincronizando con portal');
    } finally {
      setSyncing(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;
    try {
      await govApi.createItem({ opportunity_id: opportunityId, ...newItem });
      setNewItem({ name: '', category: 'Legal', is_mandatory: true });
      setAddingItem(false);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error agregando ítem');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('¿Eliminar este requisito del expediente?'))) return;
    try {
      await govApi.deleteItem(id);
      setChecklist(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error eliminando ítem');
    }
  };

  // ── Stats ────────────────────────────────────────────────────
  const mandatory  = checklist.filter(c => c.is_mandatory);
  const pending    = mandatory.filter(c => c.status === 'pending').length;
  const uploaded   = mandatory.filter(c => c.status === 'uploaded').length;
  const verified   = mandatory.filter(c => c.status === 'verified').length;
  const pct        = mandatory.length > 0 ? Math.round(((uploaded + verified) / mandatory.length) * 100) : 0;
  const nonCompliant = checklist.filter(c => c.version_47_25_compliant === false);

  const deadlineToShow = submissionDeadline || opportunity?.submission_deadline;
  const categories = ['Legal', 'Técnica', 'Económica', 'Declaración Jurada'] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">{t('Cargando expediente...')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2">
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={load} className="text-xs text-cyan-600 underline">{t('Reintentar')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">{t('Expediente Digital — Ley 47-25')}</h3>
            {(govType || opportunity?.gov_type) && (
              <span className="text-xs text-slate-500">{govType || opportunity?.gov_type}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CountdownDisplay deadline={deadlineToShow} />
          {!readOnly && (
            <button
              onClick={handleSyncPortal}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
              {syncing ? t('Sincronizando...') : t('Sincronizar con Portal DGCP')}
            </button>
          )}
        </div>
      </div>

      {/* Legal validity alert for non-compliant docs */}
      {nonCompliant.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">{t('Alerta de vigencia legal')}</p>
            <p className="text-xs text-amber-700">
              {nonCompliant.length} {t('documento(s) podrían haber sido emitidos bajo regulaciones derogadas (pre-Ley 47-25). Verifique su vigencia antes de presentar el expediente.')}
            </p>
          </div>
        </div>
      )}

      {/* Progress */}
      <Card className="border-slate-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">{t('Completitud del expediente')} ({pct}%)</span>
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="text-red-600 font-medium">{pending} {t('pendientes')}</span>
              <span className="text-blue-600">{uploaded} {t('cargados')}</span>
              <span className="text-emerald-600">{verified} {t('verificados')}</span>
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', pct === 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-blue-500' : 'bg-amber-400')}
              style={{ width: `${pct}%` }}
            />
          </div>
          {pending > 0 && (
            <p className="text-[10px] text-red-500 mt-1">
              {t('El expediente no cumple con los requisitos mínimos de la Ley 47-25')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Checklist by category */}
      {categories.map(cat => {
        const items = checklist.filter(c => c.category === cat);
        if (items.length === 0) return null;
        return (
          <Card key={cat} className="border-slate-100">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <span className={cn('px-2 py-0.5 rounded text-[10px] border', CATEGORY_COLORS[cat])}>
                  {t(cat)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {items.map(item => {
                  const cfg = STATUS_CONFIG[item.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={item.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                      <StatusIcon className={cn('w-4 h-4 mt-0.5 flex-shrink-0',
                        item.status === 'pending'  ? 'text-slate-400' :
                        item.status === 'uploaded' ? 'text-blue-500' :
                                                     'text-emerald-500'
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-700 truncate">{item.name}</span>
                          {item.is_mandatory && (
                            <span className="text-[10px] text-red-500 font-medium">*{t('Obligatorio')}</span>
                          )}
                          {item.version_47_25_compliant === false && (
                            <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" />{t('Revisar vigencia')}
                            </span>
                          )}
                          {item.version_47_25_compliant === true && (
                            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" />{t('Ley 47-25 OK')}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{item.description}</p>
                        )}
                        {item.uploaded_at && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {t('Cargado por')} {item.uploaded_by_name || '—'} • {new Date(item.uploaded_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {!readOnly && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(item, 'uploaded')}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                            >
                              <Upload className="w-3 h-3" />
                              {t('Cargar')}
                            </button>
                          )}
                          {item.status === 'uploaded' && (
                            <button
                              onClick={() => handleStatusChange(item, 'verified')}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 transition-colors"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              {t('Verificar')}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-slate-300 hover:text-red-400 transition-colors rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Empty state */}
      {checklist.length === 0 && (
        <div className="text-center py-10 text-slate-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('No hay requisitos en el expediente')}</p>
          {!readOnly && (
            <button
              onClick={handleLoadTemplate}
              className="mt-3 px-4 py-2 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {t('Cargar plantilla Ley 47-25')}
            </button>
          )}
        </div>
      )}

      {/* Actions footer */}
      {!readOnly && checklist.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleLoadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            {t('Recargar plantilla')}
          </button>
          <button
            onClick={() => setAddingItem(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-dashed border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <Plus className="w-3 h-3" />
            {t('Agregar requisito')}
          </button>
        </div>
      )}

      {/* Add item form */}
      {addingItem && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold text-indigo-700">{t('Nuevo requisito')}</p>
            <input
              type="text"
              placeholder={t('Nombre del documento o requisito')}
              value={newItem.name}
              onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            />
            <div className="flex gap-3">
              <select
                value={newItem.category}
                onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
              >
                {['Legal', 'Técnica', 'Económica', 'Declaración Jurada'].map(c => (
                  <option key={c} value={c}>{t(c)}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItem.is_mandatory}
                  onChange={e => setNewItem(p => ({ ...p, is_mandatory: e.target.checked }))}
                  className="rounded"
                />
                {t('Obligatorio')}
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setAddingItem(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                {t('Cancelar')}
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItem.name.trim()}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {t('Agregar')}
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
