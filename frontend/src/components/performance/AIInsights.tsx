// ============================================
// ANTU CRM - AI Insights Component
// Insights y análisis de IA
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Lightbulb, AlertTriangle, TrendingUp, ArrowRight, Target } from 'lucide-react';
import type { AIInsight, TrendAnalysis } from '@/types/performance';
import { cn } from '@/lib/utils';

interface AIInsightsProps {
  insights: AIInsight[];
  trends: TrendAnalysis[];
}

export function AIInsights({ insights, trends }: AIInsightsProps) {
  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'recommendation':
        return <Lightbulb className="w-5 h-5 text-amber-600" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'opportunity':
        return <Target className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'recommendation':
        return 'bg-amber-50 border-amber-200';
      case 'alert':
        return 'bg-red-50 border-red-200';
      case 'trend':
        return 'bg-blue-50 border-blue-200';
      case 'opportunity':
        return 'bg-emerald-50 border-emerald-200';
    }
  };

  const getPriorityBadge = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">Alta</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Media</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Baja</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Insights principales */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <Brain className="w-4 h-4 text-violet-600" />
            </div>
            Insights de IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight, index) => (
            <div 
              key={index} 
              className={cn(
                "rounded-xl p-4 border",
                getInsightColor(insight.type)
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-800">{insight.title}</h4>
                    {getPriorityBadge(insight.priority)}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{insight.description}</p>
                  {insight.action && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto text-slate-700 hover:text-slate-900 font-medium"
                    >
                      {insight.action}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <Button variant="outline" size="sm" className="w-full gap-2">
            Ver plan de acción completo
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Análisis de tendencias */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            Análisis de Tendencias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">
            Tu desempeño vs mismo período año anterior:
          </p>
          
          <div className="space-y-3">
            {trends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">{trend.metric}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">
                    {trend.currentValue.toLocaleString()} vs {trend.previousValue.toLocaleString()}
                  </span>
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-sm font-medium",
                    trend.changeType === 'positive' && "bg-emerald-100 text-emerald-700",
                    trend.changeType === 'negative' && "bg-red-100 text-red-700",
                    trend.changeType === 'neutral' && "bg-slate-100 text-slate-700"
                  )}>
                    {trend.changeType === 'positive' && '↗️'}
                    {trend.changeType === 'negative' && '↘️'}
                    {trend.changeType === 'neutral' && '→'}
                    {trend.change > 0 ? '+' : ''}{trend.change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Patrón detectado:</strong> Estás enfocándote en deals más grandes 
                pero cerrando menos. Considera calificación más estricta de oportunidades.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AIInsights;
