import { useEffect, useState, useMemo } from 'react'
import { 
  Users, 
  Search,
  Filter,
  Download,
  X,
  Mail,
  Building2,
  Calendar,
  MoreHorizontal,
  UserCheck,
  UserX,
  Shield,
  Crown
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { superAdminApi } from '@/services/api'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface GlobalUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  tenant_id: string
  tenant_name: string
  last_login: string
  created_at: string
  avatar_url?: string
}

interface Tenant {
  id: string
  name: string
}

const roleConfig = {
  superadmin: { label: 'Super Admin', bgColor: 'bg-violet-50', textColor: 'text-violet-600', icon: Crown },
  admin: { label: 'Admin', bgColor: 'bg-blue-50', textColor: 'text-blue-600', icon: Shield },
  manager: { label: 'Manager', bgColor: 'bg-amber-50', textColor: 'text-amber-600', icon: UserCheck },
  user: { label: 'Usuario', bgColor: 'bg-slate-50', textColor: 'text-slate-600', icon: Users }
} as const

export default function SuperAdminGlobalUsers() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [users, setUsers] = useState<GlobalUser[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tenantFilter, setTenantFilter] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)

      const [usersRes, tenantsRes] = await Promise.all([
        superAdminApi.getGlobalUsers(),
        superAdminApi.getTenants()
      ])

      setUsers(usersRes.data.users || [])
      setTenants((tenantsRes.data || []).map((t: any) => ({ id: t.id, name: t.name })))
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudieron cargar los datos',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active)
      const matchesTenant = tenantFilter === 'all' || user.tenant_id === tenantFilter
      
      return matchesSearch && matchesRole && matchesStatus && matchesTenant
    })
  }, [users, searchQuery, roleFilter, statusFilter, tenantFilter])

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role === 'admin' || u.role === 'superadmin').length,
    inactive: users.filter(u => !u.is_active).length
  }), [users])

  const clearFilters = () => {
    setSearchQuery('')
    setRoleFilter('all')
    setStatusFilter('all')
    setTenantFilter('all')
  }

  const getRoleBadge = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user
    const Icon = config.icon
    return (
      <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg w-fit", config.bgColor)}>
        <Icon className={cn("w-3.5 h-3.5", config.textColor)} />
        <span className={cn("text-xs font-medium", config.textColor)}>{config.label}</span>
      </div>
    )
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const handleToggleStatus = async (user: GlobalUser) => {
    toast({
      title: 'Info',
      description: `Funcionalidad en desarrollo - ${user.is_active ? 'Desactivar' : 'Activar'} usuario`,
    })
  }

  const hasActiveFilters = searchQuery || roleFilter !== 'all' || statusFilter !== 'all' || tenantFilter !== 'all'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Usuarios Globales</h1>
          <p className="text-slate-500 text-sm mt-1">Lista maestra de todos los usuarios del sistema</p>
        </div>
        <Button variant="outline" className="border-slate-200">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Usuarios</p>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 bg-emerald-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600">Activos</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-100 bg-violet-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600">Administradores</p>
                <p className="text-2xl font-bold text-violet-700">{stats.admins}</p>
              </div>
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-rose-100 bg-rose-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-rose-600">Inactivos</p>
                <p className="text-2xl font-bold text-rose-700">{stats.inactive}</p>
              </div>
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <UserX className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] bg-white">
                  <Shield className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-white">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                  <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las empresas</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                  ))}
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

      {/* Users Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full mx-auto"></div>
              <p className="mt-4 text-slate-500">Cargando usuarios...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">
                {users.length === 0 ? 'No hay usuarios registrados' : 'No se encontraron resultados'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Usuario</th>
                    <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Empresa</th>
                    <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Rol</th>
                    <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Estado</th>
                    <th className="text-left py-3.5 px-4 font-medium text-slate-600 text-sm">Último Login</th>
                    <th className="text-right py-3.5 px-4 font-medium text-slate-600 text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-slate-600">
                              {getInitials(user.first_name, user.last_name)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{user.first_name} {user.last_name}</p>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{user.tenant_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="py-3.5 px-4">
                        {user.is_active ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 border">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-4 h-4" />
                          {user.last_login ? formatDate(user.last_login) : 'Nunca'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100">
                              <MoreHorizontal className="w-4 h-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleStatus(user)} className="cursor-pointer">
                              {user.is_active ? (
                                <><UserX className="w-4 h-4 mr-2 text-amber-500" /> Desactivar</>
                              ) : (
                                <><UserCheck className="w-4 h-4 mr-2 text-emerald-500" /> Activar</>
                              )}
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
          
          {!isLoading && filteredUsers.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-sm text-slate-500">
              Mostrando {filteredUsers.length} de {users.length} usuarios
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
