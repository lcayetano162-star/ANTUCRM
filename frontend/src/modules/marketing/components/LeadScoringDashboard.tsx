// ============================================
// Lead Scoring Dashboard - Puntuación Predictiva con IA
// ANTU CRM Marketing Automation
// ============================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Mail,
  MousePointer,
  Globe,
  UserCheck,
  Filter,
  Search,
  ArrowRight,
  Zap,
  Target,
  Users,
  BarChart3,
  Star,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Minus,
} from 'lucide-react';
import type { Lead, LeadStatus } from '../types';

// ============================================
// Mock Data
// ============================================

const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    tenantId: 't1',
    email: 'carlos.mendez@empresa.com',
    firstName: 'Carlos',
    lastName: 'Méndez',
    company: 'Tecnología RD SRL',
    title: 'Director de Ventas',
    phone: '+1-809-555-0123',
    industry: 'Tecnología',
    companySize: '50-200',
    score: 87,
    scoreHistory: [
      { score: 45, change: 45, reason: 'Nuevo lead - Formulario web', timestamp: new Date('2026-01-15') },
      { score: 62, change: 17, reason: 'Abrió 3 emails', timestamp: new Date('2026-01-20') },
      { score: 75, change: 13, reason: 'Visitó página de precios', timestamp: new Date('2026-01-25') },
      { score: 87, change: 12, reason: 'Descargó case study', timestamp: new Date('2026-02-01') },
    ],
    status: 'qualified',
    source: 'web_form',
    assignedTo: 'user-1',
    assignedAt: new Date('2026-01-20'),
    emailEngagement: {
      emailsSent: 8,
      emailsOpened: 6,
      emailsClicked: 4,
      lastOpenedAt: new Date('2026-02-28'),
      lastClickedAt: new Date('2026-02-27'),
      openRate: 75,
      clickRate: 50,
    },
    webActivity: [
      { page: '/precios', timestamp: new Date('2026-02-28'), timeOnPage: 180, scrollDepth: 85 },
      { page: '/case-studies', timestamp: new Date('2026-02-27'), timeOnPage: 240, scrollDepth: 90 },
      { page: '/features', timestamp: new Date('2026-02-25'), timeOnPage: 120, scrollDepth: 60 },
    ],
    consentGiven: true,
    consentDate: new Date('2026-01-15'),
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-02-28'),
  },
  {
    id: '2',
    tenantId: 't1',
    email: 'ana.garcia@constructora.do',
    firstName: 'Ana',
    lastName: 'García',
    company: 'Constructora del Caribe',
    title: 'Gerente General',
    phone: '+1-809-555-0456',
    industry: 'Construcción',
    companySize: '200-500',
    score: 92,
    scoreHistory: [
      { score: 50, change: 50, reason: 'Nuevo lead - Landing page', timestamp: new Date('2026-01-10') },
      { score: 70, change: 20, reason: 'Solicitó demo', timestamp: new Date('2026-01-15') },
      { score: 85, change: 15, reason: 'Asistió a webinar', timestamp: new Date('2026-01-25') },
      { score: 92, change: 7, reason: 'Alto engagement email', timestamp: new Date('2026-02-05') },
    ],
    status: 'opportunity',
    source: 'landing_page',
    assignedTo: 'user-2',
    assignedAt: new Date('2026-01-16'),
    emailEngagement: {
      emailsSent: 12,
      emailsOpened: 11,
      emailsClicked: 8,
      lastOpenedAt: new Date('2026-03-01'),
      lastClickedAt: new Date('2026-03-01'),
      openRate: 92,
      clickRate: 67,
    },
    webActivity: [
      { page: '/demo-request', timestamp: new Date('2026-03-01'), timeOnPage: 300, scrollDepth: 100 },
      { page: '/precios', timestamp: new Date('2026-02-28'), timeOnPage: 200, scrollDepth: 80 },
    ],
    consentGiven: true,
    consentDate: new Date('2026-01-10'),
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-03-01'),
  },
  {
    id: '3',
    tenantId: 't1',
    email: 'luis.rodriguez@retail.do',
    firstName: 'Luis',
    lastName: 'Rodríguez',
    company: 'Retail Solutions DO',
    title: 'CEO',
    phone: '+1-809-555-0789',
    industry: 'Retail',
    companySize: '20-50',
    score: 45,
    scoreHistory: [
      { score: 30, change: 30, reason: 'Nuevo lead - Referido', timestamp: new Date('2026-02-01') },
      { score: 38, change: 8, reason: 'Abrió email de bienvenida', timestamp: new Date('2026-02-05') },
      { score: 45, change: 7, reason: 'Visitó blog', timestamp: new Date('2026-02-20') },
    ],
    status: 'new',
    source: 'referral',
    emailEngagement: {
      emailsSent: 5,
      emailsOpened: 2,
      emailsClicked: 1,
      lastOpenedAt: new Date('2026-02-20'),
      openRate: 40,
      clickRate: 20,
    },
    webActivity: [
      { page: '/blog', timestamp: new Date('2026-02-20'), timeOnPage: 90, scrollDepth: 45 },
    ],
    consentGiven: true,
    consentDate: new Date('2026-02-01'),
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-20'),
  },
  {
    id: '4',
    tenantId: 't1',
    email: 'maria.santos@finanzas.do',
    firstName: 'María',
    lastName: 'Santos',
    company: 'Grupo Financiero Nacional',
    title: 'VP de Operaciones',
    phone: '+1-809-555-0321',
    industry: 'Finanzas',
    companySize: '500+',
    score: 78,
    scoreHistory: [
      { score: 40, change: 40, reason: 'Nuevo lead - API integración', timestamp: new Date('2026-01-20') },
      { score: 55, change: 15, reason: 'Múltiples visitas a pricing', timestamp: new Date('2026-01-28') },
      { score: 68, change: 13, reason: 'Alto tiempo en sitio', timestamp: new Date('2026-02-10') },
      { score: 78, change: 10, reason: 'Revisó documentación API', timestamp: new Date('2026-02-25') },
    ],
    status: 'qualified',
    source: 'api',
    assignedTo: 'user-1',
    assignedAt: new Date('2026-02-01'),
    emailEngagement: {
      emailsSent: 6,
      emailsOpened: 5,
      emailsClicked: 3,
      lastOpenedAt: new Date('2026-02-25'),
      lastClickedAt: new Date('2026-02-25'),
      openRate: 83,
      clickRate: 50,
    },
    webActivity: [
      { page: '/docs/api', timestamp: new Date('2026-02-25'), timeOnPage: 420, scrollDepth: 95 },
      { page: '/precios', timestamp: new Date('2026-02-24'), timeOnPage: 150, scrollDepth: 70 },
      { page: '/enterprise', timestamp: new Date('2026-02-20'), timeOnPage: 200, scrollDepth: 80 },
    ],
    consentGiven: true,
    consentDate: new Date('2026-01-20'),
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-02-25'),
  },
  {
    id: '5',
    tenantId: 't1',
    email: 'pedro.vargas@salud.do',
    firstName: 'Pedro',
    lastName: 'Vargas',
    company: 'Clínica Esperanza',
    title: 'Administrador',
    phone: '+1-809-555-0654',
    industry: 'Salud',
    companySize: '10-50',
    score: 23,
    scoreHistory: [
      { score: 20, change: 20, reason: 'Nuevo lead - Evento', timestamp: new Date('2026-02-15') },
      { score: 23, change: 3, reason: 'Abrió email inicial', timestamp: new Date('2026-02-20') },
    ],
    status: 'new',
    source: 'event',
    emailEngagement: {
      emailsSent: 3,
      emailsOpened: 1,
      emailsClicked: 0,
      lastOpenedAt: new Date('2026-02-20'),
      openRate: 33,
      clickRate: 0,
    },
    webActivity: [],
    consentGiven: true,
    consentDate: new Date('2026-02-15'),
    createdAt: new Date('2026-02-15'),
    updatedAt: new Date('2026-02-20'),
  },
];

