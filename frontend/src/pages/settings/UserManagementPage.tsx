// ============================================
// ANTU CRM - USER MANAGEMENT PAGE
// Gestión de usuarios para Tenant Admin
// ============================================

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Plus, Search, Mail, 
  Shield, UserCheck, UserX, Edit2, Trash2, 
  CheckCircle2, XCircle, AlertTriangle,
  Crown, Briefcase, Package, Receipt, CreditCard,
  ChevronRight, RefreshCw
} from 'lucide-react';
import { ROLE_LABELS, ROLE_DESCRIPTIONS, type UserRole } from '@/types/auth';

// ============================================
// ROLE CONFIGURATION
// ============================================

const ROLE_CONFIG: Record<UserRole, { icon: React.ElementType; color: string; bgColor: string }> = {
  PLATFORM_ADMIN: { icon: Crown, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  TENANT_ADMIN: { icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  SALES_MANAGER: { icon: Briefcase, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  SALES_REP: { icon: UserCheck, color: 'text-sky-600', bgColor: 'bg-sky-100' },
  INVENTORY_MANAGER: { icon: Package, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  BILLING_MANAGER: { icon: Receipt, color: 'text-rose-600', bgColor: 'bg-rose-100' },
  COLLECTIONS_MANAGER: { icon: CreditCard, color: 'text-violet-600', bgColor: 'bg-violet-100' },
};

// ============================================
// USER FORM DATA
// ============================================

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department: string;
  region: string;
  canApproveDiscounts: boolean;
  maxDiscountPercent: number;
}

const INITIAL_FORM_DATA: UserFormData = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'SALES_REP',
  department: '',
  region: '',
  canApproveDiscounts: false,
  maxDiscountPercent: 0,
};

// ============================================
// MAIN COMPONENT
// ============================================

export function UserManagementPage() {
  const { 
    user: currentUser, 
    users, 
    createUser, 
    updateUser, 
    deleteUser, 
    toggleUserStatus,
    getPlanLimits,
    canCreateUser,
    canCreateAdmin,
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<UserFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get plan limits
  const planLimits = getPlanLimits();
  const userUsagePercent = planLimits.maxUsers === Infinity 
    ? 0 
    : (planLimits.currentUsers / planLimits.maxUsers) * 100;
  const adminUsagePercent = planLimits.maxAdmins === Infinity 
    ? 0 
    : (planLimits.currentAdmins / planLimits.maxAdmins) * 100;

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' ? u.isActive : !u.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Group users by role
  const usersByRole = filteredUsers.reduce((acc, u) => {
    if (!acc[u.role]) acc[u.role] = [];
    acc[u.role].push(u);
    return acc;
  }, {} as Record<UserRole, typeof users>);

  // ==========================================
  // FORM HANDLERS
  // ==========================================

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof UserFormData, string>> = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'El nombre es requerido';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'El apellido es requerido';
    }
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    // Check if email already exists
    const emailExists = users.some(u => 
      u.email.toLowerCase() === formData.email.toLowerCase() && 
      u.id !== selectedUser?.id
    );
    if (emailExists) {
      errors.email = 'Este email ya está registrado';
    }
    
    // Check role creation permissions
    const canCreate = canCreateUser(formData.role);
    if (!canCreate.allowed) {
      errors.role = canCreate.reason;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    const success = await createUser({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      role: formData.role,
      attributes: {
        department: formData.department,
        region: formData.region,
        canApproveDiscounts: formData.canApproveDiscounts,
        maxDiscountPercent: formData.maxDiscountPercent,
      },
    });
    
    if (success) {
      setIsCreateModalOpen(false);
      setFormData(INITIAL_FORM_DATA);
    }
    setIsSubmitting(false);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !validateForm()) return;
    
    setIsSubmitting(true);
    const success = await updateUser(selectedUser.id, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      role: formData.role,
      attributes: {
        department: formData.department,
        region: formData.region,
        canApproveDiscounts: formData.canApproveDiscounts,
        maxDiscountPercent: formData.maxDiscountPercent,
      },
    });
    
    if (success) {
      setIsEditModalOpen(false);
      setSelectedUser(null);
      setFormData(INITIAL_FORM_DATA);
    }
    setIsSubmitting(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    const success = await deleteUser(selectedUser.id);
    
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    }
    setIsSubmitting(false);
  };

  const openEditModal = (user: typeof users[0]) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.attributes.department || '',
      region: user.attributes.region || '',
      canApproveDiscounts: user.attributes.canApproveDiscounts || false,
      maxDiscountPercent: user.attributes.maxDiscountPercent || 0,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: typeof users[0]) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const getRoleBadge = (role: UserRole) => {
    const config = ROLE_CONFIG[role];
    const Icon = config.icon;
    return (
      <Badge className={`${config.bgColor} ${config.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {ROLE_LABELS[role]}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-emerald-100 text-emerald-700 border-0">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Activo
      </Badge>
    ) : (
      <Badge className="bg-slate-100 text-slate-600 border-0">
        <XCircle className="w-3 h-3 mr-1" />
        Inactivo
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
          <p className="text-slate-500 mt-1">Administra los usuarios de tu organización</p>
        </div>
        <Button 
          onClick={() => {
            setFormData(INITIAL_FORM_DATA);
            setFormErrors({});
            setIsCreateModalOpen(true);
          }}
          disabled={planLimits.maxUsers !== Infinity && planLimits.currentUsers >= planLimits.maxUsers}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Plan Limits Alert */}
      {planLimits.maxUsers !== Infinity && (
        <Card className={userUsagePercent >= 90 ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-500" />
                <span className="font-medium text-slate-700">Uso de usuarios del plan</span>
              </div>
              <span className={`text-sm font-medium ${userUsagePercent >= 90 ? 'text-amber-600' : 'text-slate-600'}`}>
                {planLimits.currentUsers} / {planLimits.maxUsers} usuarios
              </span>
            </div>
            <Progress 
              value={userUsagePercent} 
              className="h-2"
            />
            {userUsagePercent >= 90 && (
              <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Estás cerca del límite. Considera hacer upgrade de tu plan.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin Limits */}
      {planLimits.maxAdmins !== Infinity && (
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-500" />
                <span className="font-medium text-slate-700">Administradores</span>
              </div>
              <span className="text-sm text-slate-600">
                {planLimits.currentAdmins} / {planLimits.maxAdmins} admins
              </span>
            </div>
            <Progress 
              value={adminUsagePercent} 
              className="h-2"
            />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | 'ALL')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los roles</SelectItem>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <SelectItem key={role} value={role}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="ACTIVE">Activos</SelectItem>
                <SelectItem value="INACTIVE">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="byRole">Por Rol</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Usuarios ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-[var(--primary-100)] text-[var(--color-primary)]">
                            {getInitials(user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-800">{user.fullName}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end gap-1">
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user.isActive)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditModal(user)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => toggleUserStatus(user.id)}
                            disabled={user.id === currentUser?.id}
                          >
                            {user.isActive ? (
                              <UserX className="w-4 h-4 text-amber-500" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-emerald-500" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDeleteModal(user)}
                            disabled={user.id === currentUser?.id}
                            className="text-rose-500 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      No se encontraron usuarios
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="byRole">
          <div className="space-y-4">
            {Object.entries(ROLE_LABELS).map(([role, label]) => {
              const roleUsers = usersByRole[role as UserRole] || [];
              if (roleUsers.length === 0) return null;
              
              const config = ROLE_CONFIG[role as UserRole];
              const Icon = config.icon;
              
              return (
                <Card key={role} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      {label}
                      <Badge variant="secondary">{roleUsers.length}</Badge>
                    </CardTitle>
                    <CardDescription>{ROLE_DESCRIPTIONS[role as UserRole]}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {roleUsers.map((user) => (
                        <div 
                          key={user.id} 
                          className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                                {getInitials(user.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-slate-800">{user.fullName}</p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(user.isActive)}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditModal(user)}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Crear Nuevo Usuario
            </DialogTitle>
            <DialogDescription>
              Completa la información para invitar a un nuevo usuario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Plan limit warning */}
            {planLimits.maxUsers !== Infinity && planLimits.currentUsers >= planLimits.maxUsers && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  Has alcanzado el límite de usuarios de tu plan. 
                  <Button variant="link" className="p-0 h-auto text-amber-700 underline">
                    Haz upgrade para agregar más.
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Juan"
                />
                {formErrors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.firstName}</p>
                )}
              </div>
              <div>
                <Label>Apellido *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Pérez"
                />
                {formErrors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="juan@empresa.com"
              />
              {formErrors.email && (
                <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <Label>Rol *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as UserRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS)
                    .filter(([role]) => {
                      // Filter out PLATFORM_ADMIN (only for ANTÜ staff)
                      if (role === 'PLATFORM_ADMIN') return false;
                      // Filter out TENANT_ADMIN if plan doesn't allow
                      if (role === 'TENANT_ADMIN') {
                        const canCreate = canCreateAdmin();
                        return canCreate.allowed;
                      }
                      return true;
                    })
                    .map(([role, label]) => (
                      <SelectItem key={role} value={role}>{label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-sm text-red-500 mt-1">{formErrors.role}</p>
              )}
            </div>

            <Separator />

            <div>
              <Label>Departamento</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Ventas"
              />
            </div>

            <div>
              <Label>Región</Label>
              <Input
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                placeholder="Santo Domingo"
              />
            </div>

            {(formData.role === 'SALES_MANAGER' || formData.role === 'TENANT_ADMIN') && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Puede aprobar descuentos</Label>
                    <p className="text-sm text-slate-500">Permite aprobar descuentos en cotizaciones</p>
                  </div>
                  <Switch
                    checked={formData.canApproveDiscounts}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, canApproveDiscounts: v }))}
                  />
                </div>
                {formData.canApproveDiscounts && (
                  <div>
                    <Label>Máximo % de descuento</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.maxDiscountPercent}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxDiscountPercent: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateUser}
              disabled={isSubmitting || (planLimits.maxUsers !== Infinity && planLimits.currentUsers >= planLimits.maxUsers)}
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              Editar Usuario
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Apellido *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <Label>Rol *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as UserRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS)
                    .filter(([role]) => role !== 'PLATFORM_ADMIN')
                    .map(([role, label]) => (
                      <SelectItem key={role} value={role}>{label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <Label>Departamento</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              />
            </div>

            <div>
              <Label>Región</Label>
              <Input
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
              />
            </div>

            {(formData.role === 'SALES_MANAGER' || formData.role === 'TENANT_ADMIN') && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Puede aprobar descuentos</Label>
                    <p className="text-sm text-slate-500">Permite aprobar descuentos en cotizaciones</p>
                  </div>
                  <Switch
                    checked={formData.canApproveDiscounts}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, canApproveDiscounts: v }))}
                  />
                </div>
                {formData.canApproveDiscounts && (
                  <div>
                    <Label>Máximo % de descuento</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.maxDiscountPercent}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxDiscountPercent: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Eliminar Usuario
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El usuario perderá acceso inmediatamente.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-slate-200 text-slate-600">
                    {getInitials(selectedUser.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-800">{selectedUser.fullName}</p>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Eliminar Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
