import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  getMe: () =>
    api.get('/auth/me'),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
  
  resetPassword: (userId: string, newPassword: string, isLandlordUser: boolean) =>
    api.post('/auth/reset-password', { userId, newPassword, isLandlordUser }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPasswordToken: (token: string, newPassword: string) =>
    api.post('/auth/reset-password-token', { token, new_password: newPassword }),
}

// Users API
export const usersApi = {
  getAll: (tenantId?: string) =>
    api.get('/users', { params: { tenantId } }),
  
  getById: (id: string) =>
    api.get(`/users/${id}`),
  
  create: (data: any) =>
    api.post('/users', data),
  
  update: (id: string, data: any) =>
    api.put(`/users/${id}`, data),

  delete: (id: string) =>
    api.delete(`/users/${id}`),

  reassign: (data: { from_user_id: string; to_user_id: string; type: string }) =>
    api.post('/users/reassign', data)
}

// Clients API
export const clientsApi = {
  getAll: (params?: any) =>
    api.get('/clients', { params }),
  
  getById: (id: string) =>
    api.get(`/clients/${id}`),
  
  create: (data: any) =>
    api.post('/clients', data),
  
  update: (id: string, data: any) =>
    api.put(`/clients/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/clients/${id}`),
  
  convert: (id: string, data: any) =>
    api.post(`/clients/${id}/convert`, data)
}

// Opportunities API
export const opportunitiesApi = {
  getAll: (params?: any) =>
    api.get('/opportunities', { params }),
  
  getPipelineSummary: () =>
    api.get('/opportunities/pipeline/summary'),
  
  getById: (id: string) =>
    api.get(`/opportunities/${id}`),
  
  create: (data: any) =>
    api.post('/opportunities', data),
  
  update: (id: string, data: any) =>
    api.put(`/opportunities/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/opportunities/${id}`),
  
  move: (id: string, stage: string) =>
    api.post(`/opportunities/${id}/move`, { stage })
}

// Quotes API
export const quotesApi = {
  getAll: (params?: any) =>
    api.get('/quotes', { params }),
  
  getById: (id: string) =>
    api.get(`/quotes/${id}`),
  
  create: (data: any) =>
    api.post('/quotes', data),
  
  updateStatus: (id: string, status: string) =>
    api.put(`/quotes/${id}/status`, { status }),
  
  delete: (id: string) =>
    api.delete(`/quotes/${id}`)
}

// Performance API (Mi Desempeño)
export const performanceApi = {
  // Obtener métricas de desempeño
  getMetrics: (userId?: string, period?: string) =>
    api.get('/performance/metrics', { params: { userId, period } }),
  
  // Obtener métricas del equipo (solo managers)
  getTeamMetrics: () =>
    api.get('/performance/team'),
  
  // Obtener histórico de desempeño
  getHistory: (userId?: string, months?: number) =>
    api.get('/performance/history', { params: { userId, months } }),
  
  // Actualizar cuota (solo managers)
  updateQuota: (userId: string, monthlyQuota: number, yearlyQuota: number) =>
    api.put(`/performance/quota/${userId}`, { monthly_quota: monthlyQuota, yearly_quota: yearlyQuota }),
}

// Activities API
export const activitiesApi = {
  // Crear una nueva actividad
  create: (data: any) =>
    api.post('/activities', data),
  
  // Obtener actividades con filtros
  getAll: (params?: any) =>
    api.get('/activities', { params }),
  
  // Obtener actividades de un usuario
  getByUser: (userId: string, params?: any) =>
    api.get(`/activities/by-user/${userId}`, { params }),
  
  // Obtener actividades relacionadas
  getByRelated: (relatedType: string, relatedId: string) =>
    api.get(`/activities/by-related/${relatedType}/${relatedId}`),
  
  // Obtener estadísticas de actividades
  getStats: (params?: any) =>
    api.get('/activities/stats', { params }),
  
  // Eliminar una actividad
  delete: (id: string) =>
    api.delete(`/activities/${id}`),
}

