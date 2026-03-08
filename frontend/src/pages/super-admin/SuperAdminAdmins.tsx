import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Users, Key, Power } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { superAdminApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface Admin {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  last_login: string
  created_at: string
}

export default function SuperAdminAdmins() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    is_active: true
  })

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    try {
      setIsLoading(true)
      const response = await superAdminApi.getAdmins()
      setAdmins(response.data.admins || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudieron cargar los administradores',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (admin?: Admin) => {
    if (admin) {
      setEditingAdmin(admin)
      setFormData({
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        password: '',
        is_active: admin.is_active
      })
    } else {
      setEditingAdmin(null)
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        is_active: true
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingAdmin) {
        const updateData = {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          is_active: formData.is_active
        }
        await superAdminApi.updateAdmin(editingAdmin.id, updateData)
        toast({
          title: 'Éxito',
          description: 'Administrador actualizado correctamente',
          variant: 'success'
        })
      } else {
        await superAdminApi.createAdmin(formData)
        toast({
          title: 'Éxito',
          description: 'Administrador creado correctamente',
          variant: 'success'
        })
      }
      setIsDialogOpen(false)
      loadAdmins()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo guardar el administrador',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (admin: Admin) => {
    if (!confirm(`¿Estás seguro de eliminar al administrador "${admin.first_name} ${admin.last_name}"?`)) {
      return
    }

    try {
      await superAdminApi.deleteAdmin(admin.id)
      toast({
        title: 'Éxito',
        description: 'Administrador eliminado correctamente',
        variant: 'success'
      })
      loadAdmins()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo eliminar el administrador',
        variant: 'destructive'
      })
    }
  }

  const handleToggleStatus = async (admin: Admin) => {
    try {
      await superAdminApi.toggleAdminStatus(admin.id)
      toast({
        title: 'Éxito',
        description: `Administrador ${admin.is_active ? 'desactivado' : 'activado'} correctamente`,
        variant: 'success'
      })
      loadAdmins()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo cambiar el estado',
        variant: 'destructive'
      })
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAdmin) return

    try {
      await superAdminApi.resetAdminPassword(selectedAdmin.id, newPassword)
      toast({
        title: 'Éxito',
        description: 'Contraseña reseteada correctamente',
        variant: 'success'
      })
      setIsPasswordDialogOpen(false)
      setNewPassword('')
      setSelectedAdmin(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo resetear la contraseña',
        variant: 'destructive'
      })
    }
  }

  const openPasswordDialog = (admin: Admin) => {
    setSelectedAdmin(admin)
    setNewPassword('')
    setIsPasswordDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Administradores</h1>
          <p className="text-gray-500">Gestiona los administradores del sistema</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Crear Super Admin
        </Button>
      </div>

      {/* Admins Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-500">Cargando administradores...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No hay administradores registrados</p>
              <Button onClick={() => handleOpenDialog()} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Crear primer administrador
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Último Login</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Creado</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-700 font-semibold">
                              {admin.first_name[0]}{admin.last_name[0]}
                            </span>
                          </div>
                          <span className="font-medium">{admin.first_name} {admin.last_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{admin.email}</td>
                      <td className="py-3 px-4">
                        {admin.is_active ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {admin.last_login ? formatDate(admin.last_login) : 'Nunca'}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {formatDate(admin.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Acciones
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(admin)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openPasswordDialog(admin)}>
                              <Key className="w-4 h-4 mr-2" />
                              Resetear Contraseña
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(admin)}>
                              <Power className="w-4 h-4 mr-2" />
                              {admin.is_active ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(admin)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAdmin ? 'Editar Administrador' : 'Crear Super Admin'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">Apellido</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {!editingAdmin && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingAdmin}
                  minLength={6}
                />
              </div>
            )}

            {editingAdmin && (
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Activo</Label>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : editingAdmin ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resetear Contraseña</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Estás reseteando la contraseña de <strong>{selectedAdmin?.first_name} {selectedAdmin?.last_name}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">Nueva Contraseña *</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Resetear Contraseña
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
