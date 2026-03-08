import { useState, useEffect } from 'react'
import {
  User,
  Shield,
  Users,
  Upload,
  Globe,
  Lock,
  Key,
  AlertCircle,
  Check,
  X,
  Building2,
  Package,
  TrendingUp,
  UserCheck,
  Settings2,
  DollarSign,
  FileSpreadsheet,
  Download,
  ArrowRightLeft,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Trash2,
  Puzzle,
  Database,
  Plus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import ImportIntegrations from './settings/ImportIntegrations'
import { usersApi, authApi, inventoryApi, tenantSettingsApi } from '@/services/api'
import ERPIntegrations from './settings/ERPIntegrations'

// Mock user roles - in production this comes from auth store
const USER_ROLES = {
  STANDARD: 'user',
  MANAGER: 'manager',
  ADMIN: 'admin'
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  avatar?: string
  leadsCount: number
  opportunitiesCount: number
  accountsCount: number
}

interface Product {
  id: string
  name: string
  sku: string
  price: number
  currency: string
  category: string
}

export default function Settings() {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const { isDark, toggleDark } = useDarkMode()
  const { lang, setLang, t } = useLanguage()

  // Determine user role (mock - in production comes from auth)
  const userRole = user?.role || USER_ROLES.ADMIN // Default to admin for development
  const isAdmin = userRole === USER_ROLES.ADMIN
  const isManager = userRole === USER_ROLES.MANAGER
  const isStandard = userRole === USER_ROLES.STANDARD

  // Language state synced with global context
  const [language, setLanguage] = useState(lang)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  // Company / fiscal settings
  const [companySettings, setCompanySettings] = useState({ fiscal_year_start: 1, currency: 'DOP', timezone: 'America/Santo_Domingo' })
  const [savingCompany, setSavingCompany] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      tenantSettingsApi.get().then(r => {
        setCompanySettings({
          fiscal_year_start: r.data.fiscal_year_start || 1,
          currency: r.data.currency || 'DOP',
          timezone: r.data.timezone || 'America/Santo_Domingo',
        })
      }).catch(() => {})
    }
  }, [isAdmin])

  const saveCompanySettings = async () => {
    setSavingCompany(true)
    try {
      await tenantSettingsApi.update(companySettings)
      toast({ title: 'Configuración guardada', variant: 'success' })
    } catch {
      toast({ title: 'Error al guardar', variant: 'destructive' })
    } finally {
      setSavingCompany(false)
    }
  }

  // State for Manager Permissions (controlled by Admin)
  const [managerPermissions, setManagerPermissions] = useState({
    canEditProductPrices: true,
    canCreateUsers: false,
    canDeleteRecords: false,
    canViewReports: true
  })

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamLoading, setTeamLoading] = useState(false)

  // Create user dialog
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [userForm, setUserForm] = useState({ email: '', password: '', first_name: '', last_name: '', role: 'sales' })
  const [isSavingUser, setIsSavingUser] = useState(false)

  const loadTeam = () => {
    setTeamLoading(true)
    usersApi.getAll()
      .then(res => {
        const users = res.data?.users || res.data || []
        setTeamMembers(users.map((u: any) => ({
          id: u.id,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
          email: u.email,
          role: u.role,
          isActive: u.is_active !== false,
          leadsCount: 0,
          opportunitiesCount: 0,
          accountsCount: 0,
        })))
      })
      .catch(() => {})
      .finally(() => setTeamLoading(false))
  }

  useEffect(() => {
    if (isManager || isAdmin) {
      loadTeam()
    }
  }, [isManager, isAdmin])

  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)

  useEffect(() => {
    if (isManager || isAdmin) {
      setProductsLoading(true)
      inventoryApi.getProducts({ limit: 100 })
        .then(res => {
          const rows = res.data?.data || res.data || []
          setProducts(rows.map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku || '—',
            price: parseFloat(p.price) || 0,
            currency: p.currency || 'USD',
            category: p.category || '—',
          })))
        })
        .catch(() => {})
        .finally(() => setProductsLoading(false))
    }
  }, [isManager, isAdmin])
  
  // Reassignment state
  const [reassignType, setReassignType] = useState('leads')
  const [fromUser, setFromUser] = useState('')
  const [toUser, setToUser] = useState('')
  
  // Data Import state
  const [importType, setImportType] = useState('clients')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  
  // Editable product prices (only if manager has permission)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Las contraseñas no coinciden', variant: 'destructive' })
      return
    }
    if (newPassword.length < 8) {
      toast({ title: 'Error', description: 'La nueva contraseña debe tener al menos 8 caracteres', variant: 'destructive' })
      return
    }
    setIsSavingPassword(true)
    try {
      await authApi.changePassword(currentPassword, newPassword)
      toast({ title: 'Contraseña actualizada', description: 'Tu contraseña ha sido cambiada exitosamente', variant: 'success' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo cambiar la contraseña', variant: 'destructive' })
    } finally {
      setIsSavingPassword(false)
    }
  }
  
  const toggleUserStatus = async (userId: string) => {
    if (!isAdmin) return
    const member = teamMembers.find(m => m.id === userId)
    if (!member) return
    const newActive = !member.isActive
    try {
      await usersApi.update(userId, { is_active: newActive })
      setTeamMembers(prev => prev.map(m => m.id === userId ? { ...m, isActive: newActive } : m))
      toast({
        title: newActive ? 'Usuario activado' : 'Usuario desactivado',
        description: `${member.name} ha sido ${newActive ? 'activado' : 'desactivado'}`,
        variant: 'success'
      })
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar el usuario', variant: 'destructive' })
    }
  }

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!isAdmin) return
    if (!confirm(`¿Eliminar al usuario ${name}? Esta acción no se puede deshacer.`)) return
    try {
      await usersApi.delete(userId)
      setTeamMembers(prev => prev.filter(m => m.id !== userId))
      toast({ title: 'Usuario eliminado', description: `${name} ha sido eliminado`, variant: 'success' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo eliminar el usuario', variant: 'destructive' })
    }
  }

  const handleCreateUser = async () => {
    if (!userForm.email || !userForm.password || !userForm.first_name || !userForm.last_name) {
      toast({ title: 'Error', description: 'Todos los campos son requeridos', variant: 'destructive' })
      return
    }
    setIsSavingUser(true)
    try {
      await usersApi.create(userForm)
      toast({ title: 'Usuario creado', description: `${userForm.first_name} ${userForm.last_name} ha sido agregado al equipo`, variant: 'success' })
      setIsCreateUserOpen(false)
      setUserForm({ email: '', password: '', first_name: '', last_name: '', role: 'sales' })
      loadTeam()
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo crear el usuario', variant: 'destructive' })
    } finally {
      setIsSavingUser(false)
    }
  }
  
  const [isReassigning, setIsReassigning] = useState(false)

  const handleReassign = async () => {
    if (!fromUser || !toUser) {
      toast({ title: 'Error', description: 'Selecciona ambos usuarios para la reasignación', variant: 'destructive' })
      return
    }
    setIsReassigning(true)
    try {
      await usersApi.reassign({ from_user_id: fromUser, to_user_id: toUser, type: reassignType })
      toast({ title: 'Reasignación completada', description: `Los registros han sido transferidos exitosamente`, variant: 'success' })
      setFromUser('')
      setToUser('')
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'No se pudo completar la reasignación', variant: 'destructive' })
    } finally {
      setIsReassigning(false)
    }
  }
  
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'text/csv' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setUploadedFile(file)
        toast({
          title: 'Archivo cargado',
          description: `${file.name} listo para importar`,
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
  }
  
  const handleImport = () => {
    if (!uploadedFile) {
      toast({
        title: 'Error',
        description: 'Selecciona un archivo para importar',
        variant: 'destructive'
      })
      return
    }
    
    toast({
      title: 'Importando datos',
      description: `Procesando ${uploadedFile.name}...`,
    })
    
    // Simulate import
    setTimeout(() => {
      toast({
        title: 'Importación completada',
        description: `Los ${importType} han sido importados exitosamente`,
        variant: 'success'
      })
      setUploadedFile(null)
    }, 2000)
  }
  
  const handleSaveProductPrice = (productId: string) => {
    if (!managerPermissions.canEditProductPrices && !isAdmin) {
      toast({
        title: 'Sin permisos',
        description: 'No tienes permiso para editar precios. Contacta al administrador.',
        variant: 'destructive'
      })
      return
    }
    
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, price: parseFloat(editPrice) } : p
    ))
    
    setEditingProduct(null)
    setEditPrice('')
    
    toast({
      title: 'Precio actualizado',
      description: 'El precio del producto ha sido actualizado',
      variant: 'success'
    })
  }
  
  const getAvailableTabs = () => {
    const tabs = ['profile']
    if (isManager || isAdmin) tabs.push('team')
    if (isAdmin) tabs.push('system')
    return tabs
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Configuraciones</h1>
        <p className="text-slate-500 text-sm mt-1">
          {isAdmin && 'Panel de control completo del sistema'}
          {isManager && 'Gestión de equipo y configuraciones'}
          {isStandard && 'Preferencias de tu cuenta'}
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="border-b border-slate-200 w-full justify-start rounded-none bg-transparent p-0 flex-wrap h-auto gap-1">
          <TabsTrigger 
            value="profile" 
            className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
          >
            <User className="w-4 h-4 mr-2" />
            Mi Perfil
          </TabsTrigger>
          
          {(isManager || isAdmin) && (
            <TabsTrigger 
              value="team"
              className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
            >
              <Users className="w-4 h-4 mr-2" />
              Gestión de Equipo
            </TabsTrigger>
          )}
          
          {isAdmin && (
            <>
              <TabsTrigger 
                value="system"
                className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Herramientas de Sistema
              </TabsTrigger>
              <TabsTrigger
                value="integrations"
                className="rounded-lg border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none px-4 py-2"
              >
                <Puzzle className="w-4 h-4 mr-2" />
                Integraciones ERP
              </TabsTrigger>
            </>
          )}
        </TabsList>
        
        {/* PROFILE TAB - Available to all users */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Language Settings */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="w-5 h-5 text-violet-500" />
                  {t('Idioma')}
                </CardTitle>
                <CardDescription>{t('Selecciona el idioma de la interfaz')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('Idioma del sistema')}</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder={t('Seleccionar idioma')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dark mode toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{isDark ? '🌙' : '☀️'}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {isDark ? t('Tema Oscuro') : t('Tema Claro')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isDark ? t('Cambia a modo claro') : t('Cambia a modo oscuro')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isDark}
                    onCheckedChange={toggleDark}
                    className="data-[state=checked]:bg-violet-600"
                  />
                </div>

                <Button
                  onClick={() => {
                    setLang(language as 'es' | 'en')
                    toast({
                      title: language === 'en' ? 'Preferences saved' : 'Preferencias guardadas',
                      description: language === 'en'
                        ? 'Language and theme updated successfully'
                        : 'Idioma y tema actualizados correctamente',
                      variant: 'success'
                    })
                  }}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t('Guardar')}
                </Button>
              </CardContent>
            </Card>
            
            {/* Security - Password Change */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lock className="w-5 h-5 text-violet-500" />
                  Seguridad
                </CardTitle>
                <CardDescription>Cambia tu contraseña de acceso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="bg-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="bg-white"
                  />
                </div>
                
                <Button
                  onClick={handlePasswordChange}
                  disabled={!currentPassword || !newPassword || !confirmPassword || isSavingPassword}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {isSavingPassword ? 'Guardando...' : 'Cambiar contraseña'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* TEAM TAB - Manager and Admin only */}
        {(isManager || isAdmin) && (
          <TabsContent value="team" className="mt-6 space-y-6">
            {/* Team Management */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="w-5 h-5 text-violet-500" />
                      Gestión de Usuarios
                    </CardTitle>
                    <CardDescription>Administra los miembros del equipo</CardDescription>
                  </div>
                  {isAdmin && (
                    <Button onClick={() => setIsCreateUserOpen(true)} className="bg-violet-600 hover:bg-violet-700" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo usuario
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {teamLoading ? (
                  <p className="text-sm text-slate-400 text-center py-8">Cargando usuarios...</p>
                ) : teamMembers.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No hay usuarios en el equipo</p>
                ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Usuario</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Rol</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-600 text-sm">Estado</th>
                        {isAdmin && <th className="text-right py-3 px-4 font-medium text-slate-600 text-sm">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((member) => (
                        <tr key={member.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-violet-600">
                                  {member.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-slate-800 text-sm">{member.name}</p>
                                <p className="text-xs text-slate-400">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={cn(
                              "text-xs",
                              member.role === 'admin' ? "bg-violet-50 text-violet-700 border-violet-200" :
                              member.role === 'manager' ? "bg-blue-50 text-blue-700 border-blue-200" :
                              "bg-slate-50 border-slate-200 text-slate-600"
                            )}>
                              {member.role === 'admin' ? 'Admin' : member.role === 'manager' ? 'Gerente' : 'Vendedor'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isAdmin ? (
                              <button
                                onClick={() => toggleUserStatus(member.id)}
                                title={member.isActive ? 'Desactivar' : 'Activar'}
                                className={cn(
                                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
                                  member.isActive ? "bg-emerald-500" : "bg-slate-200"
                                )}
                              >
                                <span className={cn(
                                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                  member.isActive ? "translate-x-6" : "translate-x-1"
                                )} />
                              </button>
                            ) : (
                              <Badge variant="outline" className={member.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}>
                                {member.isActive ? 'Activo' : 'Inactivo'}
                              </Badge>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(member.id, member.name)}
                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </CardContent>
            </Card>
            
            {/* Portfolio Reassignment */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowRightLeft className="w-5 h-5 text-violet-500" />
                  Reasignación de Cartera
                </CardTitle>
                <CardDescription>Transfiere la propiedad de registros entre vendedores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Tipo de registro</Label>
                      <Select value={reassignType} onValueChange={setReassignType}>
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="leads">Leads (Prospectos)</SelectItem>
                          <SelectItem value="opportunities">Oportunidades</SelectItem>
                          <SelectItem value="accounts">Cuentas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>De (Vendedor actual)</Label>
                      <Select value={fromUser} onValueChange={setFromUser}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.filter(m => m.isActive).map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>A (Nuevo vendedor)</Label>
                      <Select value={toUser} onValueChange={setToUser}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.filter(m => m.isActive && m.id !== fromUser).map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      onClick={handleReassign}
                      disabled={!fromUser || !toUser || isReassigning}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                      {isReassigning ? 'Reasignando...' : 'Reasignar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Product Prices - Only if manager has permission */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="w-5 h-5 text-violet-500" />
                      Gestión de Precios - Productos
                    </CardTitle>
                    <CardDescription>Edita los precios de los productos del catálogo</CardDescription>
                  </div>
                  {!managerPermissions.canEditProductPrices && !isAdmin && (
                    <Badge className="bg-amber-50 text-amber-600 border-amber-200">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Solo lectura
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <p className="text-sm text-slate-400 text-center py-8">Cargando productos...</p>
                ) : !managerPermissions.canEditProductPrices && !isAdmin ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <h4 className="font-medium text-amber-900 mb-1">Sin permisos de edición</h4>
                    <p className="text-sm text-amber-700">
                      No tienes permiso para modificar precios. Contacta al administrador para solicitar acceso.
                    </p>
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No hay productos en el catálogo. Agrégalos desde el módulo de Inventario.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Producto</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">SKU</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Categoría</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-600 text-sm">Precio</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-600 text-sm">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                            <td className="py-3 px-4">
                              <p className="font-medium text-slate-800 text-sm">{product.name}</p>
                            </td>
                            <td className="py-3 px-4">
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                {product.sku}
                              </code>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="bg-slate-50 border-slate-200">
                                {product.category}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {editingProduct === product.id ? (
                                <div className="flex items-center justify-end gap-2">
                                  <Input
                                    type="number"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    className="w-24 text-right bg-white"
                                    autoFocus
                                  />
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleSaveProductPrice(product.id)}
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => { setEditingProduct(null); setEditPrice('') }}
                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="font-medium text-slate-800">
                                  ${product.price.toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {editingProduct !== product.id && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => { setEditingProduct(product.id); setEditPrice(product.price.toString()) }}
                                  className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                                >
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  Editar
                                </Button>
                              )}
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
        )}
        
        {/* SYSTEM TAB - Admin only */}
        {isAdmin && (
          <TabsContent value="system" className="mt-6 space-y-6">
            {/* Company / Fiscal Year Settings */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="w-5 h-5 text-indigo-500" />
                  Configuración de la Empresa
                </CardTitle>
                <CardDescription>Año fiscal, moneda y zona horaria para reportes y métricas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-1 block">Inicio del Año Fiscal</Label>
                    <Select
                      value={String(companySettings.fiscal_year_start)}
                      onValueChange={v => setCompanySettings(prev => ({ ...prev, fiscal_year_start: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-400 mt-1">Mes en que inicia el año fiscal</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-1 block">Moneda</Label>
                    <Select
                      value={companySettings.currency}
                      onValueChange={v => setCompanySettings(prev => ({ ...prev, currency: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOP">DOP — Peso Dominicano</SelectItem>
                        <SelectItem value="USD">USD — Dólar Americano</SelectItem>
                        <SelectItem value="EUR">EUR — Euro</SelectItem>
                        <SelectItem value="COP">COP — Peso Colombiano</SelectItem>
                        <SelectItem value="MXN">MXN — Peso Mexicano</SelectItem>
                        <SelectItem value="ARS">ARS — Peso Argentino</SelectItem>
                        <SelectItem value="CLP">CLP — Peso Chileno</SelectItem>
                        <SelectItem value="PEN">PEN — Sol Peruano</SelectItem>
                        <SelectItem value="BRL">BRL — Real Brasileño</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-1 block">Zona Horaria</Label>
                    <Select
                      value={companySettings.timezone}
                      onValueChange={v => setCompanySettings(prev => ({ ...prev, timezone: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Santo_Domingo">América/Santo Domingo (UTC-4)</SelectItem>
                        <SelectItem value="America/New_York">América/Nueva York (UTC-5/-4)</SelectItem>
                        <SelectItem value="America/Chicago">América/Chicago (UTC-6/-5)</SelectItem>
                        <SelectItem value="America/Mexico_City">América/Ciudad de México (UTC-6/-5)</SelectItem>
                        <SelectItem value="America/Bogota">América/Bogotá (UTC-5)</SelectItem>
                        <SelectItem value="America/Lima">América/Lima (UTC-5)</SelectItem>
                        <SelectItem value="America/Santiago">América/Santiago (UTC-4/-3)</SelectItem>
                        <SelectItem value="America/Buenos_Aires">América/Buenos Aires (UTC-3)</SelectItem>
                        <SelectItem value="America/Sao_Paulo">América/São Paulo (UTC-3/-2)</SelectItem>
                        <SelectItem value="Europe/Madrid">Europa/Madrid (UTC+1/+2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={saveCompanySettings} disabled={savingCompany} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    <Save className="w-4 h-4 mr-1.5" />
                    {savingCompany ? 'Guardando...' : 'Guardar configuración'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Manager Permissions Control */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="w-5 h-5 text-violet-500" />
                  Control de Permisos de Gerentes
                </CardTitle>
                <CardDescription>Activa o desactiva permisos especiales para los gerentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Modificar precios de Productos</p>
                        <p className="text-sm text-slate-500">Permite a los gerentes editar precios en el catálogo</p>
                      </div>
                    </div>
                    <Switch
                      checked={managerPermissions.canEditProductPrices}
                      onCheckedChange={(checked) => {
                        setManagerPermissions(prev => ({ ...prev, canEditProductPrices: checked }))
                        toast({
                          title: checked ? 'Permiso activado' : 'Permiso desactivado',
                          description: `Los gerentes ${checked ? 'ahora pueden' : 'ya no pueden'} editar precios`,
                          variant: 'success'
                        })
                      }}
                      className="data-[state=checked]:bg-violet-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Crear nuevos usuarios</p>
                        <p className="text-sm text-slate-500">Permite a los gerentes agregar miembros al equipo</p>
                      </div>
                    </div>
                    <Switch
                      checked={managerPermissions.canCreateUsers}
                      onCheckedChange={(checked) => {
                        setManagerPermissions(prev => ({ ...prev, canCreateUsers: checked }))
                        toast({
                          title: checked ? 'Permiso activado' : 'Permiso desactivado',
                          description: `Los gerentes ${checked ? 'ahora pueden' : 'ya no pueden'} crear usuarios`,
                          variant: 'success'
                        })
                      }}
                      className="data-[state=checked]:bg-violet-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Eliminar registros</p>
                        <p className="text-sm text-slate-500">Permite a los gerentes eliminar clientes, oportunidades, etc.</p>
                      </div>
                    </div>
                    <Switch
                      checked={managerPermissions.canDeleteRecords}
                      onCheckedChange={(checked) => {
                        setManagerPermissions(prev => ({ ...prev, canDeleteRecords: checked }))
                        toast({
                          title: checked ? 'Permiso activado' : 'Permiso desactivado',
                          description: `Los gerentes ${checked ? 'ahora pueden' : 'ya no pueden'} eliminar registros`,
                          variant: 'success'
                        })
                      }}
                      className="data-[state=checked]:bg-violet-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Ver reportes avanzados</p>
                        <p className="text-sm text-slate-500">Acceso a métricas y análisis detallados del equipo</p>
                      </div>
                    </div>
                    <Switch
                      checked={managerPermissions.canViewReports}
                      onCheckedChange={(checked) => {
                        setManagerPermissions(prev => ({ ...prev, canViewReports: checked }))
                        toast({
                          title: checked ? 'Permiso activado' : 'Permiso desactivado',
                          description: `Los gerentes ${checked ? 'ahora pueden' : 'ya no pueden'} ver reportes`,
                          variant: 'success'
                        })
                      }}
                      className="data-[state=checked]:bg-violet-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Bulk Data Import */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="w-5 h-5 text-violet-500" />
                  Carga Masiva de Datos
                </CardTitle>
                <CardDescription>Importa datos masivamente desde archivos CSV o Excel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4 flex-wrap">
                  <Button
                    variant={importType === 'clients' ? 'default' : 'outline'}
                    onClick={() => setImportType('clients')}
                    className={importType === 'clients' ? 'bg-violet-600' : 'border-slate-200'}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Clientes
                  </Button>
                  <Button
                    variant={importType === 'opportunities' ? 'default' : 'outline'}
                    onClick={() => setImportType('opportunities')}
                    className={importType === 'opportunities' ? 'bg-violet-600' : 'border-slate-200'}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Oportunidades
                  </Button>
                  <Button
                    variant={importType === 'products' ? 'default' : 'outline'}
                    onClick={() => setImportType('products')}
                    className={importType === 'products' ? 'bg-violet-600' : 'border-slate-200'}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Productos
                  </Button>
                </div>
                
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-all",
                    isDragging 
                      ? "border-violet-500 bg-violet-50" 
                      : "border-slate-300 bg-slate-50 hover:border-slate-400"
                  )}
                >
                  {uploadedFile ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{uploadedFile.name}</p>
                        <p className="text-sm text-slate-500">
                          {(uploadedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setUploadedFile(null)}
                        className="border-slate-200"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">
                          Arrastra y suelta tu archivo aquí
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          o haz clic para seleccionar un archivo
                        </p>
                      </div>
                      <p className="text-xs text-slate-400">
                        Formatos soportados: CSV, XLSX, XLS
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <Button variant="outline" className="border-slate-200">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar plantilla
                  </Button>
                  <Button 
                    onClick={handleImport}
                    disabled={!uploadedFile}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Importar {importType === 'clients' ? 'clientes' : importType === 'opportunities' ? 'oportunidades' : 'productos'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {/* INTEGRATIONS TAB - Admin only */}
        {isAdmin && (
          <TabsContent value="integrations" className="mt-6 space-y-6">
            <ERPIntegrations />
            <ImportIntegrations />
          </TabsContent>
        )}
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Juan"
                  value={userForm.first_name}
                  onChange={(e) => setUserForm(p => ({ ...p, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Apellido *</Label>
                <Input
                  placeholder="Pérez"
                  value={userForm.last_name}
                  onChange={(e) => setUserForm(p => ({ ...p, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="juan@empresa.com"
                value={userForm.email}
                onChange={(e) => setUserForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña temporal *</Label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={userForm.password}
                onChange={(e) => setUserForm(p => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={userForm.role} onValueChange={(v) => setUserForm(p => ({ ...p, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Vendedor</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={isSavingUser} className="bg-violet-600 hover:bg-violet-700">
              {isSavingUser ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
