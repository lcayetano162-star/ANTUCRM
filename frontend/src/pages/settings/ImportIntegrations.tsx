import { useState, useEffect, useRef } from 'react'
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  RefreshCw,
  Database,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Webhook,
  Zap,
  Puzzle,
  Code,
  Globe,
  Settings,
  ArrowRight,
  X,
  Download,
  FileJson,
  Link2,
  Mail,
  Phone,
  User,
  Building2,
  MapPin,
  Briefcase
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { importApi } from '@/services/api'

// ==================== TYPES ====================

type ImportStep = 1 | 2 | 3

interface ColumnMapping {
  csvColumn: string
  crmField: string
  sampleData: string[]
}

interface ImportResult {
  total: number
  success: number
  errors: number
  duplicates: number
}

interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
}

interface IntegrationCard {
  id: string
  name: string
  description: string
  icon: string
  color: string
  bgColor: string
  isConnected: boolean
}

// ==================== COMPONENT ====================

export default function ImportIntegrations() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // ==================== IMPORT WIZARD STATE ====================
  const [importStep, setImportStep] = useState<ImportStep>(1)
  const [importType, setImportType] = useState<'clients' | 'contacts' | 'inventory' | 'sales' | 'opportunities'>('clients')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importJobId, setImportJobId] = useState<string | null>(null)
  const [importErrors, setImportErrors] = useState<any[]>([])
  
  // ==================== API & INTEGRATIONS STATE ====================
  const [apiKey, setApiKey] = useState('sk_live_51H8xJk2L9mNpQrStUvWxYzAbCdEfGhIjKlMnOp')
  const [showApiKey, setShowApiKey] = useState(false)
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    { id: '1', name: 'Notificación de Nuevo Lead', url: 'https://mi-erp.com/webhook/leads', events: ['lead.created'], isActive: true },
    { id: '2', name: 'Sincronización de Clientes', url: 'https://mi-erp.com/webhook/clients', events: ['client.created', 'client.updated'], isActive: false }
  ])
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [newWebhookName, setNewWebhookName] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  
  // ==================== WEB FORM STATE ====================
  const [formFields, setFormFields] = useState({
    name: true,
    email: true,
    phone: false,
    company: false,
    message: false
  })
  const [formTitle, setFormTitle] = useState('Contáctanos')
  const [formSubmitText, setFormSubmitText] = useState('Enviar')
  const [formColor, setFormColor] = useState('#7c3aed')
  const [generatedCode, setGeneratedCode] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)
  
  // ==================== MOCK CSV DATA ====================
  const mockCsvColumns = [
    { csv: 'Nombre', sample: ['Juan Pérez', 'María García', 'Carlos López'] },
    { csv: 'Email', sample: ['juan@ejemplo.com', 'maria@empresa.com', 'carlos@test.com'] },
    { csv: 'Teléfono', sample: ['+1 234 567 8900', '+1 234 567 8901', '+1 234 567 8902'] },
    { csv: 'Empresa', sample: ['Empresa A', 'Empresa B', 'Empresa C'] },
    { csv: 'Ciudad', sample: ['Santo Domingo', 'Santiago', 'Punta Cana'] },
    { csv: 'Cargo', sample: ['Gerente', 'Director', 'Vendedor'] }
  ]
  
  const crmFields = [
    { value: 'first_name', label: 'Nombre', icon: User },
    { value: 'last_name', label: 'Apellido', icon: User },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'phone', label: 'Teléfono', icon: Phone },
    { value: 'company_name', label: 'Nombre de Empresa', icon: Building2 },
    { value: 'city', label: 'Ciudad', icon: MapPin },
    { value: 'job_title', label: 'Cargo', icon: Briefcase },
    { value: 'skip', label: 'Omitir columna', icon: X }
  ]
  
  const webhookEvents = [
    { value: 'lead.created', label: 'Lead Creado' },
    { value: 'lead.updated', label: 'Lead Actualizado' },
    { value: 'client.created', label: 'Cliente Creado' },
    { value: 'client.updated', label: 'Cliente Actualizado' },
    { value: 'opportunity.created', label: 'Oportunidad Creada' },
    { value: 'opportunity.won', label: 'Oportunidad Ganada' },
    { value: 'quote.accepted', label: 'Cotización Aceptada' },
    { value: 'task.completed', label: 'Tarea Completada' }
  ]
  
  const integrations: IntegrationCard[] = [
    { 
      id: 'zapier', 
      name: 'Zapier', 
      description: 'Conecta con 5000+ apps', 
      icon: '⚡', 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50',
      isConnected: true 
    },
    { 
      id: 'make', 
      name: 'Make (Integromat)', 
      description: 'Automatización visual', 
      icon: '🔧', 
      color: 'text-purple-600', 
      bgColor: 'bg-purple-50',
      isConnected: false 
    },
    { 
      id: 'slack', 
      name: 'Slack', 
      description: 'Notificaciones en tiempo real', 
      icon: '💬', 
      color: 'text-pink-600', 
      bgColor: 'bg-pink-50',
      isConnected: true 
    },
    { 
      id: 'google', 
      name: 'Google Workspace', 
      description: 'Sincronización de calendario', 
      icon: '🔵', 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50',
      isConnected: false 
    },
    { 
      id: 'whatsapp', 
      name: 'WhatsApp Business', 
      description: 'Envío de mensajes masivos', 
      icon: '💚', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      isConnected: false 
    },
    { 
      id: 'stripe', 
      name: 'Stripe', 
      description: 'Pagos y facturación', 
      icon: '💳', 
      color: 'text-violet-600', 
      bgColor: 'bg-violet-50',
      isConnected: true 
    }
  ]

  // ==================== IMPORT WIZARD HANDLERS ====================
  
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }
  
  const processFile = (file: File) => {
    if (file.type === 'text/csv' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setUploadedFile(file)
      
      // Initialize column mappings with mock data
      const initialMappings: ColumnMapping[] = mockCsvColumns.map(col => ({
        csvColumn: col.csv,
        crmField: '',
        sampleData: col.sample
      }))
      setColumnMappings(initialMappings)
      
      toast({
        title: 'Archivo cargado',
        description: `${file.name} listo para procesar`,
        variant: 'success'
      })
    } else {
      toast({
        title: 'Formato no válido',
        description: 'Solo se permiten archivos CSV o Excel',
        variant: 'destructive'
      })
    }
  }
  
  const handleMappingChange = (index: number, crmField: string) => {
    setColumnMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, crmField } : mapping
    ))
  }
  
  const startImport = async () => {
    if (!uploadedFile) return
    setIsImporting(true)
    setImportStep(3)
    setImportProgress(10)

    try {
      const apiFn = importType === 'clients' ? importApi.importClients
        : importType === 'contacts' ? importApi.importContacts
        : importType === 'inventory' ? importApi.importInventory
        : importType === 'opportunities' ? importApi.importOpportunities
        : importApi.importSales

      const res = await apiFn(uploadedFile)
      const jobId: string = res.data.jobId
      setImportJobId(jobId)
      setImportProgress(30)

      // Poll for job completion
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        try {
          const statusRes = await importApi.getStatus(jobId)
          const job = statusRes.data
          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(poll)
            setImportProgress(100)
            setImportResult({
              total: job.total_rows,
              success: job.success_rows,
              errors: job.error_rows,
              duplicates: 0
            })
            setImportErrors(job.errors || [])
            setIsImporting(false)
            toast({
              title: job.status === 'completed' ? 'Importación completada' : 'Importación con errores',
              description: `${job.success_rows} registros importados, ${job.error_rows} errores`,
              variant: job.status === 'completed' ? 'success' : 'default'
            })
          } else {
            // Still processing — animate progress toward 90%
            setImportProgress(prev => Math.min(90, prev + 10))
          }
        } catch {
          if (attempts > 30) {
            clearInterval(poll)
            setIsImporting(false)
            toast({ title: 'Error al verificar estado', variant: 'destructive' })
          }
        }
      }, 2000)
    } catch (err: any) {
      setIsImporting(false)
      setImportStep(2)
      toast({
        title: 'Error al iniciar importación',
        description: err.response?.data?.error || err.message,
        variant: 'destructive'
      })
    }
  }
  
  const resetImport = () => {
    setImportStep(1)
    setUploadedFile(null)
    setColumnMappings([])
    setImportProgress(0)
    setImportResult(null)
    setIsImporting(false)
    setImportJobId(null)
    setImportErrors([])
  }
  
  // ==================== API & WEBHOOK HANDLERS ====================
  
  const regenerateApiKey = () => {
    const newKey = 'sk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setApiKey(newKey)
    toast({
      title: 'API Key regenerada',
      description: 'Tu nueva clave ha sido generada. Guarda la anterior si la necesitas.',
      variant: 'success'
    })
  }
  
  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    toast({
      title: 'Copiado',
      description: 'API Key copiada al portapapeles',
      variant: 'success'
    })
  }
  
  const addWebhook = () => {
    if (!newWebhookUrl || !newWebhookName || selectedEvents.length === 0) {
      toast({
        title: 'Campos incompletos',
        description: 'Completa todos los campos para crear el webhook',
        variant: 'destructive'
      })
      return
    }
    
    const newWebhook: WebhookConfig = {
      id: Date.now().toString(),
      name: newWebhookName,
      url: newWebhookUrl,
      events: selectedEvents,
      isActive: true
    }
    
    setWebhooks(prev => [...prev, newWebhook])
    setNewWebhookUrl('')
    setNewWebhookName('')
    setSelectedEvents([])
    
    toast({
      title: 'Webhook creado',
      description: 'El webhook ha sido configurado exitosamente',
      variant: 'success'
    })
  }
  
  const toggleWebhook = (id: string) => {
    setWebhooks(prev => prev.map(w => 
      w.id === id ? { ...w, isActive: !w.isActive } : w
    ))
  }
  
  const deleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id))
    toast({
      title: 'Webhook eliminado',
      description: 'El webhook ha sido eliminado',
      variant: 'success'
    })
  }
  
  // ==================== WEB FORM HANDLERS ====================
  
  const generateFormCode = () => {
    const fields = []
    if (formFields.name) fields.push(`<input type="text" name="name" placeholder="Nombre" required>`)
    if (formFields.email) fields.push(`<input type="email" name="email" placeholder="Email" required>`)
    if (formFields.phone) fields.push(`<input type="tel" name="phone" placeholder="Teléfono">`)
    if (formFields.company) fields.push(`<input type="text" name="company" placeholder="Empresa">`)
    if (formFields.message) fields.push(`<textarea name="message" placeholder="Mensaje" rows="4"></textarea>`)
    
    const code = `<!-- Antü CRM Lead Form -->
<iframe 
  src="https://antucrm.com/forms/embed?tenant=${'tenant_id'}&form=${'form_id'}" 
  width="100%" 
  height="${300 + fields.length * 50}" 
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
></iframe>

<!-- O usa el código HTML directo: -->
<form action="https://antucrm.com/api/leads/capture" method="POST" style="max-width: 400px; font-family: sans-serif;">
  <h3 style="color: ${formColor}; margin-bottom: 20px;">${formTitle}</h3>
  ${fields.join('\n  ')}
  <button type="submit" style="background: ${formColor}; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; width: 100%; margin-top: 10px;">
    ${formSubmitText}
  </button>
</form>`
    
    setGeneratedCode(code)
  }
  
  const copyFormCode = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
    toast({
      title: 'Código copiado',
      description: 'El código del formulario ha sido copiado al portapapeles',
      variant: 'success'
    })
  }

  // ==================== RENDER ====================
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Importación e Integraciones</h1>
        <p className="text-slate-500 text-sm mt-1">
          Importa datos masivamente, conecta con otros sistemas y captura leads desde tu web
        </p>
      </div>
      
      <Tabs defaultValue="import" className="space-y-6">
        <TabsList className="border-b border-slate-200 w-full justify-start rounded-none bg-transparent p-0 flex-wrap h-auto gap-1">
          <TabsTrigger 
            value="import" 
            className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importación Masiva
          </TabsTrigger>
          <TabsTrigger 
            value="api"
            className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
          >
            <Key className="w-4 h-4 mr-2" />
            API y Webhooks
          </TabsTrigger>
          <TabsTrigger 
            value="forms"
            className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
          >
            <Globe className="w-4 h-4 mr-2" />
            Formularios Web
          </TabsTrigger>
        </TabsList>
        
        {/* ==================== IMPORT WIZARD TAB ==================== */}
        <TabsContent value="import" className="mt-6 space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                importStep >= 1 ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-500"
              )}>
                {importStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <div className={cn("w-16 h-1 rounded", importStep > 1 ? "bg-violet-600" : "bg-slate-200")} />
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                importStep >= 2 ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-500"
              )}>
                {importStep > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <div className={cn("w-16 h-1 rounded", importStep > 2 ? "bg-violet-600" : "bg-slate-200")} />
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                importStep >= 3 ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-500"
              )}>
                3
              </div>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <p className="text-sm text-slate-500">
              {importStep === 1 && 'Paso 1: Sube tu archivo CSV o Excel'}
              {importStep === 2 && 'Paso 2: Mapea las columnas con los campos del CRM'}
              {importStep === 3 && 'Paso 3: Procesando importación'}
            </p>
          </div>
          
          {/* STEP 1: Upload */}
          {importStep === 1 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Subir Archivo</CardTitle>
                <CardDescription>Selecciona el tipo de datos y sube tu archivo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Import Type Selection */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'clients', label: 'Clientes', icon: Building2 },
                    { value: 'contacts', label: 'Contactos', icon: User },
                    { value: 'opportunities', label: 'Oportunidades', icon: Briefcase },
                    { value: 'inventory', label: 'Inventario', icon: Database },
                    { value: 'sales', label: 'Historial Ventas (IA)', icon: Briefcase }
                  ].map((type) => (
                    <Button
                      key={type.value}
                      variant={importType === type.value ? 'default' : 'outline'}
                      onClick={() => setImportType(type.value as any)}
                      className={importType === type.value ? 'bg-violet-600' : 'border-slate-200'}
                    >
                      <type.icon className="w-4 h-4 mr-2" />
                      {type.label}
                    </Button>
                  ))}
                </div>
                
                {/* Drag & Drop Area */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",
                    isDragging 
                      ? "border-violet-500 bg-violet-50" 
                      : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-10 h-10 text-violet-600" />
                  </div>
                  <h4 className="font-medium text-slate-700 mb-2">
                    Arrastra y suelta tu archivo aquí
                  </h4>
                  <p className="text-sm text-slate-500 mb-4">
                    o haz clic para seleccionar un archivo
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileSpreadsheet className="w-4 h-4" />
                      CSV
                    </span>
                    <span className="flex items-center gap-1">
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel (.xlsx)
                    </span>
                  </div>
                </div>
                
                {/* Download Template */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    className="border-slate-200"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token')
                        const res = await fetch(`/api/import/template/${importType}`, {
                          headers: { Authorization: `Bearer ${token}` }
                        })
                        if (!res.ok) throw new Error('Error generando plantilla')
                        const blob = await res.blob()
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `plantilla_${importType}.xlsx`
                        a.click()
                        URL.revokeObjectURL(url)
                      } catch {
                        toast({ title: 'Error', description: 'No se pudo descargar la plantilla', variant: 'destructive' })
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar plantilla Excel — {importType === 'opportunities' ? 'oportunidades' : importType === 'sales' ? 'historial ventas' : importType === 'clients' ? 'clientes' : importType === 'contacts' ? 'contactos' : 'inventario'}
                  </Button>
                </div>
                
                {uploadedFile && (
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => setImportStep(2)}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      Continuar
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* STEP 2: Column Mapping */}
          {importStep === 2 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Mapeo de Datos</CardTitle>
                    <CardDescription>Empareja las columnas de tu archivo con los campos del CRM</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-violet-50 border-violet-200 text-violet-700">
                    {uploadedFile?.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Detección automática de columnas</p>
                    <p className="text-sm text-blue-700">
                      El sistema detecta automáticamente las columnas de tu archivo (nombre, email, teléfono, empresa, etc.) en español e inglés.
                      Haz clic en "Iniciar importación" cuando estés listo.
                    </p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Columna del archivo</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Campo del CRM</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Vista previa (primeras 3 filas)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columnMappings.map((mapping, index) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/80">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                              <span className="font-medium text-slate-700">{mapping.csvColumn}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Select 
                              value={mapping.crmField} 
                              onValueChange={(value) => handleMappingChange(index, value)}
                            >
                              <SelectTrigger className="w-56 bg-white">
                                <SelectValue placeholder="Seleccionar campo..." />
                              </SelectTrigger>
                              <SelectContent>
                                {crmFields.map((field) => (
                                  <SelectItem key={field.value} value={field.value}>
                                    <div className="flex items-center gap-2">
                                      <field.icon className="w-4 h-4" />
                                      {field.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {mapping.sampleData.map((sample, i) => (
                                <code key={i} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                  {sample}
                                </code>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setImportStep(1)}
                    className="border-slate-200"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>
                  <Button
                    onClick={startImport}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Iniciar importación
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* STEP 3: Progress & Results */}
          {importStep === 3 && (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-8">
                {!importResult ? (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto">
                      <RefreshCw className="w-10 h-10 text-violet-600 animate-spin" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 mb-2">Importando datos...</h4>
                      <p className="text-sm text-slate-500">Por favor no cierres esta ventana</p>
                    </div>
                    <div className="max-w-md mx-auto">
                      <Progress value={importProgress} className="h-2" />
                      <p className="text-sm text-slate-500 mt-2 text-center">{Math.round(importProgress)}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-10 h-10 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 mb-2">¡Importación completada!</h4>
                      <p className="text-sm text-slate-500">Tus datos han sido procesados exitosamente</p>
                    </div>
                    
                    {/* Results Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                      <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-sm text-slate-500">Total</p>
                        <p className="text-2xl font-bold text-slate-800">{importResult.total}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-4">
                        <p className="text-sm text-emerald-600">Exitosos</p>
                        <p className="text-2xl font-bold text-emerald-700">{importResult.success}</p>
                      </div>
                      <div className="bg-rose-50 rounded-xl p-4">
                        <p className="text-sm text-rose-600">Errores</p>
                        <p className="text-2xl font-bold text-rose-700">{importResult.errors}</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4">
                        <p className="text-sm text-amber-600">Duplicados</p>
                        <p className="text-2xl font-bold text-amber-700">{importResult.duplicates}</p>
                      </div>
                    </div>
                    
                    {importResult.errors > 0 && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 max-w-2xl mx-auto text-left">
                        <div className="flex items-start gap-3 mb-3">
                          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-rose-800 font-medium">Se encontraron errores</p>
                            <p className="text-sm text-rose-700">{importResult.errors} registros no pudieron ser importados.</p>
                          </div>
                        </div>
                        {importErrors.length > 0 && (
                          <ul className="space-y-1 max-h-40 overflow-y-auto">
                            {importErrors.slice(0, 10).map((e: any, i: number) => (
                              <li key={i} className="text-xs text-rose-700 bg-rose-100 rounded px-2 py-1">
                                Fila {e.row}: {e.error}
                              </li>
                            ))}
                            {importErrors.length > 10 && (
                              <li className="text-xs text-rose-500 px-2">...y {importErrors.length - 10} más</li>
                            )}
                          </ul>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-center gap-4">
                      <Button variant="outline" onClick={resetImport} className="border-slate-200">
                        <Upload className="w-4 h-4 mr-2" />
                        Importar más datos
                      </Button>
                      <Button className="bg-violet-600 hover:bg-violet-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Ver datos importados
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* ==================== API & WEBHOOKS TAB ==================== */}
        <TabsContent value="api" className="mt-6 space-y-6">
          {/* API Key Section */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="w-5 h-5 text-violet-500" />
                API Key
              </CardTitle>
              <CardDescription>Usa esta clave para autenticar tus peticiones a la API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <Label className="text-sm text-slate-600 mb-2 block">Tu API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      readOnly
                      className="bg-white font-mono text-sm pr-20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button variant="outline" onClick={copyApiKey} className="border-slate-200">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  No compartas esta clave. Si crees que fue comprometida, regenera una nueva.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={regenerateApiKey} className="border-slate-200">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generar nueva API Key
                </Button>
                <Button variant="outline" className="border-slate-200">
                  <FileJson className="w-4 h-4 mr-2" />
                  Ver documentación
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Webhooks Section */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Webhook className="w-5 h-5 text-violet-500" />
                Webhooks
              </CardTitle>
              <CardDescription>Recibe notificaciones en tiempo real en otros sistemas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing Webhooks */}
              {webhooks.length > 0 && (
                <div className="space-y-3">
                  {webhooks.map((webhook) => (
                    <div key={webhook.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-slate-800">{webhook.name}</p>
                          <Badge className={webhook.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500'}>
                            {webhook.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <code className="text-xs text-slate-500 block truncate">{webhook.url}</code>
                        <div className="flex gap-1 mt-2">
                          {webhook.events.map(event => (
                            <Badge key={event} variant="outline" className="text-xs bg-white">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Switch
                          checked={webhook.isActive}
                          onCheckedChange={() => toggleWebhook(webhook.id)}
                          className="data-[state=checked]:bg-violet-600"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteWebhook(webhook.id)}
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add New Webhook */}
              <div className="bg-violet-50 rounded-xl p-4 space-y-4">
                <h4 className="font-medium text-violet-900">Agregar nuevo webhook</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-violet-700">Nombre</Label>
                    <Input
                      value={newWebhookName}
                      onChange={(e) => setNewWebhookName(e.target.value)}
                      placeholder="Ej: Notificación ERP"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-violet-700">URL del webhook</Label>
                    <Input
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                      placeholder="https://mi-sistema.com/webhook"
                      className="bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-violet-700">Eventos a escuchar</Label>
                  <div className="flex flex-wrap gap-2">
                    {webhookEvents.map((event) => (
                      <label
                        key={event.value}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                          selectedEvents.includes(event.value)
                            ? "bg-violet-200 text-violet-800"
                            : "bg-white hover:bg-violet-100"
                        )}
                      >
                        <Checkbox
                          checked={selectedEvents.includes(event.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEvents([...selectedEvents, event.value])
                            } else {
                              setSelectedEvents(selectedEvents.filter(e => e !== event.value))
                            }
                          }}
                        />
                        <span className="text-sm">{event.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={addWebhook} className="bg-violet-600 hover:bg-violet-700">
                  <Webhook className="w-4 h-4 mr-2" />
                  Crear webhook
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Integrations Grid */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Puzzle className="w-5 h-5 text-violet-500" />
                Integraciones Nativas
              </CardTitle>
              <CardDescription>Conecta Antü CRM con tus herramientas favoritas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all hover:shadow-md",
                      integration.isConnected 
                        ? "border-emerald-200 bg-emerald-50/50" 
                        : "border-slate-200 bg-white hover:border-violet-200"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl", integration.bgColor)}>
                        {integration.icon}
                      </div>
                      {integration.isConnected ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Conectado
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline" className="border-slate-200 text-xs">
                          Conectar
                        </Button>
                      )}
                    </div>
                    <h4 className={cn("font-medium", integration.color)}>{integration.name}</h4>
                    <p className="text-sm text-slate-500">{integration.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* ==================== WEB FORMS TAB ==================== */}
        <TabsContent value="forms" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Builder */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="w-5 h-5 text-violet-500" />
                  Constructor de Formularios
                </CardTitle>
                <CardDescription>Personaliza los campos de tu formulario de captura</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Título del formulario</Label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej: Contáctanos"
                    className="bg-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Texto del botón</Label>
                  <Input
                    value={formSubmitText}
                    onChange={(e) => setFormSubmitText(e.target.value)}
                    placeholder="Ej: Enviar"
                    className="bg-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Color principal</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label>Campos del formulario</Label>
                  <div className="space-y-2">
                    {[
                      { key: 'name', label: 'Nombre', icon: User },
                      { key: 'email', label: 'Email', icon: Mail },
                      { key: 'phone', label: 'Teléfono', icon: Phone },
                      { key: 'company', label: 'Empresa', icon: Building2 },
                      { key: 'message', label: 'Mensaje', icon: FileSpreadsheet }
                    ].map((field) => (
                      <label
                        key={field.key}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border",
                          formFields[field.key as keyof typeof formFields]
                            ? "bg-violet-50 border-violet-200"
                            : "bg-white border-slate-200 hover:border-violet-200"
                        )}
                      >
                        <Checkbox
                          checked={formFields[field.key as keyof typeof formFields]}
                          onCheckedChange={(checked) => {
                            setFormFields(prev => ({ ...prev, [field.key]: checked }))
                          }}
                        />
                        <field.icon className={cn(
                          "w-5 h-5",
                          formFields[field.key as keyof typeof formFields] ? "text-violet-600" : "text-slate-400"
                        )} />
                        <span className={cn(
                          formFields[field.key as keyof typeof formFields] ? "text-violet-900" : "text-slate-600"
                        )}>
                          {field.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <Button onClick={generateFormCode} className="w-full bg-violet-600 hover:bg-violet-700">
                  <Code className="w-4 h-4 mr-2" />
                  Generar código
                </Button>
              </CardContent>
            </Card>
            
            {/* Generated Code */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Code className="w-5 h-5 text-violet-500" />
                  Código del Formulario
                </CardTitle>
                <CardDescription>Copia y pega este código en tu sitio web</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {generatedCode ? (
                  <>
                    <div className="relative">
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-x-auto max-h-96">
                        <code>{generatedCode}</code>
                      </pre>
                      <Button
                        size="sm"
                        onClick={copyFormCode}
                        className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white"
                      >
                        {copiedCode ? (
                          <><Check className="w-4 h-4 mr-1" /> Copiado</>
                        ) : (
                          <><Copy className="w-4 h-4 mr-1" /> Copiar</>
                        )}
                      </Button>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <Link2 className="w-4 h-4" />
                        ¿Cómo usarlo?
                      </h5>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Copia el código de arriba</li>
                        <li>Pega el iframe donde quieras mostrar el formulario</li>
                        <li>O usa el código HTML directo para más personalización</li>
                        <li>Los leads aparecerán automáticamente en tu CRM</li>
                      </ol>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Configura tu formulario y genera el código</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Form Preview */}
          {generatedCode && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Vista previa</CardTitle>
                <CardDescription>Así se verá tu formulario en tu sitio web</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="max-w-md mx-auto p-6 rounded-xl border border-slate-200"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  <h3 style={{ color: formColor, marginBottom: '20px', fontWeight: 600 }}>
                    {formTitle}
                  </h3>
                  <div className="space-y-3">
                    {formFields.name && (
                      <input
                        type="text"
                        placeholder="Nombre"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        disabled
                      />
                    )}
                    {formFields.email && (
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        disabled
                      />
                    )}
                    {formFields.phone && (
                      <input
                        type="tel"
                        placeholder="Teléfono"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        disabled
                      />
                    )}
                    {formFields.company && (
                      <input
                        type="text"
                        placeholder="Empresa"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        disabled
                      />
                    )}
                    {formFields.message && (
                      <textarea
                        placeholder="Mensaje"
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                        disabled
                      />
                    )}
                    <button
                      style={{ 
                        background: formColor, 
                        color: 'white', 
                        padding: '10px 20px', 
                        borderRadius: '6px',
                        width: '100%',
                        fontWeight: 500
                      }}
                      disabled
                    >
                      {formSubmitText}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