// ============================================
// Score Badge Component
// ============================================

function ScoreBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (score >= 50) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-rose-100 text-rose-700 border-rose-200';
  };

  const getIcon = () => {
    if (score >= 80) return <TrendingUp className="w-3 h-3" />;
    if (score >= 50) return <Minus className="w-3 h-3" />;
    return <TrendingDown className="w-3 h-3" />;
  };

  return (
    <Badge className={cn('border flex items-center gap-1', getColor())}>
      {getIcon()}
      {score}
    </Badge>
  );
}

// ============================================
// Lead Activity Timeline
// ============================================

function LeadActivityTimeline({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-slate-800">Historial de puntuación</h4>
      <div className="space-y-2">
        {lead.scoreHistory.map((event, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              event.change > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
            )}>
              {event.change > 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">{event.reason}</p>
              <p className="text-xs text-slate-500">
                {event.timestamp.toLocaleDateString('es-DO', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            <Badge 
              variant="secondary" 
              className={cn(
                event.change > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              )}
            >
              {event.change > 0 ? '+' : ''}{event.change} pts
            </Badge>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      <h4 className="font-medium text-slate-800">Actividad web</h4>
      <div className="space-y-2">
        {lead.webActivity.map((activity, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">{activity.page}</p>
              <p className="text-xs text-slate-500">
                {activity.timestamp.toLocaleDateString('es-DO')} • {Math.round(activity.timeOnPage / 60)}m {activity.timeOnPage % 60}s
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Scroll</p>
              <p className="text-sm font-medium text-slate-700">{activity.scrollDepth}%</p>
            </div>
          </div>
        ))}
        {lead.webActivity.length === 0 && (
          <p className="text-sm text-slate-400 italic">Sin actividad web registrada</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// Lead Detail Dialog
// ============================================

function LeadDetailDialog({ 
  lead, 
  open, 
  onOpenChange,
}: { 
  lead: Lead | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Detalle del Lead</DialogTitle>
          <DialogDescription>
            Información completa y puntuación predictiva
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Header Info */}
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="text-xl bg-gradient-to-br from-violet-400 to-pink-400 text-white">
                  {lead.firstName?.[0]}{lead.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-800">
                    {lead.firstName} {lead.lastName}
                  </h3>
                  <ScoreBadge score={lead.score} />
                </div>
                <p className="text-slate-500">{lead.title} @ {lead.company}</p>
                <p className="text-sm text-slate-400">{lead.email}</p>
              </div>
            </div>

            {/* AI Prediction */}
            <Card className="border-violet-200 bg-violet-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-violet-500" />
                  <CardTitle className="text-base text-violet-800">Predicción IA</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-violet-600">Probabilidad de conversión</p>
                    <p className="text-2xl font-bold text-violet-700">
                      {Math.min(lead.score + 10, 95)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-violet-600">Tiempo estimado</p>
                    <p className="text-2xl font-bold text-violet-700">
                      {lead.score > 70 ? '7-14 días' : lead.score > 50 ? '14-30 días' : '30+ días'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <p className="text-sm text-slate-600">
                    <Sparkles className="w-4 h-4 inline mr-1 text-violet-500" />
                    <strong>Recomendación:</strong>{' '}
                    {lead.score >= 80 
                      ? 'Lead hot - Contactar inmediatamente. Alta intención de compra detectada.'
                      : lead.score >= 50
                      ? 'Lead warm - Enviar contenido de nurturing y seguimiento proactivo.'
                      : 'Lead cold - Enviar a campaña de educación y awareness.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    Email Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Open rate</span>
                      <span className="font-medium">{lead.emailEngagement.openRate}%</span>
                    </div>
                    <Progress value={lead.emailEngagement.openRate} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Click rate</span>
                      <span className="font-medium">{lead.emailEngagement.clickRate}%</span>
                    </div>
                    <Progress value={lead.emailEngagement.clickRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-green-500" />
                    Web Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Páginas vistas</span>
                      <span className="font-medium">{lead.webActivity.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Avg. scroll depth</span>
                      <span className="font-medium">
                        {lead.webActivity.length > 0 
                          ? Math.round(lead.webActivity.reduce((a, b) => a + b.scrollDepth, 0) / lead.webActivity.length)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Avg. time on page</span>
                      <span className="font-medium">
                        {lead.webActivity.length > 0 
                          ? Math.round(lead.webActivity.reduce((a, b) => a + b.timeOnPage, 0) / lead.webActivity.length / 60)
                          : 0}m
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Score History */}
            <LeadActivityTimeline lead={lead} />

            {/* Actions */}
            <div className="flex gap-2">
              <Button className="flex-1 bg-violet-500 hover:bg-violet-600">
                <UserCheck className="w-4 h-4 mr-2" />
                Asignar a vendedor
              </Button>
              <Button variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Enviar email
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// AI Insights Panel
// ============================================

function AIInsightsPanel() {
  const insights = [
    {
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-100',
      title: 'Leads calientes detectados',
      description: '3 leads con score >80 están listos para contacto inmediato.',
      action: 'Ver leads',
    },
    {
      icon: Target,
      color: 'text-blue-500',
      bg: 'bg-blue-100',
      title: 'Segmento más engagement',
      description: 'Tecnología RD tiene 85% open rate en los últimos 30 días.',
      action: 'Analizar',
    },
    {
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-100',
      title: 'Tendencia positiva',
      description: 'El score promedio aumentó 12% esta semana.',
      action: 'Ver detalle',
    },
  ];

  return (
    <div className="space-y-3">
      {insights.map((insight, index) => (
        <div key={index} className="p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', insight.bg)}>
              <insight.icon className={cn('w-5 h-5', insight.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-800">{insight.title}</h4>
              <p className="text-sm text-slate-500 mt-1">{insight.description}</p>
              <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-violet-600">
                {insight.action}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Main Lead Scoring Dashboard
// ============================================

export function LeadScoringDashboard() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');

  // Filter leads
  const filteredLeads = MOCK_LEADS.filter((lead) => {
    const matchesSearch = 
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    const matchesScore = 
      scoreFilter === 'all' ||
      (scoreFilter === 'hot' && lead.score >= 80) ||
      (scoreFilter === 'warm' && lead.score >= 50 && lead.score < 80) ||
      (scoreFilter === 'cold' && lead.score < 50);
    
    return matchesSearch && matchesStatus && matchesScore;
  });

  // Stats
  const stats = {
    total: MOCK_LEADS.length,
    hot: MOCK_LEADS.filter(l => l.score >= 80).length,
    warm: MOCK_LEADS.filter(l => l.score >= 50 && l.score < 80).length,
    cold: MOCK_LEADS.filter(l => l.score < 50).length,
    avgScore: Math.round(MOCK_LEADS.reduce((a, b) => a + b.score, 0) / MOCK_LEADS.length),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lead Scoring con IA</h1>
          <p className="text-slate-500 mt-1">
            Puntuación predictiva y enriquecimiento automático de leads
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Ver reportes
          </Button>
          <Button className="bg-violet-500 hover:bg-violet-600">
            <Zap className="w-4 h-4 mr-2" />
            Recalcular scores
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total leads</p>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Hot leads</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.hot}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Warm leads</p>
                <p className="text-2xl font-bold text-amber-600">{stats.warm}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Score promedio</p>
                <p className="text-2xl font-bold text-violet-600">{stats.avgScore}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeadStatus | 'all')}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="new">Nuevo</SelectItem>
                    <SelectItem value="contacted">Contactado</SelectItem>
                    <SelectItem value="qualified">Calificado</SelectItem>
                    <SelectItem value="opportunity">Oportunidad</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={scoreFilter} onValueChange={(v) => setScoreFilter(v as typeof scoreFilter)}>
                  <SelectTrigger className="w-[160px]">
                    <Target className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los scores</SelectItem>
                    <SelectItem value="hot">Hot (80+)</SelectItem>
                    <SelectItem value="warm">Warm (50-79)</SelectItem>
                    <SelectItem value="cold">Cold (&lt;50)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card className="border-slate-200">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => {
                      setSelectedLead(lead);
                      setDetailOpen(true);
                    }}
                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-violet-400 to-pink-400 text-white text-sm">
                          {lead.firstName?.[0]}{lead.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">
                            {lead.firstName} {lead.lastName}
                          </span>
                          <ScoreBadge score={lead.score} />
                        </div>
                        <p className="text-sm text-slate-500 truncate">{lead.company}</p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-sm text-slate-500">{lead.email}</p>
                        <p className="text-xs text-slate-400">
                          {lead.emailEngagement.openRate}% open • {lead.emailEngagement.clickRate}% click
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
                {filteredLeads.length === 0 && (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No se encontraron leads</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-500" />
                <CardTitle className="text-base">Insights de IA</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <AIInsightsPanel />
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Distribución de Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Hot (80-100)</span>
                    <span className="font-medium">{stats.hot}</span>
                  </div>
                  <Progress value={(stats.hot / stats.total) * 100} className="h-2 bg-slate-100">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(stats.hot / stats.total) * 100}%` }} />
                  </Progress>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Warm (50-79)</span>
                    <span className="font-medium">{stats.warm}</span>
                  </div>
                  <Progress value={(stats.warm / stats.total) * 100} className="h-2 bg-slate-100">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(stats.warm / stats.total) * 100}%` }} />
                  </Progress>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Cold (0-49)</span>
                    <span className="font-medium">{stats.cold}</span>
                  </div>
                  <Progress value={(stats.cold / stats.total) * 100} className="h-2 bg-slate-100">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(stats.cold / stats.total) * 100}%` }} />
                  </Progress>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lead Detail Dialog */}
      <LeadDetailDialog
        lead={selectedLead}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}

export default LeadScoringDashboard;
