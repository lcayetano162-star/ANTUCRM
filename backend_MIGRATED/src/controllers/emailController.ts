import { Request, Response } from 'express';
import emailService from '../services/emailService';

// ============================================================
// Controlador de Emails - AntuCRM
// Maneja el envío y registro de correos outbound
// ============================================================

/**
 * Envía un correo electrónico a un contacto
 * POST /api/emails/send
 */
export const sendEmail = async (req: Request, res: Response) => {
  try {
    const {
      contactId,
      clientId,
      toEmail,
      toName,
      subject,
      bodyText,
      bodyHtml,
    } = req.body;

    // Validaciones básicas
    if (!contactId) {
      return res.status(400).json({
        success: false,
        error: 'El ID del contacto es requerido',
      });
    }

    if (!toEmail) {
      return res.status(400).json({
        success: false,
        error: 'El email del destinatario es requerido',
      });
    }

    if (!subject || subject.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El asunto del correo es requerido',
      });
    }

    if (!bodyText || bodyText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El mensaje del correo es requerido',
      });
    }

    // Obtener datos del usuario autenticado (del middleware de auth)
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;
    const userEmail = req.user?.email;
    const userName = req.user?.firstName + ' ' + req.user?.lastName;

    if (!userId || !tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado o sesión inválida',
      });
    }

    // Enviar correo y guardar registro
    const emailRecord = await emailService.sendEmail({
      emailData: {
        to: toEmail,
        toName: toName || undefined,
        subject: subject.trim(),
        bodyText: bodyText.trim(),
        bodyHtml: bodyHtml || undefined,
      },
      contactId,
      clientId,
      userId,
      tenantId,
      fromEmail: userEmail,
      fromName: userName,
    });

    // Responder según el resultado
    if (emailRecord.status === 'sent') {
      return res.status(200).json({
        success: true,
        message: 'Correo enviado y registrado correctamente',
        data: {
          emailId: emailRecord.id,
          status: emailRecord.status,
          sentAt: emailRecord.sentAt,
        },
      });
    } else {
      // El correo falló pero se guardó el registro
      return res.status(200).json({
        success: true,
        warning: true,
        message: 'No se pudo enviar el correo, pero se registró el intento',
        data: {
          emailId: emailRecord.id,
          status: emailRecord.status,
          errorMessage: emailRecord.errorMessage,
          sentAt: emailRecord.sentAt,
        },
      });
    }

  } catch (error: any) {
    console.error('[EmailController] Error al enviar correo:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al enviar el correo',
    });
  }
};

/**
 * Obtiene los correos enviados a un contacto específico
 * GET /api/emails/contact/:contactId
 */
export const getEmailsByContact = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
    }

    // Parámetros de paginación
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const emails = await emailService.getEmailsByContact(contactId, tenantId, limit, offset);

    return res.status(200).json({
      success: true,
      data: {
        emails,
        count: emails.length,
      },
    });

  } catch (error: any) {
    console.error('[EmailController] Error al obtener correos:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener los correos',
    });
  }
};

/**
 * Obtiene un correo específico por ID
 * GET /api/emails/:emailId
 */
export const getEmailById = async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
    }

    const email = await emailService.getEmailById(emailId, tenantId);

    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Correo no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      data: email,
    });

  } catch (error: any) {
    console.error('[EmailController] Error al obtener correo:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener el correo',
    });
  }
};

/**
 * Obtiene estadísticas de correos del usuario actual
 * GET /api/emails/stats
 */
export const getEmailStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
    }

    // Parámetros de fecha opcionales
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const stats = await emailService.getEmailStats(userId, tenantId, startDate, endDate);

    return res.status(200).json({
      success: true,
      data: stats,
    });

  } catch (error: any) {
    console.error('[EmailController] Error al obtener estadísticas:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener estadísticas',
    });
  }
};

/**
 * Verifica la configuración SMTP
 * GET /api/emails/verify-config
 */
export const verifySmtpConfig = async (req: Request, res: Response) => {
  try {
    const result = await emailService.verifySmtpConfig();

    if (result.valid) {
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      return res.status(200).json({
        success: false,
        error: result.message,
      });
    }

  } catch (error: any) {
    console.error('[EmailController] Error al verificar SMTP:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al verificar configuración SMTP',
    });
  }
};

export default {
  sendEmail,
  getEmailsByContact,
  getEmailById,
  getEmailStats,
  verifySmtpConfig,
};
