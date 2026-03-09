// ============================================
// Marketing Analytics - Dashboard de Métricas
// ANTU CRM Marketing Automation
// ============================================

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Users,
  MousePointer,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  Calendar,
  Target,
  Zap,
  Sparkles,
} from 'lucide-react';

// ============================================
// Mock Analytics Data
// ============================================

const ANALYTICS_DATA = {
  overview: {
    emailsSent: 45230,
    emailsDelivered: 44150,
    emailsOpened: 12874,
    emailsClicked: 3421,
    bounced: 380,
    complained: 12,
    unsubscribed: 145,
    // Rates
    deliveryRate: 97.6,
    openRate: 29.2,
    clickRate: 7.8,
    bounceRate: 0.8,
    complaintRate: 0.03,
    unsubscribeRate: 0.3,
  },
  campaigns: [
    { name: 'Newsletter Marzo', sent: 12500, opened: 4125, clicked: 875, openRate: 33, clickRate: 7 },
    { name: 'Promo Primavera', sent: 8900, opened: 2314, clicked: 712, openRate: 26, clickRate: 8 },
    { name: 'Demo Request', sent: 5600, opened: 2016, clicked: 672, openRate: 36, clickRate: 12 },
    { name: 'Re-engagement', sent: 4200, opened: 840, clicked: 126, openRate: 20, clickRate: 3 },
    { name: 'Product Update', sent: 7800, opened: 2184, clicked: 546, openRate: 28, clickRate: 7 },
    { name: 'Webinar Invite', sent: 6230, opened: 1990, clicked: 498, openRate: 32, clickRate: 8 },
  ],
  devices: {
    desktop: 55,
    mobile: 38,
    tablet: 7,
  },
  topLinks: [
    { url: 'https://antucrm.com/precios', clicks: 1245 },
    { url: 'https://antucrm.com/demo', clicks: 892 },
    { url: 'https://antucrm.com/case-studies', clicks: 567 },
    { url: 'https://antucrm.com/blog', clicks: 423 },
    { url: 'https://antucrm.com/contacto', clicks: 312 },
  ],
  hourlyActivity: [
    { hour: '00:00', opens: 45, clicks: 12 },
    { hour: '02:00', opens: 23, clicks: 5 },
    { hour: '04:00', opens: 15, clicks: 3 },
    { hour: '06:00', opens: 89, clicks: 23 },
    { hour: '08:00', opens: 456, clicks: 123 },
    { hour: '10:00', opens: 892, clicks: 267 },
    { hour: '12:00', opens: 1234, clicks: 389 },
    { hour: '14:00', opens: 1456, clicks: 445 },
    { hour: '16:00', opens: 1323, clicks: 398 },
    { hour: '18:00', opens: 987, clicks: 289 },
    { hour: '20:00', opens: 654, clicks: 178 },
    { hour: '22:00', opens: 234, clicks: 56 },
  ],
};

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

function StatCard({ title, value, subtitle, trend, trendValue, icon: Icon, iconColor, iconBg }: StatCardProps) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-2">
                {trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : trend === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                ) : null}
                <span className={cn(
                  'text-sm font-medium',
                  trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-600'
                )}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Campaign Performance Table
// ============================================

function CampaignPerformanceTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Campaña</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Enviados</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Abiertos</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Clicks</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Open Rate</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">CTR</th>
          </tr>
        </thead>
        <tbody>
          {ANALYTICS_DATA.campaigns.map((campaign, index) => (
            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-800">{campaign.name}</span>
                </div>
              </td>
              <td className="text-right py-3 px-4 text-slate-600">{campaign.sent.toLocaleString()}</td>
              <td className="text-right py-3 px-4 text-slate-600">{campaign.opened.toLocaleString()}</td>
              <td className="text-right py-3 px-4 text-slate-600">{campaign.clicked.toLocaleString()}</td>
              <td className="text-right py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${campaign.openRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{campaign.openRate}%</span>
                </div>
              </td>
              <td className="text-right py-3 px-4">
                <Badge variant="secondary" className="bg-slate-100">
                  {campaign.clickRate}%
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// Device Breakdown
// ============================================

function DeviceBreakdown() {
  const devices = [
    { name: 'Desktop', value: ANALYTICS_DATA.devices.desktop, icon: Monitor, color: 'bg-violet-500' },
    { name: 'Mobile', value: ANALYTICS_DATA.devices.mobile, icon: Smartphone, color: 'bg-pink-500' },
    { name: 'Tablet', value: ANALYTICS_DATA.devices.tablet, icon: Tablet, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-4">
      {devices.map((device) => (
        <div key={device.name} className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <device.icon className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">{device.name}</span>
              <span className="text-sm text-slate-500">{device.value}%</span>
            </div>
            <Progress value={device.value} className="h-2">
              <div className={cn('h-full rounded-full', device.color)} style={{ width: `${device.value}%` }} />
            </Progress>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Hourly Activity Chart
// ============================================

function HourlyActivityChart() {
  const maxOpens = Math.max(...ANALYTICS_DATA.hourlyActivity.map(h => h.opens));

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-1 h-40">
        {ANALYTICS_DATA.hourlyActivity.map((hour, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-0.5">
              <div
                className="flex-1 bg-violet-200 rounded-t"
                style={{ height: `${(hour.opens / maxOpens) * 100}px` }}
                title={`${hour.opens} opens`}
              />
              <div
                className="flex-1 bg-violet-500 rounded-t"
                style={{ height: `${(hour.clicks / maxOpens) * 100}px` }}
                title={`${hour.clicks} clicks`}
              />
            </div>
            <span className="text-xs text-slate-400">{hour.hour}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-violet-200 rounded" />
          <span className="text-slate-600">Aperturas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-violet-500 rounded" />
          <span className="text-slate-600">Clicks</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// AI Insights Panel
// ============================================

function AIInsightsPanel() {
  const insights = [
    {
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-100',
      title: 'Mejor horario identificado',
      description: 'Los emails enviados a las 2 PM tienen 23% más aperturas.',
    },
    {
      icon: Target,
      color: 'text-violet-500',
      bg: 'bg-violet-100',
      title: 'Segmento más activo',
      description: 'Leads de tecnología tienen 45% más engagement.',
    },
    {
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-100',
      title: 'Oportunidad de mejora',
      description: 'Las campañas de re-engagement están por debajo del promedio.',
    },
  ];

  return (
    <div className="space-y-3">
      {insights.map((insight, index) => (
        <div key={index} className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', insight.bg)}>
              <insight.icon className={cn('w-5 h-5', insight.color)} />
            </div>
            <div>
              <h4 className="font-medium text-slate-800">{insight.title}</h4>
              <p className="text-sm text-slate-500 mt-1">{insight.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Main Marketing Analytics
// ============================================

export function MarketingAnalytics() {
  const [period, setPeriod] = useState('30d');
  const { logAction } = useAuth();

  const handleExport = () => {
    // Aquí puedes agregar lógica real para descargar el CSV o PDF real.
    logAction('DB_EXPORT_DOWNLOADED', 'marketing_reports', {
      format: 'csv_pdf_mock',
      filters: { period },
      module: 'marketing'
    });
    // Por el momento, mostramos feedback visual indicando que se ha iniciado la exportación.
    toast.success('El reporte analítico está siendo procesado', {
      description: 'La descarga comenzará en unos segundos.'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics de Marketing</h1>
          <p className="text-slate-500 mt-1">
            Métricas detalladas de tus campañas de email
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="1y">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Emails Enviados"
          value={ANALYTICS_DATA.overview.emailsSent.toLocaleString()}
          subtitle="97.6% entregados"
          trend="up"
          trendValue="+12% vs mes anterior"
          icon={Mail}
          iconColor="text-violet-600"
          iconBg="bg-violet-100"
        />
        <StatCard
          title="Tasa de Apertura"
          value={`${ANALYTICS_DATA.overview.openRate}%`}
          subtitle={`${ANALYTICS_DATA.overview.emailsOpened.toLocaleString()} aperturas`}
          trend="up"
          trendValue="+2.3% vs mes anterior"
          icon={BarChart3}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100"
        />
        <StatCard
          title="Tasa de Click"
          value={`${ANALYTICS_DATA.overview.clickRate}%`}
          subtitle={`${ANALYTICS_DATA.overview.emailsClicked.toLocaleString()} clicks`}
          trend="up"
          trendValue="+0.8% vs mes anterior"
          icon={MousePointer}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Nuevos Leads"
          value="1,245"
          subtitle="Desde campañas de email"
          trend="up"
          trendValue="+18% vs mes anterior"
          icon={Users}
          iconColor="text-pink-600"
          iconBg="bg-pink-100"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="campaigns">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="campaigns" className="gap-2">
            <Mail className="w-4 h-4" />
            Campañas
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-2">
            <Globe className="w-4 h-4" />
            Dispositivos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">Rendimiento por Campaña</CardTitle>
                  <CardDescription>Comparativa de todas tus campañas activas</CardDescription>
                </CardHeader>
                <CardContent>
                  <CampaignPerformanceTable />
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="border-slate-200">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-500" />
                    <CardTitle className="text-base">Insights de IA</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <AIInsightsPanel />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Actividad por Hora</CardTitle>
                <CardDescription>Cuándo tus suscriptores están más activos</CardDescription>
              </CardHeader>
              <CardContent>
                <HourlyActivityChart />
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Top Links Clickeados</CardTitle>
                <CardDescription>URLs más populares en tus emails</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ANALYTICS_DATA.topLinks.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-slate-400 w-6">#{index + 1}</span>
                        <span className="text-sm text-slate-600 truncate">{link.url}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full"
                            style={{ width: `${(link.clicks / ANALYTICS_DATA.topLinks[0].clicks) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700 w-12 text-right">
                          {link.clicks.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Dispositivos</CardTitle>
                <CardDescription>Desde dónde se abren tus emails</CardDescription>
              </CardHeader>
              <CardContent>
                <DeviceBreakdown />
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Navegadores</CardTitle>
                <CardDescription>Clientes de email más populares</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Gmail', value: 45 },
                    { name: 'Apple Mail', value: 25 },
                    { name: 'Outlook', value: 15 },
                    { name: 'Yahoo Mail', value: 8 },
                    { name: 'Otros', value: 7 },
                  ].map((browser) => (
                    <div key={browser.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-slate-600">{browser.name}</span>
                        <span className="text-sm font-medium text-slate-700">{browser.value}%</span>
                      </div>
                      <Progress value={browser.value} className="h-2">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${browser.value}%` }}
                        />
                      </Progress>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MarketingAnalytics;
