// ============================================
// Marketing Page - Main Marketing Automation Dashboard
// ANTU CRM Marketing Automation
// ============================================

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Users,
  MousePointer,
  BarChart3,
  Settings,
  Plus,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Globe,
  FormInput,
  Layout,
  Send,
  Brain,
  ArrowRight,
  Check,
  Clock,
} from 'lucide-react';

// Import components
import { CampaignBuilder } from '../components/CampaignBuilder';
import { LeadScoringDashboard } from '../components/LeadScoringDashboard';
import { FormBuilder } from '../components/FormBuilder';
import { LandingPageBuilder } from '../components/LandingPageBuilder';
import { SMTPConfig } from '../components/SMTPConfig';
import { MarketingAnalytics } from '../components/MarketingAnalytics';

// ============================================
// Quick Stats Component
// ============================================

function QuickStats() {
  const stats = [
    {
      label: 'Emails Enviados',
      value: '45.2K',
      change: '+12%',
      trend: 'up' as const,
      icon: Send,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
    {
      label: 'Tasa de Apertura',
      value: '29.2%',
      change: '+2.3%',
      trend: 'up' as const,
      icon: Mail,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Tasa de Click',
      value: '7.8%',
      change: '+0.8%',
      trend: 'up' as const,
      icon: MousePointer,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Nuevos Leads',
      value: '1,245',
      change: '+18%',
      trend: 'up' as const,
      icon: Users,
      color: 'text-pink-600',
      bg: 'bg-pink-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-rose-500" />
                  )}
                  <span className={cn(
                    'text-xs font-medium',
                    stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                  )}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('w-5 h-5', stat.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// Recent Campaigns Component
// ============================================

function RecentCampaigns() {
  const campaigns = [
    {
      name: 'Newsletter Marzo 2026',
      status: 'sent',
      sent: 12500,
      opened: 4125,
      clicked: 875,
      sentAt: 'Hace 2 días',
    },
    {
      name: 'Promo Primavera',
      status: 'sending',
      sent: 4500,
      opened: 890,
      clicked: 234,
      sentAt: 'En progreso',
    },
    {
      name: 'Demo Request Follow-up',
      status: 'scheduled',
      sent: 0,
      opened: 0,
      clicked: 0,
      sentAt: 'Mañana, 10:00 AM',
    },
    {
      name: 'Re-engagement Campaign',
      status: 'draft',
      sent: 0,
      opened: 0,
      clicked: 0,
      sentAt: 'Borrador',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-emerald-100 text-emerald-700"><Check className="w-3 h-3 mr-1" /> Enviado</Badge>;
      case 'sending':
        return <Badge className="bg-blue-100 text-blue-700"><Send className="w-3 h-3 mr-1" /> Enviando</Badge>;
      case 'scheduled':
        return <Badge className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" /> Programado</Badge>;
      case 'draft':
        return <Badge className="bg-slate-100 text-slate-700">Borrador</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Campañas Recientes</CardTitle>
          <Button variant="ghost" size="sm" className="text-violet-600">
            Ver todas
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {campaigns.map((campaign, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{campaign.name}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    {getStatusBadge(campaign.status)}
                    <span>•</span>
                    <span>{campaign.sentAt}</span>
                  </div>
                </div>
              </div>
              {campaign.status !== 'draft' && campaign.status !== 'scheduled' && (
                <div className="text-right hidden md:block">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Opens</span>
                      <span className="ml-1 font-medium">{Math.round((campaign.opened / campaign.sent) * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Clicks</span>
                      <span className="ml-1 font-medium">{Math.round((campaign.clicked / campaign.sent) * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Top Performing Leads Component
// ============================================

function TopPerformingLeads() {
  const leads = [
    { name: 'Carlos Méndez', company: 'Tecnología RD', score: 87, trend: 'up' },
    { name: 'Ana García', company: 'Constructora del Caribe', score: 92, trend: 'up' },
    { name: 'María Santos', company: 'Grupo Financiero Nacional', score: 78, trend: 'stable' },
    { name: 'Luis Rodríguez', company: 'Retail Solutions DO', score: 45, trend: 'up' },
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Leads Más Calificados</CardTitle>
          <Button variant="ghost" size="sm" className="text-violet-600">
            Ver todos
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leads.map((lead, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white font-medium">
                  {lead.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{lead.name}</p>
                  <p className="text-sm text-slate-500">{lead.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-violet-500" />
                    <span className="font-bold text-slate-800">{lead.score}</span>
                  </div>
                  <p className="text-xs text-slate-400">score</p>
                </div>
                {lead.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// AI Recommendations Component
// ============================================

function AIRecommendations({ onNewCampaign }: { onNewCampaign: () => void }) {
  const recommendations = [
    {
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-100',
      title: 'Campaña de re-engagement',
      description: '456 leads inactivos detectados. Crea una campaña para reactivarlos.',
      action: 'Crear campaña',
      onClick: onNewCampaign,
    },
    {
      icon: Brain,
      color: 'text-violet-500',
      bg: 'bg-violet-100',
      title: 'Optimizar asuntos',
      description: 'La IA puede mejorar tus tasas de apertura en un 15%.',
      action: 'Optimizar',
    },
    {
      icon: Target,
      color: 'text-emerald-500',
      bg: 'bg-emerald-100',
      title: 'Segmentar audiencia',
      description: 'Detectamos 3 segmentos con alto potencial de conversión.',
      action: 'Ver segmentos',
    },
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          <CardTitle className="text-base">Recomendaciones de IA</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div key={index} className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', rec.bg)}>
                  <rec.icon className={cn('w-5 h-5', rec.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-800">{rec.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{rec.description}</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto mt-2 text-violet-600"
                    onClick={rec.onClick}
                  >
                    {rec.action}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Dashboard Overview
// ============================================

function DashboardOverview({ onNewCampaign }: { onNewCampaign: () => void }) {
  return (
    <div className="space-y-6">
      <QuickStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentCampaigns />
          <TopPerformingLeads />
        </div>
        <div>
          <AIRecommendations onNewCampaign={onNewCampaign} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Marketing Page
// ============================================

export function MarketingPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [builderKey, setBuilderKey] = useState(0);

  const handleNewCampaign = () => {
    setActiveTab('campaigns');
    setBuilderKey(prev => prev + 1);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'campaigns', label: 'Campañas', icon: Mail },
    { id: 'leads', label: 'Lead Scoring', icon: Target },
    { id: 'forms', label: 'Formularios', icon: FormInput },
    { id: 'landing', label: 'Landing Pages', icon: Layout },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'smtp', label: 'SMTP', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Marketing Automation</h1>
              <p className="text-slate-500 mt-1">
                {t('marketing.tagline', 'Campañas de email, lead scoring y páginas de aterrizaje con IA')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Globe className="w-4 h-4 mr-2" />
                {t('marketing.viewPublicSite', 'Ver sitio público')}
              </Button>
              <Button
                onClick={handleNewCampaign}
                className="bg-violet-500 hover:bg-violet-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('marketing.newCampaign', 'Nueva campaña')}
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <ScrollArea className="w-full">
          <div className="px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-transparent border-b border-slate-200 w-full justify-start rounded-none h-auto p-0">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      'gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-violet-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none',
                      activeTab === tab.id ? 'text-violet-600' : 'text-slate-600'
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </ScrollArea>
      </div>

      {/* Content */}
      <div className="p-6">
        <Tabs value={activeTab}>
          <TabsContent value="dashboard" className="m-0">
            <DashboardOverview onNewCampaign={handleNewCampaign} />
          </TabsContent>

          <TabsContent value="campaigns" className="m-0">
            <CampaignBuilder
              key={builderKey}
              onSave={(campaign) => console.log('Save campaign:', campaign)}
            />
          </TabsContent>

          <TabsContent value="leads" className="m-0">
            <LeadScoringDashboard />
          </TabsContent>

          <TabsContent value="forms" className="m-0">
            <FormBuilder />
          </TabsContent>

          <TabsContent value="landing" className="m-0">
            <LandingPageBuilder />
          </TabsContent>

          <TabsContent value="analytics" className="m-0">
            <MarketingAnalytics />
          </TabsContent>

          <TabsContent value="smtp" className="m-0">
            <SMTPConfig />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default MarketingPage;