// MPS Calculator API (Cotizador MPS)
export const mpsCalculatorApi = {
  // Calcular cotización completa
  calculate: (data: any) =>
    api.post('/mps/calculate', data),
  
  // Recalcular con nuevos parámetros
  recalculate: (data: any) =>
    api.post('/mps/recalculate', data),
  
  // Validar datos de entrada
  validate: (data: any) =>
    api.post('/mps/validate', data),
  
  // Obtener ejemplo de estructura
  getExample: () =>
    api.get('/mps/example'),
  
  // Guardar cotización MPS
  saveQuote: (data: any) =>
    api.post('/mps/quotes', data),
  
  // Solicitar aprobación de nivel de precio
  requestPriceApproval: (data: any) =>
    api.post('/mps/price-approval/request', data),
  
  // Obtener solicitudes de aprobación pendientes (para gerentes)
  getPendingApprovals: () =>
    api.get('/mps/price-approval/pending'),
  
  // Aprobar/rechazar solicitud de precio
  approvePriceRequest: (requestId: string, approved: boolean, notes?: string) =>
    api.post(`/mps/price-approval/${requestId}/respond`, { approved, notes }),
  
  // Obtener configuración del módulo MPS
  getConfig: () =>
    api.get('/mps/config'),
  
  // Actualizar configuración del módulo MPS (admin)
  updateConfig: (data: any) =>
    api.put('/mps/config', data)
}

// Contacts API
export const contactsApi = {
  getAll: (params?: any) =>
    api.get('/contacts', { params }),
  
  getById: (id: string) =>
    api.get(`/contacts/${id}`),
  
  create: (data: any) =>
    api.post('/contacts', data),
  
  update: (id: string, data: any) =>
    api.put(`/contacts/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/contacts/${id}`)
}

// Tasks API
export const tasksApi = {
  getAll: (params?: any) =>
    api.get('/tasks', { params }),
  
  getStats: () =>
    api.get('/tasks/stats/summary'),
  
  getById: (id: string) =>
    api.get(`/tasks/${id}`),
  
  create: (data: any) =>
    api.post('/tasks', data),
  
  update: (id: string, data: any) =>
    api.put(`/tasks/${id}`, data),
  
  updateStatus: (id: string, status: string) =>
    api.put(`/tasks/${id}/status`, { status }),
  
  complete: (id: string) =>
    api.post(`/tasks/${id}/complete`),
  
  delete: (id: string) =>
    api.delete(`/tasks/${id}`),
  
  // Activities
  addActivity: (id: string, data: any) =>
    api.post(`/tasks/${id}/activities`, data),
  
  getActivities: (id: string) =>
    api.get(`/tasks/${id}/activities`),
  
  // Comments
  addComment: (id: string, data: any) =>
    api.post(`/tasks/${id}/comments`, data),
  
  getComments: (id: string) =>
    api.get(`/tasks/${id}/comments`)
}

// Marketing API
export const marketingApi = {
  // Campaigns
  getCampaigns: (params?: any) =>
    api.get('/marketing/campaigns', { params }),
  
  getCampaignById: (id: string) =>
    api.get(`/marketing/campaigns/${id}`),
  
  createCampaign: (data: any) =>
    api.post('/marketing/campaigns', data),
  
  updateCampaign: (id: string, data: any) =>
    api.put(`/marketing/campaigns/${id}`, data),
  
  deleteCampaign: (id: string) =>
    api.delete(`/marketing/campaigns/${id}`),
  
  launchCampaign: (id: string) =>
    api.post(`/marketing/campaigns/${id}/launch`),
  
  pauseCampaign: (id: string) =>
    api.post(`/marketing/campaigns/${id}/pause`),
  
  // Automations
  getAutomations: (params?: any) =>
    api.get('/marketing/automations', { params }),
  
  getAutomationById: (id: string) =>
    api.get(`/marketing/automations/${id}`),
  
  createAutomation: (data: any) =>
    api.post('/marketing/automations', data),
  
  updateAutomation: (id: string, data: any) =>
    api.put(`/marketing/automations/${id}`, data),
  
  updateAutomationStatus: (id: string, status: string) =>
    api.put(`/marketing/automations/${id}/status`, { status }),
  
  deleteAutomation: (id: string) =>
    api.delete(`/marketing/automations/${id}`),
  
  // Segments
  getSegments: (params?: any) =>
    api.get('/marketing/segments', { params }),
  
  getSegmentById: (id: string) =>
    api.get(`/marketing/segments/${id}`),
  
  createSegment: (data: any) =>
    api.post('/marketing/segments', data),
  
  updateSegment: (id: string, data: any) =>
    api.put(`/marketing/segments/${id}`, data),
  
  deleteSegment: (id: string) =>
    api.delete(`/marketing/segments/${id}`)
}

