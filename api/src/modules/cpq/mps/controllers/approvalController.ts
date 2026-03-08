import { Request, Response } from 'express';
import { MPSPriceApprovalRequest } from '../types';

// In-memory store (same as original backend — needs DB migration later)
const approvalRequests: MPSPriceApprovalRequest[] = [];

export class MPSApprovalController {
  createRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { opportunityId, priceLevel, justification } = req.body;
      if (!opportunityId || !priceLevel || !justification) {
        res.status(400).json({ success: false, error: 'opportunityId, priceLevel y justification son requeridos' });
        return;
      }
      const request: MPSPriceApprovalRequest = {
        id: `apr-${Date.now()}`,
        opportunityId,
        requestedBy: user.userId || user.id,
        requestedAt: new Date().toISOString(),
        status: 'pending',
        priceLevel,
        justification
      };
      approvalRequests.push(request);
      res.status(201).json({ success: true, data: request });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error creando solicitud de aprobacion' });
    }
  };

  getPendingRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const pending = approvalRequests.filter(r => r.status === 'pending');
      res.json({ success: true, data: pending });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error obteniendo solicitudes pendientes' });
    }
  };

  getAllRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({ success: true, data: approvalRequests });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error obteniendo solicitudes' });
    }
  };

  getRequestById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request = approvalRequests.find(r => r.id === req.params.id);
      if (!request) { res.status(404).json({ success: false, error: 'Solicitud no encontrada' }); return; }
      res.json({ success: true, data: request });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error obteniendo solicitud' });
    }
  };

  getRequestsByOpportunity = async (req: Request, res: Response): Promise<void> => {
    try {
      const requests = approvalRequests.filter(r => r.opportunityId === req.params.oportunidadId);
      res.json({ success: true, data: requests });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error obteniendo solicitudes por oportunidad' });
    }
  };

  respondToRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { status, responseNotes } = req.body;
      if (!status || !['approved', 'rejected'].includes(status)) {
        res.status(400).json({ success: false, error: 'status debe ser approved o rejected' });
        return;
      }
      const index = approvalRequests.findIndex(r => r.id === req.params.id);
      if (index === -1) { res.status(404).json({ success: false, error: 'Solicitud no encontrada' }); return; }

      approvalRequests[index] = {
        ...approvalRequests[index],
        status,
        respondedBy: user.userId || user.id,
        respondedAt: new Date().toISOString(),
        responseNotes
      };
      res.json({ success: true, data: approvalRequests[index] });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error respondiendo solicitud' });
    }
  };
}

export const mpsApprovalController = new MPSApprovalController();
