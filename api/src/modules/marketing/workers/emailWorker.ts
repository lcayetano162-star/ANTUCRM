import { query } from '../../../shared/config/database';
import nodemailer from 'nodemailer';
import { generateTrackingPixel, injectLinkTracking } from '../../../shared/utils/tracking';

export class EmailWorker {
  private isRunning = false;

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[EmailWorker] Iniciado');
    // Fire-and-forget: el loop corre en background. Capturar errores fatales.
    this.runLoop().catch((err: Error) => {
      this.isRunning = false;
      console.error('[EmailWorker] Error fatal, worker detenido:', err.message);
    });
  }

  stop(): void {
    this.isRunning = false;
    console.log('[EmailWorker] Detenido');
  }

  private async runLoop(): Promise<void> {
    let consecutiveErrors = 0;
    while (this.isRunning) {
      try {
        await this.processBatch();
        consecutiveErrors = 0;
      } catch (error) {
        consecutiveErrors++;
        console.error(`[EmailWorker] Error en ciclo (${consecutiveErrors} consecutivos):`, error);
        // Backoff: si hay 5 errores seguidos, esperar 5 minutos antes de reintentar
        if (consecutiveErrors >= 5) {
          console.error('[EmailWorker] Demasiados errores consecutivos. Pausando 5 minutos...');
          await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
          consecutiveErrors = 0;
          continue;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30s interval normal
    }
  }

  async processBatch(): Promise<void> {
    const result = await query(
      `SELECT eq.*, t.id as tenant_id
       FROM email_queue eq
       JOIN tenants t ON eq.tenant_id = t.id
       WHERE eq.status = 'pending' AND (eq.scheduled_at IS NULL OR eq.scheduled_at <= NOW())
       ORDER BY eq.created_at ASC LIMIT 10`
    );

    for (const emailJob of result.rows) {
      await this.sendEmail(emailJob);
    }
  }

  // Extrae el intento actual desde el campo error_message (ej: "Retry 2/3: ...")
  private getRetryAttempt(errorMessage: string | null): number {
    if (!errorMessage) return 0;
    const match = errorMessage.match(/^Retry (\d+)\/3:/);
    return match ? parseInt(match[1]) : 0;
  }

  async sendEmail(emailJob: any): Promise<void> {
    const MAX_RETRIES = 3;
    // Backoff: intento 1 → 5 min, intento 2 → 30 min, intento 3 → fallo definitivo
    const RETRY_DELAYS_MIN = [5, 30];

    try {
      await query("UPDATE email_queue SET status = 'processing', updated_at = NOW() WHERE id = $1", [emailJob.id]);

      const settingsResult = await query('SELECT * FROM tenant_email_settings WHERE tenant_id = $1', [emailJob.tenant_id]);
      if (settingsResult.rows.length === 0) {
        await query(
          "UPDATE email_queue SET status = 'failed', error_message = 'Sin configuración SMTP', updated_at = NOW() WHERE id = $1",
          [emailJob.id]
        );
        return;
      }

      const settings = settingsResult.rows[0];
      const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_secure,
        auth: { user: settings.smtp_user, pass: settings.smtp_password },
        connectionTimeout: 10000, // 10s timeout de conexión SMTP
        greetingTimeout: 10000,
      });

      // Inject tracking pixel and link tracking
      let htmlContent = emailJob.html_content || '';
      const trackingPixel = generateTrackingPixel(emailJob.tracking_id);
      const trackingResult = injectLinkTracking(htmlContent, emailJob.tracking_id, emailJob.campaign_id || 'default');
      htmlContent = trackingResult.html + trackingPixel;

      await transporter.sendMail({
        from: settings.from_email,
        to: emailJob.to_email,
        subject: emailJob.subject,
        html: htmlContent,
        text: emailJob.text_content
      });

      await query("UPDATE email_queue SET status = 'sent', sent_at = NOW(), updated_at = NOW() WHERE id = $1", [emailJob.id]);

    } catch (error: any) {
      const attempt = this.getRetryAttempt(emailJob.error_message);

      if (attempt < MAX_RETRIES - 1) {
        // Reagendar con backoff exponencial
        const delayMin = RETRY_DELAYS_MIN[attempt] || 60;
        const nextRetry = new Date(Date.now() + delayMin * 60 * 1000).toISOString();
        const retryMsg = `Retry ${attempt + 1}/3: ${error.message}`;
        console.warn(`[EmailWorker] Email ${emailJob.id} fallido. Reintento ${attempt + 1}/3 en ${delayMin} min.`);
        await query(
          "UPDATE email_queue SET status = 'pending', scheduled_at = $1, error_message = $2, updated_at = NOW() WHERE id = $3",
          [nextRetry, retryMsg, emailJob.id]
        );
      } else {
        // Agotados los reintentos
        console.error(`[EmailWorker] Email ${emailJob.id} falló definitivamente tras ${MAX_RETRIES} intentos:`, error.message);
        await query(
          "UPDATE email_queue SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2",
          [`Failed after ${MAX_RETRIES} attempts: ${error.message}`, emailJob.id]
        );
      }
    }
  }
}

export const emailWorker = new EmailWorker();
