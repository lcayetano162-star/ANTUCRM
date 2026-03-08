// ============================================
// MOBILE CLIENTS - Client list and quick actions
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin,
  Building2,
  MoreVertical,
  ChevronRight,
  Filter,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { formatDistanceToNow } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  city?: string;
  isHot: boolean;
  lastContact?: string;
  totalOpportunities: number;
  totalValue: number;
}

export function MobileClients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'hot' | 'recent'>('all');

  // Load clients
  useEffect(() => {
    loadClients();
  }, []);

  // Filter clients
  useEffect(() => {
    let filtered = clients;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.company?.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
      );
    }
    
    if (filter === 'hot') {
      filtered = filtered.filter(c => c.isHot);
    } else if (filter === 'recent') {
      filtered = filtered.sort((a, b) => 
        new Date(b.lastContact || 0).getTime() - new Date(a.lastContact || 0).getTime()
      );
    }
    
    setFilteredClients(filtered);
  }, [clients, searchQuery, filter]);

  const loadClients = async () => {
    try {
      const response = await api.get('/mobile/clients');
      setClients(response.data);
      setFilteredClients(response.data);
    } catch (error) {
      toast({ title: 'Error cargando clientes', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const quickCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const quickEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const quickWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const toggleHot = async (clientId: string, current: boolean) => {
    try {
      await api.patch(`/mobile/clients/${clientId}/hot`, { isHot: !current });
      setClients(clients.map(c => 
        c.id === clientId ? { ...c, isHot: !current } : c
      ));
    } catch (error) {
      toast({ title: 'Error actualizando cliente', variant: 'destructive' });
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
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button size="icon" variant="outline">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'hot', 'recent'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f 
                ? 'bg-[#128C7E] text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f === 'all' && 'Todos'}
            {f === 'hot' && '🔥 Calientes'}
            {f === 'recent' && 'Recientes'}
          </button>
        ))}
      </div>

      {/* Client List */}
      <div className="space-y-3">
        {filteredClients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onCall={() => client.phone && quickCall(client.phone)}
            onEmail={() => quickEmail(client.email)}
            onWhatsApp={() => client.phone && quickWhatsApp(client.phone)}
            onToggleHot={() => toggleHot(client.id, client.isHot)}
          />
        ))}
        
        {filteredClients.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No se encontraron clientes</p>
          </div>
        )}
      </div>

      {/* Add Client FAB */}
      <Button
        onClick={() => navigate('/clients/new')}
        className="fixed bottom-24 right-4 rounded-full w-14 h-14 shadow-lg bg-[#128C7E] hover:bg-[#075E54]"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}

function ClientCard({ 
  client, 
  onCall, 
  onEmail, 
  onWhatsApp,
  onToggleHot
}: { 
  client: Client;
  onCall: () => void;
  onEmail: () => void;
  onWhatsApp: () => void;
  onToggleHot: () => void;
}) {
  return (
    <Card className="border-0 shadow-sm active:scale-[0.99] transition-transform">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#075E54] to-[#128C7E] flex items-center justify-center text-white font-bold text-lg shrink-0">
            {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{client.name}</h3>
              <button 
                onClick={onToggleHot}
                className={`transition-colors ${client.isHot ? 'text-orange-500' : 'text-gray-300'}`}
              >
                <Star className="w-4 h-4 fill-current" />
              </button>
            </div>
            
            {client.company && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {client.company}
              </p>
            )}
            
            {client.city && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {client.city}
              </p>
            )}
            
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                {client.totalOpportunities} oportunidades
              </span>
              <span className="text-xs text-gray-400">
                {client.lastContact && formatDistanceToNow(new Date(client.lastContact))}
              </span>
            </div>
          </div>
          
          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 -mr-2">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {client.phone && (
                <DropdownMenuItem onClick={onCall}>
                  <Phone className="w-4 h-4 mr-2" />
                  Llamar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onEmail}>
                <Mail className="w-4 h-4 mr-2" />
                Email
              </DropdownMenuItem>
              {client.phone && (
                <DropdownMenuItem onClick={onWhatsApp}>
                  WhatsApp
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Quick Actions Bar */}
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
          <button 
            onClick={onEmail}
            className="p-2 rounded-full bg-gray-100 text-gray-600"
          >
            <Mail className="w-4 h-4" />
          </button>
          {client.phone && (
            <button 
              onClick={onWhatsApp}
              className="p-2 rounded-full bg-[#25D366] text-white"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
          )}
          {client.phone && (
            <button 
              onClick={onCall}
              className="p-2 rounded-full bg-[#128C7E] text-white"
            >
              <Phone className="w-4 h-4" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MobileClients;