// Emails API (Outbound Email)
export const emailsApi = {
  // Enviar un correo
  send: (data: {
    contactId: string
    clientId?: string
    toEmail: string
    toName?: string
    subject: string
    bodyText: string
    bodyHtml?: string
  }) => api.post('/emails/send', data),

  // Obtener correos de un contacto
  getByContact: (contactId: string, params?: { limit?: number; offset?: number }) =>
    api.get(`/emails/contact/${contactId}`, { params }),

  // Obtener un correo específico
  getById: (emailId: string) =>
    api.get(`/emails/${emailId}`),

  // Obtener estadísticas
  getStats: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/emails/stats', { params }),

  // Verificar configuración SMTP
  verifyConfig: () =>
    api.get('/emails/verify-config')
}

// Super Admin API
export const superAdminApi = {
  // Dashboard
  getDashboard: () =>
    api.get('/super-admin/dashboard'),
  
  // Plans
  getPlans: () =>
    api.get('/super-admin/plans'),
  
  getPlanById: (id: string) =>
    api.get(`/super-admin/plans/${id}`),
  
  createPlan: (data: any) =>
    api.post('/super-admin/plans', data),
  
  updatePlan: (id: string, data: any) =>
    api.put(`/super-admin/plans/${id}`, data),
  
  deletePlan: (id: string) =>
    api.delete(`/super-admin/plans/${id}`),
  
  // Tenants
  getTenants: () =>
    api.get('/super-admin/tenants'),
  
  getTenantById: (id: string) =>
    api.get(`/super-admin/tenants/${id}`),
  
  createTenant: (data: any) =>
    api.post('/super-admin/tenants', data),
  
  updateTenant: (id: string, data: any) =>
    api.put(`/super-admin/tenants/${id}`, data),
  
  deleteTenant: (id: string) =>
    api.delete(`/super-admin/tenants/${id}`),
  
  suspendTenant: (id: string) =>
    api.post(`/super-admin/tenants/${id}/suspend`),
  
  activateTenant: (id: string) =>
    api.post(`/super-admin/tenants/${id}/activate`),
  
  // Admins
  getAdmins: () =>
    api.get('/super-admin/admins'),
  
  getAdminById: (id: string) =>
    api.get(`/super-admin/admins/${id}`),
  
  createAdmin: (data: any) =>
    api.post('/super-admin/admins', data),
  
  updateAdmin: (id: string, data: any) =>
    api.put(`/super-admin/admins/${id}`, data),
  
  deleteAdmin: (id: string) =>
    api.delete(`/super-admin/admins/${id}`),
  
  resetAdminPassword: (id: string, newPassword: string) =>
    api.post(`/super-admin/admins/${id}/reset-password`, { newPassword }),
  
  toggleAdminStatus: (id: string) =>
    api.post(`/super-admin/admins/${id}/toggle-status`),

  // Global Users
  getGlobalUsers: () =>
    api.get('/super-admin/users'),

  toggleUserStatus: (id: string) =>
    api.put(`/super-admin/users/${id}/toggle-status`, {}),

  getTenantModules: (id: string) =>
    api.get(`/super-admin/tenants/${id}/modules`),

  updateTenantModules: (id: string, modules: Record<string, boolean>) =>
    api.put(`/super-admin/tenants/${id}/modules`, { modules }),

  // System & Audit Logs
  getSystemLogs: (params?: any) =>
    api.get('/super-admin/logs/system', { params }),

  getAuditLogs: (params?: any) =>
    api.get('/super-admin/logs/audit', { params }),

  // Billing / Subscriptions
  getBillingSubscriptions: () =>
    api.get('/super-admin/billing/subscriptions'),

  getBillingStats: () =>
    api.get('/super-admin/billing/stats'),

  // Settings (SMTP)
  getSmtpSettings: () =>
    api.get('/super-admin/settings/smtp'),

  saveSmtpSettings: (data: any) =>
    api.put('/super-admin/settings/smtp', data),

  testSmtpSettings: (data: any) =>
    api.post('/super-admin/settings/smtp/test', data)
}

