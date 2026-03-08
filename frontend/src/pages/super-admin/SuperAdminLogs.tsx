import { useEffect, useState, useMemo } from 'react'
import { 
  FileText, 
  Search,
  Filter,
  Download,
  X,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Info,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Terminal,
  Building2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { superAdminApi } from '@/services/api'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  category: string
  message: string
  details?: string
  user_id?: string
  user_email?: string
  tenant_id?: string
  tenant_name?: string
  ip_address?: string
}

interface AuditEntry {
  id: string
  timestamp: string
  action: string
  entity_type: string
  entity_id: string
  user_id: string
  user_email: string
  tenant_name: string
  changes: Record<string, { old: any; new: any }>
  ip_address: string
}

const levelConfig = {
  info: { label: 'Info', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-100', icon: Info },
  warning: { label: 'Warning', bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-100', icon: AlertTriangle },
  error: { label: 'Error', bgColor: 'bg-rose-50', textColor: 'text-rose-600', borderColor: 'border-rose-100', icon: AlertCircle },
  debug: { label: 'Debug', bgColor: 'bg-slate-50', textColor: 'text-slate-500', borderColor: 'border-slate-200', icon: Terminal }
} as const

const actionConfig = {
  CREATE: { label: 'Crear', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  UPDATE: { label: 'Actualizar', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  DELETE: { label: 'Eliminar', bgColor: 'bg-rose-50', textColor: 'text-rose-600' },
  LOGIN: { label: 'Login', bgColor: 'bg-violet-50', textColor: 'text-violet-600' },
  LOGOUT: { label: 'Logout', bgColor: 'bg-slate-50', textColor: 'text-slate-500' }
} as const

export default function SuperAdminLogs() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('system')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)

      const [systemRes, auditRes] = await Promise.all([
        superAdminApi.getSystemLogs(),
        superAdminApi.getAuditLogs()
      ])

      setLogs(systemRes.data.logs || [])
      setAuditLogs(auditRes.data.logs || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudieron cargar los logs',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesLevel = levelFilter === 'all' || log.level === levelFilter
      const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter
      
      return matchesSearch && matchesLevel && matchesCategory
    })
  }, [logs, searchQuery, levelFilter, categoryFilter])

  const clearFilters = () => {
    setSearchQuery('')
    setLevelFilter('all')
    setCategoryFilter('all')
  }

  const getLevelBadge = (level: string) => {
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.info
    const Icon = config.icon
    return (
      <Badge 
        variant="outline"
        className={cn("flex items-center gap-1 font-medium border", config.bgColor, config.textColor, config.borderColor)}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getActionBadge = (action: string) => {
    const config = actionConfig[action as keyof typeof actionConfig] || { label: action, bgColor: 'bg-slate-50', textColor: 'text-slate-500' }
    return (
      <Badge className={cn("border-0", config.bgColor, config.textColor)}>
        {config.label}
      </Badge>
    )
  }

  const toggleExpand = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId)
  }

  const hasActiveFilters = searchQuery || levelFilter !== 'all' || categoryFilter !== 'all'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Logs y Auditoría</h1>
          <p className="text-slate-500 text-sm mt-1">Registro de actividad del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} className="border-slate-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" className="border-slate-200">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Logs</p>
                <p className="text-2xl font-bold text-slate-800">{logs.length}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-rose-100 bg-rose-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-rose-600">Errores</p>
                <p className="text-2xl font-bold text-rose-700">{logs.filter(l => l.level === 'error').length}</p>
              </div>
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100 bg-amber-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">Advertencias</p>
                <p className="text-2xl font-bold text-amber-700">{logs.filter(l => l.level === 'warning').length}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-blue-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Eventos Audit</p>
                <p className="text-2xl font-bold text-blue-700">{auditLogs.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-b border-slate-200 w-full justify-start rounded-none bg-transparent p-0">
          <TabsTrigger 
            value="system" 
            className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
          >
            <Terminal className="w-4 h-4 mr-2" />
            Logs del Sistema
          </TabsTrigger>
          <TabsTrigger 
            value="audit"
            className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
          >
            <FileText className="w-4 h-4 mr-2" />
            Auditoría
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="mt-6 space-y-4">
          {/* Filters */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar en logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-[130px] bg-white">
                      <Filter className="w-4 h-4 mr-2 text-slate-400" />
                      <SelectValue placeholder="Nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[150px] bg-white">
                      <FileText className="w-4 h-4 mr-2 text-slate-400" />
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="auth">Autenticación</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="database">Base de Datos</SelectItem>
                      <SelectItem value="payment">Pagos</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
                      <X className="w-4 h-4 mr-1" />
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs List */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full mx-auto"></div>
                  <p className="mt-4 text-slate-500">Cargando logs...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No se encontraron logs</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                      <div 
                        className="flex items-start gap-4 cursor-pointer"
                        onClick={() => toggleExpand(log.id)}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getLevelBadge(log.level)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-800">{log.message}</span>
                            <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200">{log.category}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(log.timestamp).toLocaleString('es-DO')}
                            </span>
                            {log.tenant_name && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                {log.tenant_name}
                              </span>
                            )}
                            {log.ip_address && (
                              <span className="font-mono text-xs">{log.ip_address}</span>
                            )}
                          </div>
                        </div>
                        {expandedLog === log.id ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      
                      {expandedLog === log.id && log.details && (
                        <div className="mt-3 ml-20 p-3 bg-slate-100 rounded-lg">
                          <p className="text-sm text-slate-600 font-mono whitespace-pre-wrap">{log.details}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Registro de Auditoría</CardTitle>
              <CardDescription>Historial de cambios realizados en el sistema</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full mx-auto"></div>
                  <p className="mt-4 text-slate-500">Cargando auditoría...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No hay registros de auditoría</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Fecha</th>
                        <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Usuario</th>
                        <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Acción</th>
                        <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Entidad</th>
                        <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Empresa</th>
                        <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Cambios</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((audit) => (
                        <tr key={audit.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                          <td className="py-3.5 px-4 text-sm text-slate-500">
                            {new Date(audit.timestamp).toLocaleString('es-DO')}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-700">{audit.user_email}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">{getActionBadge(audit.action)}</td>
                          <td className="py-3.5 px-4">
                            <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200">
                              {audit.entity_type}
                            </Badge>
                            <span className="text-xs text-slate-400 ml-1 font-mono">#{audit.entity_id.slice(0, 6)}</span>
                          </td>
                          <td className="py-3.5 px-4 text-sm text-slate-600">{audit.tenant_name}</td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              {Object.entries(audit.changes).map(([key, value]) => (
                                <div key={key} className="text-xs">
                                  <span className="font-medium text-slate-600">{key}:</span>{' '}
                                  <span className="text-rose-500 line-through">{value.old?.toString() || 'null'}</span>
                                  {' → '}
                                  <span className="text-emerald-600">{value.new?.toString() || 'null'}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
