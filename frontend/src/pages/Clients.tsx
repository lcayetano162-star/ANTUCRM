import { useEffect, useState } from 'react'
import { Plus, Search, Filter, MoreHorizontal, UserPlus, Briefcase, Phone, TrendingUp, CalendarDays, Network } from 'lucide-react'
import ActivityModal, { ActivityData } from '@/components/ActivityModal'
import MeetingPrepModal from '@/components/ai/MeetingPrepModal'
import { RelationshipMap } from '@/components/ai/RelationshipMap'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  HorizontalDialog, 
  HorizontalDialogContent, 
  HorizontalDialogHeader, 
  HorizontalDialogTitle, 
  HorizontalDialogDescription,
  HorizontalDialogFooter,
  HorizontalDialogBody,
  HorizontalDialogTwoColumn
} from '@/components/ui/horizontal-dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { clientsApi, activitiesApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'
import { useLanguage } from '@/contexts/LanguageContext'

interface Client {
  id: string
  name: string
  rnc: string
  email: string
  phone: string
  city: string
  contact_type: string
  assigned_to: string
  assigned_first_name: string
  assigned_last_name: string
  contacts_count: number
  opportunities_count: number
}

export default function Clients() {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const { t } = useLanguage()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Activity Modal state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [selectedClientForActivity, setSelectedClientForActivity] = useState<Client | null>(null)

  // Meeting Prep IA state
  const [meetingPrepClient, setMeetingPrepClient] = useState<Client | null>(null)
  // Relationship Map IA state
  const [relationshipMapClient, setRelationshipMapClient] = useState<Client | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    rnc: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    contact_type: 'prospect'
  })

  useEffect(() => {
    loadClients()
  }, [statusFilter])

  const loadClients = async () => {
    try {
      setIsLoading(true)
      const params: any = {}
      if (statusFilter !== 'all') {
        params.type = statusFilter
      }
      const response = await clientsApi.getAll(params)
      setClients(response.data.data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudieron cargar los clientes',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await clientsApi.create(formData)
      toast({
        title: 'Éxito',
        description: 'Cliente creado correctamente',
        variant: 'success'
      })
      setIsDialogOpen(false)
      loadClients()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo crear el cliente',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConvert = async (client: Client) => {
    try {
      await clientsApi.convert(client.id, {
        opportunity_name: `Oportunidad - ${client.name}`
      })
      toast({
        title: 'Éxito',
        description: 'Cliente convertido a oportunidad',
        variant: 'success'
      })
      loadClients()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo convertir el cliente',
        variant: 'destructive'
      })
    }
  }

  const openActivityModal = (client: Client) => {
    setSelectedClientForActivity(client)
    setIsActivityModalOpen(true)
  }

  const handleActivitySubmit = async (activity: ActivityData) => {
    try {
      await activitiesApi.create(activity)
      toast({
        title: 'Éxito',
        description: `Actividad registrada para ${activity.related_name}`,
        variant: 'success'
      })
      setIsActivityModalOpen(false)
      setSelectedClientForActivity(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo registrar la actividad',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'client':
        return <Badge variant="success">Cliente</Badge>
      case 'prospect':
        return <Badge variant="warning">Prospecto</Badge>
      case 'archived':
        return <Badge variant="secondary">Archivado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.rnc?.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500">Gestiona tus prospectos y clientes</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="prospect">Prospectos</TabsTrigger>
            <TabsTrigger value="client">Clientes</TabsTrigger>
            <TabsTrigger value="archived">Archivados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay clientes registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">RNC</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Contacto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Asignado a</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-gray-500">{client.city}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{client.rnc || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p>{client.email || '-'}</p>
                          <p className="text-gray-500">{client.phone || '-'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(client.contact_type)}</td>
                      <td className="py-3 px-4 text-gray-500">
                        {client.assigned_first_name} {client.assigned_last_name}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {client.contact_type === 'prospect' && (
                              <DropdownMenuItem onClick={() => handleConvert(client)}>
                                <Briefcase className="w-4 h-4 mr-2" />
                                Convertir a Oportunidad
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setMeetingPrepClient(client)}>
                              <CalendarDays className="w-4 h-4 mr-2 text-violet-600" />
                              Preparar Reunión IA
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRelationshipMapClient(client)}>
                              <Network className="w-4 h-4 mr-2 text-indigo-600" />
                              Mapa de Relaciones IA
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openActivityModal(client)}>
                              <Phone className="w-4 h-4 mr-2" />
                              Registrar Actividad
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog - Horizontal Layout with Pastel Colors */}
      <HorizontalDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <HorizontalDialogContent>
          <HorizontalDialogHeader>
            <HorizontalDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-cyan-600" />
              </div>
              Nuevo Cliente
            </HorizontalDialogTitle>
            <HorizontalDialogDescription>
              Completa la información del nuevo prospecto o cliente
            </HorizontalDialogDescription>
          </HorizontalDialogHeader>
          
          <HorizontalDialogBody>
            <form onSubmit={handleSubmit}>
              <HorizontalDialogTwoColumn
                left={
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-700 font-medium">Nombre *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-white border-slate-200 focus:border-cyan-300 focus:ring-cyan-100"
                        placeholder="Nombre del cliente o empresa"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rnc" className="text-slate-700 font-medium">RNC</Label>
                      <Input
                        id="rnc"
                        value={formData.rnc}
                        onChange={(e) => setFormData({ ...formData, rnc: e.target.value })}
                        placeholder="101-XXXXX-X"
                        className="bg-white border-slate-200 focus:border-cyan-300 focus:ring-cyan-100"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="correo@ejemplo.com"
                        className="bg-white border-slate-200 focus:border-cyan-300 focus:ring-cyan-100"
                      />
                    </div>
                  </>
                }
                right={
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-700 font-medium">Teléfono</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(809) XXX-XXXX"
                        className="bg-white border-slate-200 focus:border-cyan-300 focus:ring-cyan-100"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-slate-700 font-medium">Ciudad</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Santo Domingo"
                        className="bg-white border-slate-200 focus:border-cyan-300 focus:ring-cyan-100"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-slate-700 font-medium">Dirección</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Calle, número, sector"
                        className="bg-white border-slate-200 focus:border-cyan-300 focus:ring-cyan-100"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-slate-700 font-medium">Estado</Label>
                      <Select
                        value={formData.contact_type}
                        onValueChange={(value) => setFormData({ ...formData, contact_type: value })}
                      >
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prospect">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-400" />
                              Prospecto
                            </div>
                          </SelectItem>
                          <SelectItem value="client">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-400" />
                              Cliente
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                }
              />
            </form>
          </HorizontalDialogBody>

          <HorizontalDialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            >
              {isSubmitting ? 'Guardando...' : 'Crear Cliente'}
            </Button>
          </HorizontalDialogFooter>
        </HorizontalDialogContent>
      </HorizontalDialog>

      {/* Meeting Prep IA Modal */}
      {meetingPrepClient && (
        <MeetingPrepModal
          clientId={meetingPrepClient.id}
          clientName={meetingPrepClient.name}
          onClose={() => setMeetingPrepClient(null)}
        />
      )}

      {/* Relationship Map IA Modal */}
      {relationshipMapClient && (
        <RelationshipMap
          clientId={relationshipMapClient.id}
          clientName={relationshipMapClient.name}
          onClose={() => setRelationshipMapClient(null)}
        />
      )}

      {/* Activity Modal */}
      {selectedClientForActivity && (
        <ActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => {
            setIsActivityModalOpen(false)
            setSelectedClientForActivity(null)
          }}
          onSubmit={handleActivitySubmit}
          relatedType="client"
          relatedId={selectedClientForActivity.id}
          relatedName={selectedClientForActivity.name}
        />
      )}
    </div>
  )
}