// Inventory API
export const inventoryApi = {
  getProducts:     (params?: any)              => api.get('/inventory/products', { params }),
  getProductById:  (id: string)                => api.get(`/inventory/products/${id}`),
  createProduct:   (data: any)                 => api.post('/inventory/products', data),
  updateProduct:   (id: string, data: any)     => api.put(`/inventory/products/${id}`, data),
  adjustStock:     (id: string, data: any)     => api.post(`/inventory/products/${id}/adjustment`, data),
  getMovements:    (params?: any)              => api.get('/inventory/movements', { params }),
}

// Invoicing API
export const invoicingApi = {
  getAll:          (params?: any)              => api.get('/invoices', { params }),
  getById:         (id: string)                => api.get(`/invoices/${id}`),
  create:          (data: any)                 => api.post('/invoices', data),
  updateStatus:    (id: string, data: any)     => api.put(`/invoices/${id}/status`, data),
  getNcfSequences: ()                          => api.get('/invoices/ncf/sequences'),
}

// Service Desk API
export const serviceDeskApi = {
  getAll:       (params?: any) => api.get('/service-desk', { params }),
  getStats:     ()             => api.get('/service-desk/stats'),
  getById:      (id: string)   => api.get(`/service-desk/${id}`),
  create:       (data: any)    => api.post('/service-desk', data),
  update:       (id: string, data: any) => api.put(`/service-desk/${id}`, data),
  close:        (id: string, clientSignature: string) =>
                  api.post(`/service-desk/${id}/close`, { client_signature: clientSignature }),
  delete:       (id: string)   => api.delete(`/service-desk/${id}`),
  // Work Orders
  createWO:     (ticketId: string, data: any) =>
                  api.post(`/service-desk/${ticketId}/work-orders`, data),
  updateWO:     (woId: string, data: any) =>
                  api.put(`/service-desk/work-orders/${woId}`, data),
  // Parts
  consumePart:  (woId: string, data: any) =>
                  api.post(`/service-desk/work-orders/${woId}/parts`, data),
}

// Integrations API (API Keys + Webhooks)
export const integrationApi = {
  // API Keys
  getApiKeys:    ()                          => api.get('/integrations/api-keys'),
  createApiKey:  (data: any)                 => api.post('/integrations/api-keys', data),
  updateApiKey:  (id: string, data: any)     => api.put(`/integrations/api-keys/${id}`, data),
  deleteApiKey:  (id: string)                => api.delete(`/integrations/api-keys/${id}`),

  // Webhooks
  getWebhooks:        ()                     => api.get('/integrations/webhooks'),
  createWebhook:      (data: any)            => api.post('/integrations/webhooks', data),
  updateWebhook:      (id: string, data: any)=> api.put(`/integrations/webhooks/${id}`, data),
  deleteWebhook:      (id: string)           => api.delete(`/integrations/webhooks/${id}`),
  testWebhook:        (id: string)           => api.post(`/integrations/webhooks/${id}/test`),
  getWebhookEvents:   (id: string, params?: any) => api.get(`/integrations/webhooks/${id}/events`, { params }),

  // Catalogs
  getEventCatalog: () => api.get('/integrations/events'),
  getScopeCatalog: () => api.get('/integrations/scopes'),
}

