// ============================================
// WHATSAPP CONFIGURATION COMPONENT
// Setup and configuration UI
// ============================================

import { useState, useEffect } from 'react'
import { MessageCircle, Check, AlertCircle, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api';

interface WhatsAppConfigData {
  configured: boolean
  config?: {
    phone_number_id: string
    business_account_id?: string
    is_active: boolean
    is_verified: boolean
    connected_at: string
    messages_sent_today: number
  }
}

export function WhatsAppConfig() {
  const [config, setConfig] = useState<WhatsAppConfigData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: '',
    appSecret: '',
    webhookVerifyToken: '',
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await api.get('/whatsapp/config')
      setConfig(response.data)
      setShowForm(!response.data.configured)
    } catch (error) {
      console.error('Error loading config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    setIsSaving(true)
    try {
      await api.post('/whatsapp/config', formData)
      
      toast({
        title: 'WhatsApp configurado',
        description: 'Tu número de WhatsApp Business está conectado',
        variant: 'success'
      })
      
      await loadConfig()
      setShowForm(false)
    } catch (error: any) {
      toast({
        title: 'Error al configurar',
        description: error.response?.data?.error || 'Verifica tus credenciales',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const disconnect = async () => {
    try {
      await api.delete('/whatsapp/config')
      toast({
        title: 'WhatsApp desconectado',
        variant: 'success'
      })
      setConfig(null)
      setShowForm(true)
    } catch (error) {
      toast({
        title: 'Error al desconectar',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return <div>Cargando...</div>
  }

  // Vista de configuración guardada
  if (config?.configured && !showForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-green-600" />
            WhatsApp Business Conectado
          </CardTitle>
          <CardDescription>
            Tu número de WhatsApp está integrado con el CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <Check className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Conexión activa y funcionando correctamente
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">ID de Número</p>
              <p className="font-mono">{config.config?.phone_number_id}</p>
            </div>
            <div>
              <p className="text-gray-500">Conectado desde</p>
              <p>{config.config?.connected_at ? new Date(config.config.connected_at).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Mensajes hoy</p>
              <p className="font-medium">{config.config?.messages_sent_today || 0} / 1000</p>
            </div>
            <div>
              <p className="text-gray-500">Estado</p>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Activo
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowForm(true)}
              className="flex-1"
            >
              Editar configuración
            </Button>
            <Button
              variant="destructive"
              onClick={disconnect}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Desconectar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Vista de formulario
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-[#075E54]" />
          Configurar WhatsApp Business
        </CardTitle>
        <CardDescription>
          Conecta tu número de WhatsApp Business API para enviar y recibir mensajes desde el CRM
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Necesitas una cuenta de WhatsApp Business API.{' '}
            <a 
              href="https://business.facebook.com/products/whatsapp-business-platform/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:underline"
            >
              Obtener acceso <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
            <Input
              id="phoneNumberId"
              value={formData.phoneNumberId}
              onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
              placeholder="123456789012345"
            />
            <p className="text-xs text-gray-500 mt-1">
              Encuéntralo en WhatsApp Business {'>'} API Setup
            </p>
          </div>

          <div>
            <Label htmlFor="businessAccountId">Business Account ID (opcional)</Label>
            <Input
              id="businessAccountId"
              value={formData.businessAccountId}
              onChange={(e) => setFormData({ ...formData, businessAccountId: e.target.value })}
              placeholder="123456789012345"
            />
          </div>

          <div>
            <Label htmlFor="accessToken">Access Token *</Label>
            <Input
              id="accessToken"
              type="password"
              value={formData.accessToken}
              onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              placeholder="EAAB..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Token de acceso permanente de Meta Developers
            </p>
          </div>

          <div>
            <Label htmlFor="appSecret">App Secret (para webhooks)</Label>
            <Input
              id="appSecret"
              type="password"
              value={formData.appSecret}
              onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
              placeholder="Tu App Secret de Meta"
            />
          </div>

          <div>
            <Label htmlFor="webhookVerifyToken">Webhook Verify Token</Label>
            <Input
              id="webhookVerifyToken"
              value={formData.webhookVerifyToken}
              onChange={(e) => setFormData({ ...formData, webhookVerifyToken: e.target.value })}
              placeholder="token_seguro_para_webhook"
            />
            <p className="text-xs text-gray-500 mt-1">
              Token para verificar webhooks entrantes
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          {config?.configured && (
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          )}
          <Button
            onClick={saveConfig}
            disabled={isSaving || !formData.phoneNumberId || !formData.accessToken}
            className="flex-1 bg-[#075E54] hover:bg-[#128C7E]"
          >
            {isSaving ? 'Conectando...' : 'Conectar WhatsApp'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
