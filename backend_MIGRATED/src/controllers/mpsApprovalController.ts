import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { MPSPriceApprovalRequest } from '../types/mpsQuote';

/**
 * Controlador para las aprobaciones de precio del MPS
 * Maneja las solicitudes de aprobación para niveles de precio especiales
 */

// En producción, esto debería ser una tabla en la base de datos
const approvalRequests: MPSPriceApprovalRequest[] = [];

export class MPSApprovalController {
  /**
   * POST /api/mps/price-approval/request
   * Crea una nueva solicitud de aprobación de precio
   */
  public createRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { oportunidadId, quoteData, requestedBy } = req.body;

      if (!oportunidadId || !quoteData || !requestedBy) {
        res.status(400).json({
          success: false,
          error: 'Faltan datos requeridos: oportunidadId, quoteData, requestedBy'
        });
        return;
      }

      const newRequest: MPSPriceApprovalRequest = {
        id: uuidv4(),
        oportunidadId,
        quoteData,
        requestedBy,
        requestedAt: new Date().toISOString(),
        status: 'pending'
      };

      approvalRequests.push(newRequest);

      console.log('[MPS Approval] Nueva solicitud creada:', {
        id: newRequest.id,
        oportunidadId,
        requestedBy
      });

      res.status(201).json({
        success: true,
        data: newRequest,
        message: 'Solicitud de aprobación creada correctamente'
      });
    } catch (error) {
      console.error('[MPS Approval] Error creando solicitud:', error);
      res.status(500).json({
        success: false,
        error: 'Error al crear solicitud de aprobación'
      });
    }
  };

  /**
   * GET /api/mps/price-approval/pending
   * Obtiene todas las solicitudes pendientes (para gerentes)
   */
  public getPendingRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const pending = approvalRequests.filter(r => r.status === 'pending');

      res.status(200).json({
        success: true,
        data: pending,
        count: pending.length
      });
    } catch (error) {
      console.error('[MPS Approval] Error obteniendo solicitudes:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener solicitudes pendientes'
      });
    }
  };

  /**
   * GET /api/mps/price-approval/all
   * Obtiene todas las solicitudes (para admin)
   */
  public getAllRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: approvalRequests,
        count: approvalRequests.length
      });
    } catch (error) {
      console.error('[MPS Approval] Error obteniendo solicitudes:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener solicitudes'
      });
    }
  };

  /**
   * GET /api/mps/price-approval/:id
   * Obtiene una solicitud específica
   */
  public getRequestById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const request = approvalRequests.find(r => r.id === id);

      if (!request) {
        res.status(404).json({
          success: false,
          error: 'Solicitud no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: request
      });
    } catch (error) {
      console.error('[MPS Approval] Error obteniendo solicitud:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener solicitud'
      });
    }
  };

  /**
   * POST /api/mps/price-approval/:id/respond
   * Responde a una solicitud (aprobar o rechazar)
   */
  public respondToRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { approved, notes } = req.body;
      const approverId = (req as any).user?.id || 'system';

      const request = approvalRequests.find(r => r.id === id);

      if (!request) {
        res.status(404).json({
          success: false,
          error: 'Solicitud no encontrada'
        });
        return;
      }

      if (request.status !== 'pending') {
        res.status(400).json({
          success: false,
          error: 'Esta solicitud ya ha sido respondida'
        });
        return;
      }

      request.status = approved ? 'approved' : 'rejected';
      request.approvedBy = approverId;
      request.approvedAt = new Date().toISOString();
      request.notes = notes;

      console.log('[MPS Approval] Solicitud respondida:', {
        id,
        status: request.status,
        approvedBy: approverId
      });

      res.status(200).json({
        success: true,
        data: request,
        message: approved ? 'Solicitud aprobada correctamente' : 'Solicitud rechazada'
      });
    } catch (error) {
      console.error('[MPS Approval] Error respondiendo solicitud:', error);
      res.status(500).json({
        success: false,
        error: 'Error al responder solicitud'
      });
    }
  };

  /**
   * GET /api/mps/price-approval/by-opportunity/:oportunidadId
   * Obtiene solicitudes por oportunidad
   */
  public getRequestsByOpportunity = async (req: Request, res: Response): Promise<void> => {
    try {
      const { oportunidadId } = req.params;
      const requests = approvalRequests.filter(r => r.oportunidadId === oportunidadId);

      res.status(200).json({
        success: true,
        data: requests,
        count: requests.length
      });
    } catch (error) {
      console.error('[MPS Approval] Error obteniendo solicitudes:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener solicitudes'
      });
    }
  };
}

// Exportar instancia
export const mpsApprovalController = new MPSApprovalController();
