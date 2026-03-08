import { useEffect, useRef, useState } from 'react';
import { X, RefreshCw, Users } from 'lucide-react';
import { aiApi } from '../../services/api';

interface MapNode {
  id: string;
  type: 'client' | 'contact' | 'opportunity' | 'user';
  label: string;
  subtitle?: string;
  meta?: Record<string, any>;
  // Layout computed
  x?: number;
  y?: number;
}

interface MapEdge {
  source: string;
  target: string;
  label?: string;
}

interface RelationshipMap {
  nodes: MapNode[];
  edges: MapEdge[];
  generatedAt: string;
}

interface Props {
  clientId: string;
  clientName: string;
  onClose: () => void;
}

const NODE_COLORS: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  client:      { bg: '#6d28d9', border: '#5b21b6', icon: '🏢', text: 'white' },
  contact:     { bg: '#0891b2', border: '#0e7490', icon: '👤', text: 'white' },
  opportunity: { bg: '#059669', border: '#047857', icon: '💼', text: 'white' },
  user:        { bg: '#d97706', border: '#b45309', icon: '⭐', text: 'white' },
};

function computeLayout(nodes: MapNode[], width: number, height: number): MapNode[] {
  const cx = width / 2;
  const cy = height / 2;

  const byType: Record<string, MapNode[]> = { client: [], contact: [], opportunity: [], user: [] };
  for (const n of nodes) byType[n.type].push(n);

  const placed: MapNode[] = [];

  // Client always center
  for (const n of byType.client) placed.push({ ...n, x: cx, y: cy });

  // Contacts: left arc
  byType.contact.forEach((n, i) => {
    const total = byType.contact.length;
    const angle = total === 1 ? Math.PI : (Math.PI * 0.4 + (i / Math.max(total - 1, 1)) * Math.PI * 1.2);
    const r = Math.min(width, height) * 0.32;
    placed.push({ ...n, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle - Math.PI * 0.5) });
  });

  // Opportunities: right arc
  byType.opportunity.forEach((n, i) => {
    const total = byType.opportunity.length;
    const angle = total === 1 ? 0 : (-Math.PI * 0.4 - (i / Math.max(total - 1, 1)) * Math.PI * 1.2);
    const r = Math.min(width, height) * 0.32;
    placed.push({ ...n, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle + Math.PI * 0.5) });
  });

  // Users: bottom arc
  byType.user.forEach((n, i) => {
    const total = byType.user.length;
    const startAngle = Math.PI * 0.55;
    const endAngle = Math.PI * 0.45;
    const t = total === 1 ? 0.5 : i / (total - 1);
    const angle = startAngle + t * (endAngle - startAngle) + Math.PI;
    const r = Math.min(width, height) * 0.30;
    placed.push({ ...n, x: cx + r * Math.cos(angle + Math.PI * 0.5), y: cy + r * Math.sin(angle + Math.PI * 0.5) + r * 0.3 });
  });

  return placed;
}

const NODE_W = 120;
const NODE_H = 52;