// ERP Integrations API (Alegra, Odoo, QuickBooks, DGII)
export const erpApi = {
  getAll:      ()                          => api.get('/integrations/erp'),
  save:        (service: string, data: any)=> api.put(`/integrations/erp/${service}`, data),
  test:        (service: string)           => api.post(`/integrations/erp/${service}/test`),
  getLogs:     (service: string, params?: any) => api.get(`/integrations/erp/${service}/logs`, { params }),
  remove:      (service: string)           => api.delete(`/integrations/erp/${service}`),
  lookupRNC:   (rnc: string)              => api.get(`/integrations/erp/dgii/${rnc}`),
}

// AI API
export const aiApi = {
  getConfig:    ()          => api.get('/ai/config'),
  saveConfig:   (data: any) => api.put('/ai/config', data),
  testConfig:   ()          => api.post('/ai/test'),
  analyzeContact: (data: any) => api.post('/ai/analyze/contact', data),
  salesRecommendations: ()  => api.post('/ai/recommendations/sales', {}),
  // Meeting Prep IA
  meetingPrep: (clientId: string, opportunityId?: string) =>
    api.post('/ai/meeting-prep', { client_id: clientId, opportunity_id: opportunityId }),
  // Deal Score IA
  scoreDeal:       (opportunityId: string) => api.post(`/ai/deal-score/${opportunityId}`, {}),
  batchScoreDeals: ()                      => api.post('/ai/deal-score/batch', {}),
  getDealScores:   ()                      => api.get('/ai/deal-scores'),
  // Antü Coach Win/Loss IA
  getCoach:   (days?: number, refresh?: boolean) =>
    api.get('/ai/coach', { params: { days: days || 90, refresh: refresh ? 'true' : undefined } }),
  // Forecast Simulator IA
  getForecast: (refresh?: boolean) =>
    api.get('/ai/forecast', { params: { refresh: refresh ? 'true' : undefined } }),
  // Relationship Map IA
  getRelationshipMap: (clientId: string) =>
    api.get('/ai/relationship-map', { params: { client_id: clientId } }),
}

// Tenant Settings API (admin-level, own tenant)
export const tenantSettingsApi = {
  get: () => api.get('/tenant/settings'),
  update: (data: { fiscal_year_start?: number; currency?: string; timezone?: string }) =>
    api.put('/tenant/settings', data),
}

// Bulk Import API
export const importApi = {
  importClients:   (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/import/clients',   fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  importContacts:  (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/import/contacts',  fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  importInventory: (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/import/inventory', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  importSales:         (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/import/sales',         fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  importOpportunities: (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/import/opportunities', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  getStatus:  (jobId: string)   => api.get(`/import/status/${jobId}`),
  getHistory: ()                => api.get('/import/history'),
}

// Gov Module API (Licitaciones Gubernamentales — Ley 47-25 RD)
export const govApi = {
  getChecklist:   (opportunityId: string) => api.get(`/gov/checklist/${opportunityId}`),
  createItem:     (data: any)             => api.post('/gov/checklist', data),
  loadTemplate:   (opportunityId: string) => api.post('/gov/checklist', { opportunity_id: opportunityId, use_template: true }),
  updateItem:     (id: string, data: any) => api.patch(`/gov/checklist/${id}`, data),
  deleteItem:     (id: string)            => api.delete(`/gov/checklist/${id}`),
  syncPortal:     (data: { opportunity_id: string; gov_process_id?: string }) => api.post('/gov/sync-portal', data),
  getTemplates:   ()                      => api.get('/gov/templates'),
}

export default api
