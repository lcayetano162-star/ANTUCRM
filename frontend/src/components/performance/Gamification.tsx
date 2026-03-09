// ============================================
// ANTU CRM - Gamification Component
// Badges, logros y desafíos
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Zap, Lock, Clock, ArrowRight } from 'lucide-react';
import type { Badge as BadgeType, Challenge } from '@/types/performance';

interface GamificationProps {
  badges: BadgeType[];
  challenges: Challenge[];
}

export function Gamification({ badges, challenges }: GamificationProps) {
  const earnedBadges = badges.filter(b => b.earned);
  const pendingBadges = badges.filter(b => !b.earned);
  const activeChallenges = challenges.filter(c => !c.completed);

  return (
    <div className="space-y-6">
      {/* Logros y Badges */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              Logros
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {earnedBadges.length}/{badges.length} obtenidos
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Badges obtenidos */}
          {earnedBadges.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-500 mb-3">Obtenidos</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {earnedBadges.map((badge) => (
                  <div 
                    key={badge.id} 
                    className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200 text-center"
                  >
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <h5 className="text-sm font-semibold text-slate-800 mb-1">{badge.name}</h5>
                    <p className="text-xs text-slate-500">{badge.description}</p>
                    {badge.earnedAt && (
                      <p className="text-xs text-amber-600 mt-2">
                        {badge.earnedAt.toLocaleDateString('es-DO', { month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges pendientes */}
          {pendingBadges.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-500 mb-3">Por desbloquear</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {pendingBadges.map((badge) => (
                  <div 
                    key={badge.id} 
                    className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center opacity-70"
                  >
                    <div className="relative">
                      <div className="text-3xl mb-2 grayscale">{badge.icon}</div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                    <h5 className="text-sm font-semibold text-slate-600 mb-1">{badge.name}</h5>
                    <p className="text-xs text-slate-400">{badge.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Desafíos Activos */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              Desafíos Activos
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {activeChallenges.length} activos
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeChallenges.map((challenge) => {
            const progressPercentage = Math.round((challenge.progress / challenge.target) * 100);
            const daysLeft = Math.ceil((challenge.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            return (
              <div key={challenge.id} className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-800">{challenge.title}</h4>
                    <p className="text-sm text-slate-500">{challenge.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      {challenge.reward}
                    </Badge>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Progreso</span>
                    <span className="font-medium text-slate-700">
                      RD${(challenge.progress / 1000).toFixed(0)}K / RD${(challenge.target / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span>{daysLeft} días restantes</span>
                  </div>
                  <span className="text-sm font-medium text-emerald-600">{progressPercentage}%</span>
                </div>
              </div>
            );
          })}
          
          <Button variant="outline" size="sm" className="w-full gap-2">
            Ver todos los desafíos
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default Gamification;