export function RelationshipMap({ clientId, clientName, onClose }: Props) {
  const [data, setData] = useState<RelationshipMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MapNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 820;
  const H = 540;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiApi.getRelationshipMap(clientId);
      setData(res.data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error cargando mapa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [clientId]);

  const placed = data ? computeLayout(data.nodes, W, H) : [];
  const nodeById = new Map(placed.map(n => [n.id, n]));

  const stageColors: Record<string, string> = {
    closed_won: '#059669', closed_lost: '#dc2626',
    negotiation: '#2563eb', proposal: '#7c3aed',
    analysis: '#0891b2', qualify: '#6b7280',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col" style={{ maxHeight: '92vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-700 to-indigo-700 text-white">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Mapa de Relaciones</h2>
            <p className="text-sm text-violet-200">{clientName}</p>
          </div>
          <div className="flex items-center gap-2">
            {!loading && (
              <button
                onClick={load}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw size={14} /> Actualizar
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-6 py-2 bg-gray-50 border-b text-xs">
          {[
            { type: 'client', label: 'Cliente', color: '#6d28d9' },
            { type: 'contact', label: 'Contacto', color: '#0891b2' },
            { type: 'opportunity', label: 'Oportunidad', color: '#059669' },
            { type: 'user', label: 'Vendedor', color: '#d97706' },
          ].map(l => (
            <div key={l.type} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
              <span className="text-gray-600">{l.label}</span>
            </div>
          ))}
          <span className="ml-auto text-gray-400 italic">Haz clic en un nodo para ver detalles</span>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Graph */}
          <div className="flex-1 relative bg-gray-50" style={{ minHeight: 0 }}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Generando mapa de relaciones...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-red-500">
                  <p className="font-medium">{error}</p>
                  <button onClick={load} className="mt-2 text-sm underline">Reintentar</button>
                </div>
              </div>
            )}
            {!loading && !error && data && (
              <svg
                ref={svgRef}
                width="100%"
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-full"
                style={{ maxHeight: '480px' }}
              >
                <defs>
                  <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#cbd5e1" />
                  </marker>
                  {/* Glow filter for selected */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  {/* Subtle grid */}
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                  </pattern>
                </defs>

                {/* Background grid */}
                <rect width={W} height={H} fill="url(#grid)" />

                {/* Edges */}
                {data.edges.map((edge, i) => {
                  const src = nodeById.get(edge.source);
                  const tgt = nodeById.get(edge.target);
                  if (!src || !tgt) return null;
                  const sx = src.x!;
                  const sy = src.y!;
                  const tx = tgt.x!;
                  const ty = tgt.y!;
                  const mx = (sx + tx) / 2;
                  const my = (sy + ty) / 2;
                  // Curved path
                  const dx = tx - sx;
                  const dy = ty - sy;
                  const len = Math.sqrt(dx * dx + dy * dy);
                  const cpx = mx - dy * 0.15;
                  const cpy = my + dx * 0.15;
                  return (
                    <g key={i}>
                      <path
                        d={`M ${sx} ${sy} Q ${cpx} ${cpy} ${tx} ${ty}`}
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        markerEnd="url(#arrow)"
                      />
                      {edge.label && len > 60 && (
                        <text x={cpx} y={cpy - 6} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="system-ui">
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {placed.map(node => {
                  const col = NODE_COLORS[node.type];
                  const nx = node.x! - NODE_W / 2;
                  const ny = node.y! - NODE_H / 2;
                  const isSelected = selected?.id === node.id;
                  const isOpp = node.type === 'opportunity';
                  const stageColor = isOpp ? (stageColors[node.meta?.stage] || col.bg) : col.bg;

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelected(isSelected ? null : node)}
                      style={{ cursor: 'pointer' }}
                      filter={isSelected ? 'url(#glow)' : undefined}
                    >
                      {/* Shadow */}
                      <rect x={nx + 2} y={ny + 2} width={NODE_W} height={NODE_H} rx={10} fill="rgba(0,0,0,0.15)" />
                      {/* Node body */}
                      <rect
                        x={nx} y={ny} width={NODE_W} height={NODE_H}
                        rx={10}
                        fill={isSelected ? stageColor : 'white'}
                        stroke={stageColor}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                      />
                      {/* Color bar top */}
                      <rect x={nx} y={ny} width={NODE_W} height={6} rx={10} fill={stageColor} />
                      <rect x={nx} y={ny + 3} width={NODE_W} height={3} fill={stageColor} />

                      {/* Label */}
                      <text
                        x={node.x!}
                        y={ny + 22}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill={isSelected ? 'white' : '#1e293b'}
                        fontFamily="system-ui"
                      >
                        {node.label.length > 16 ? node.label.slice(0, 15) + '…' : node.label}
                      </text>
                      {/* Subtitle */}
                      {node.subtitle && (
                        <text
                          x={node.x!}
                          y={ny + 36}
                          textAnchor="middle"
                          fontSize="8.5"
                          fill={isSelected ? 'rgba(255,255,255,0.85)' : '#64748b'}
                          fontFamily="system-ui"
                        >
                          {node.subtitle.length > 18 ? node.subtitle.slice(0, 17) + '…' : node.subtitle}
                        </text>
                      )}
                      {/* Score badge for opportunities */}
                      {isOpp && node.meta?.score != null && (
                        <g>
                          <rect x={nx + NODE_W - 28} y={ny + 8} width={24} height={14} rx={5} fill={stageColor} />
                          <text x={nx + NODE_W - 16} y={ny + 19} textAnchor="middle" fontSize="8" fontWeight="700" fill="white" fontFamily="system-ui">
                            {node.meta.score}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* Side panel */}
          <div className="w-64 border-l bg-white overflow-y-auto p-4 flex flex-col gap-4">
            {selected ? (
              <>
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2"
                    style={{ background: NODE_COLORS[selected.type].bg }}
                  >
                    {NODE_COLORS[selected.type].icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{selected.label}</h3>
                  {selected.subtitle && <p className="text-xs text-gray-500 mt-0.5">{selected.subtitle}</p>}
                </div>

                <div className="space-y-2">
                  {selected.type === 'opportunity' && selected.meta && (
                    <>
                      {selected.meta.stage && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Etapa</span>
                          <span className="font-medium text-gray-800">{selected.subtitle}</span>
                        </div>
                      )}
                      {selected.meta.revenue && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Valor</span>
                          <span className="font-medium text-gray-800">
                            ${Number(selected.meta.revenue).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selected.meta.probability && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Probabilidad</span>
                          <span className="font-medium text-gray-800">{selected.meta.probability}%</span>
                        </div>
                      )}
                      {selected.meta.score != null && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Score IA</span>
                          <span className="font-bold" style={{ color: selected.meta.score >= 70 ? '#059669' : selected.meta.score >= 40 ? '#d97706' : '#dc2626' }}>
                            {selected.meta.score}/100 — {selected.meta.scoreLabel || ''}
                          </span>
                        </div>
                      )}
                      {selected.meta.owner && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Vendedor</span>
                          <span className="font-medium text-gray-800">{selected.meta.owner}</span>
                        </div>
                      )}
                    </>
                  )}
                  {selected.type === 'contact' && selected.meta && (
                    <>
                      {selected.meta.email && (
                        <div className="flex justify-between text-xs gap-2">
                          <span className="text-gray-500 shrink-0">Email</span>
                          <span className="font-medium text-gray-800 truncate">{selected.meta.email}</span>
                        </div>
                      )}
                      {selected.meta.job_title && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Cargo</span>
                          <span className="font-medium text-gray-800">{selected.meta.job_title}</span>
                        </div>
                      )}
                    </>
                  )}
                  {selected.type === 'client' && selected.meta && (
                    <>
                      {selected.meta.status && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Estado</span>
                          <span className="font-medium text-gray-800 capitalize">{selected.meta.status}</span>
                        </div>
                      )}
                      {selected.meta.industry && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Industria</span>
                          <span className="font-medium text-gray-800">{selected.meta.industry}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="border-t pt-3">
                  <p className="text-xs text-gray-400">
                    {data?.edges.filter(e => e.source === selected.id || e.target === selected.id).length || 0} conexiones
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users size={20} className="text-gray-300" />
                </div>
                <p className="text-xs">Selecciona un nodo para ver sus detalles</p>
              </div>
            )}

            {/* Stats */}
            {data && (
              <div className="mt-auto border-t pt-3 space-y-1.5">
                {[
                  { label: 'Contactos', count: data.nodes.filter(n => n.type === 'contact').length, color: '#0891b2' },
                  { label: 'Oportunidades', count: data.nodes.filter(n => n.type === 'opportunity').length, color: '#059669' },
                  { label: 'Vendedores', count: data.nodes.filter(n => n.type === 'user').length, color: '#d97706' },
                  { label: 'Conexiones', count: data.edges.length, color: '#6d28d9' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{s.label}</span>
                    <span className="font-bold" style={{ color: s.color }}>{s.count}</span>
                  </div>
                ))}
                <p className="text-[10px] text-gray-300 pt-1">
                  {new Date(data.generatedAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
