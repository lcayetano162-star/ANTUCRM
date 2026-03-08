import { useEffect, useState } from 'react'
import { Plus, Search, MoreHorizontal, UserPlus, Phone, Mail, Building2, Send, FileText, CheckSquare, X, Sparkles } from 'lucide-react'
import ActivityModal, { ActivityData } from '@/components/ActivityModal'
import { EmailSender, EmailHistory } from '@/components/email'
import { ContactAIAnalysis } from '@/components/ai'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { contactsApi, activitiesApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  client_name: string
  client_id: string
  is_primary: boolean
}

export default function Contacts() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Activity Modal state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [selectedContactForActivity, setSelectedContactForActivity] = useState<Contact | null>(null)

  // Contact Detail Modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [emailRefreshTrigger, setEmailRefreshTrigger] = useState(0)

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    client_id: '',
    is_primary: false
  })

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setIsLoading(true)
      const response = await contactsApi.getAll()
      setContacts(Array.isArray(response.data) ? response.data : (response.data.data || []))
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudieron cargar los contactos',
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
      await contactsApi.create(formData)
      toast({
        title: 'Éxito',
        description: 'Contacto creado correctamente',
        variant: 'success'
      })
      setIsDialogOpen(false)
      loadContacts()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo crear el contacto',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openActivityModal = (contact: Contact) => {
    setSelectedContactForActivity(contact)
    setIsActivityModalOpen(true)
  }

  const openDetailModal = (contact: Contact) => {
    setSelectedContact(contact)
    setIsDetailModalOpen(true)
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
      setSelectedContactForActivity(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo registrar la actividad',
        variant: 'destructive'
      })
    }
  }

  const handleEmailSent = () => {
    // Refrescar el historial de emails
    setEmailRefreshTrigger(prev => prev + 1)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const filteredContacts = contacts.filter(contact =>
    contact.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contactos</h1>
          <p className="text-gray-500">Gestiona los contactos de tus clientes</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Contacto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar contactos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay contactos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Contacto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Empresa</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Cargo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Contacto</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center text-cyan-700 font-medium">
                            {getInitials(contact.first_name, contact.last_name)}
                          </div>
                          <div>
                            <p className="font-medium">
                              {contact.first_name} {contact.last_name}
                              {contact.is_primary && (
                                <Badge className="ml-2 bg-amber-100 text-amber-700">Principal</Badge>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          {contact.client_name || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{contact.position || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {contact.email || '-'}
                          </p>
                          <p className="flex items-center gap-2 text-gray-500 mt-1">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {contact.phone || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetailModal(contact)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openActivityModal(contact)}>
                              <Phone className="w-4 h-4 mr-2" />
                              Registrar Actividad
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-violet-600" />
              </div>
              Nuevo Contacto
            </HorizontalDialogTitle>
            <HorizontalDialogDescription>
              Completa la información del nuevo contacto
            </HorizontalDialogDescription>
          </HorizontalDialogHeader>
          
          <HorizontalDialogBody>
            <form onSubmit={handleSubmit}>
              <HorizontalDialogTwoColumn
                left={
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-slate-700 font-medium">Nombre *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                        className="bg-white border-slate-200 focus:border-violet-300 focus:ring-violet-100"
                        placeholder="Nombre del contacto"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-slate-700 font-medium">Apellido *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                        className="bg-white border-slate-200 focus:border-violet-300 focus:ring-violet-100"
                        placeholder="Apellido del contacto"
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
                        className="bg-white border-slate-200 focus:border-violet-300 focus:ring-violet-100"
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
                        className="bg-white border-slate-200 focus:border-violet-300 focus:ring-violet-100"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="position" className="text-slate-700 font-medium">Cargo</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        placeholder="Ej: Gerente de Ventas"
                        className="bg-white border-slate-200 focus:border-violet-300 focus:ring-violet-100"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="client_id" className="text-slate-700 font-medium">Cliente/Empresa</Label>
                      <Select
                        value={formData.client_id}
                        onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                      >
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client1">Cliente Ejemplo 1</SelectItem>
                          <SelectItem value="client2">Cliente Ejemplo 2</SelectItem>
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
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white"
            >
              {isSubmitting ? 'Guardando...' : 'Crear Contacto'}
            </Button>
          </HorizontalDialogFooter>
        </HorizontalDialogContent>
      </HorizontalDialog>

      {/* Contact Detail Modal with Tabs */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedContact && (
            <>
              <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center text-cyan-700 font-bold text-xl">
                    {getInitials(selectedContact.first_name, selectedContact.last_name)}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">
                      {selectedContact.first_name} {selectedContact.last_name}
                      {selectedContact.is_primary && (
                        <Badge className="ml-2 bg-amber-100 text-amber-700">Principal</Badge>
                      )}
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedContact.position && <span className="mr-3">{selectedContact.position}</span>}
                      {selectedContact.client_name && (
                        <span className="flex items-center gap-1 inline-flex">
                          <Building2 className="w-3 h-3" />
                          {selectedContact.client_name}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="email" className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid w-full grid-cols-4 mx-6 mt-4">
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notas
                  </TabsTrigger>
                  <TabsTrigger value="activities" className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Actividades
                  </TabsTrigger>
                  <TabsTrigger value="ai-analysis" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Análisis IA
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Email */}
                <TabsContent value="email" className="flex-1 overflow-auto px-6 py-4 m-0">
                  <div className="space-y-6">
                    {/* Formulario de envío */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                        <Send className="w-4 h-4 text-cyan-600" />
                        Enviar nuevo correo
                      </h3>
                      <EmailSender
                        contactId={selectedContact.id}
                        clientId={selectedContact.client_id}
                        toEmail={selectedContact.email}
                        toName={`${selectedContact.first_name} ${selectedContact.last_name}`}
                        onEmailSent={handleEmailSent}
                      />
                    </div>

                    {/* Historial de correos */}
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        Historial de correos
                      </h3>
                      <EmailHistory
                        contactId={selectedContact.id}
                        refreshTrigger={emailRefreshTrigger}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Notas */}
                <TabsContent value="notes" className="flex-1 overflow-auto px-6 py-4 m-0">
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 text-sm">Módulo de Notas</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Las notas del contacto se mostrarán aquí
                    </p>
                  </div>
                </TabsContent>

                {/* Tab: Actividades */}
                <TabsContent value="activities" className="flex-1 overflow-auto px-6 py-4 m-0">
                  <div className="text-center py-12">
                    <CheckSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 text-sm">Módulo de Actividades</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Las actividades relacionadas con este contacto se mostrarán aquí
                    </p>
                  </div>
                </TabsContent>

                {/* Tab: Análisis IA */}
                <TabsContent value="ai-analysis" className="flex-1 overflow-auto px-6 py-4 m-0">
                  <ContactAIAnalysis
                    contactId={selectedContact.id}
                    contactName={`${selectedContact.first_name} ${selectedContact.last_name}`}
                    contactEmail={selectedContact.email}
                    contactPhone={selectedContact.phone}
                    clientName={selectedContact.client_name}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Activity Modal */}
      {selectedContactForActivity && (
        <ActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => {
            setIsActivityModalOpen(false)
            setSelectedContactForActivity(null)
          }}
          onSubmit={handleActivitySubmit}
          relatedType="contact"
          relatedId={selectedContactForActivity.id}
          relatedName={`${selectedContactForActivity.first_name} ${selectedContactForActivity.last_name}`}
        />
      )}
    </div>
  )
}
