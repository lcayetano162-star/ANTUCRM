// ============================================
// MOBILE OPPORTUNITIES - Pipeline view for mobile
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search,
  Filter,
  TrendingUp,
  Calendar,
  User,
  DollarSign,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Opportunity {
  id: string;
  title: string;
  clientName: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate: string;
  lastActivity: string;
  isHot: boolean;
}

const STAGES = [
  { id: 'lead', name: 'Lead', color: 'bg-gray-500' },
  { id: 'qualified', name: 'Calificado', color: 'bg-blue-500' },
  { id: 'proposal', name: 'Propuesta', color: 'bg-yellow-500' },
  { id: 'negotiation', name: 'Negociación', color: 'bg-orange-500' },
  { id: 'closed_won', name: 'Ganada', color: 'bg-green-500' },
  { id: 'closed_lost', name: 'Perdida', color: 'bg-red-500' }
];

export function MobileOpportunities() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStage, setActiveStage] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    loadOpportunities();
  }, []);

  useEffect(() => {
    let filtered = opportunities;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.title.toLowerCase().includes(query) ||
        o.clientName.toLowerCase().includes(query)
      );
    }
    
    if (activeStage !== 'all') {
      filtered = filtered.filter(o => o.stage === activeStage);
    }
    
    setFilteredOpportunities(filtered);
    setTotalValue(filtered.reduce((sum, o) => sum + o.value, 0));
  }, [opportunities, searchQuery, activeStage]);

  const loadOpportunities = async () => {
    try {
      const response = await api.get('/mobile/opportunities');
      setOpportunities(response.data);
      setFilteredOpportunities(response.data);
      setTotalValue(response.data.reduce((sum: number, o: Opportunity) => sum + o.value, 0));
    } catch (error) {
      toast({ title: 'Error cargando oportunidades', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const moveStage = async (oppId: string, newStage: string) => {
    try {
      await api.patch(`/mobile/opportunities/${oppId}/stage`, { stage: newStage });
      setOpportunities(opportunities.map(o => 
        o.id === oppId ? { ...o, stage: newStage } : o
      ));
      toast({ title: '✓ Etapa actualizada', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error actualizando etapa', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#128C7E]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Pipeline Total</p>
              <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Oportunidades</p>
              <p className="text-2xl font-bold">{filteredOpportunities.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar oportunidades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button size="icon" variant="outline">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Stage Filter */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveStage('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeStage === 'all' 
                ? 'bg-[#128C7E] text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Todas
          </button>
          {STAGES.filter(s => !['closed_won', 'closed_lost'].includes(s.id)).map((stage) => (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeStage === stage.id 
                  ? 'bg-[#128C7E] text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${stage.color}`} />
              {stage.name}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-3">
        {filteredOpportunities.map((opp) => (
          <OpportunityCard 
            key={opp.id} 
            opportunity={opp}
            onStageChange={(stage) => moveStage(opp.id, stage)}
          />
        ))}
        
        {filteredOpportunities.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No se encontraron oportunidades</p>
          </div>
        )}
      </div>

      {/* Add Opportunity FAB */}
      <Button
        onClick={() => navigate('/opportunities/new')}
        className="fixed bottom-24 right-4 rounded-full w-14 h-14 shadow-lg bg-[#128C7E] hover:bg-[#075E54]"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}

function OpportunityCard({ 
  opportunity, 
  onStageChange 
}: { 
  opportunity: Opportunity;
  onStageChange: (stage: string) => void;
}) {
  const stage = STAGES.find(s => s.id === opportunity.stage);
  const nextStage = STAGES[STAGES.findIndex(s => s.id === opportunity.stage) + 1];
  
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{opportunity.title}</h3>
              {opportunity.isHot && (
                <span className="text-orange-500">🔥</span>
              )}
            </div>
            
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <User className="w-3 h-3" />
              {opportunity.clientName}
            </p>
            
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full text-white ${stage?.color || 'bg-gray-500'}`}>
                {stage?.name || opportunity.stage}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(opportunity.expectedCloseDate)}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-bold text-[#128C7E]">
              {formatCurrency(opportunity.value)}
            </p>
            <p className="text-xs text-gray-400">{opportunity.probability}%</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#128C7E] to-[#25D366] rounded-full transition-all"
            style={{ width: `${opportunity.probability}%` }}
          />
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <span className="text-xs text-gray-400">
            Última actividad: {formatDate(opportunity.lastActivity)}
          </span>
          
          {nextStage && (
            <button
              onClick={() => onStageChange(nextStage.id)}
              className="text-sm text-[#128C7E] font-medium flex items-center"
            >
              Avanzar <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MobileOpportunities;
