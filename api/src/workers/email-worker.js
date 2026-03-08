#!/usr/bin/env node
// ============================================
// EMAIL WORKER - Procesador de cola de emails
// ============================================
// Ejecutar: node src/workers/email-worker.js
// O con PM2: pm2 start src/workers/email-worker.js --name email-worker

require('dotenv').config();
const { query, testConnection } = require('../config/database');
const nodemailer = require('nodemailer');
const { generateTrackingPixel } = require('../utils/tracking');

class EmailWorker {
  constructor() {
    this.isRunning = false;
    this.batchSize = parseInt(process.env.EMAIL_BATCH_SIZE) || 50;
    this.intervalMs = parseInt(process.env.EMAIL_WORKER_INTERVAL) || 5000;
    this.maxRetries = 3;
    
    // Configurar transporte SMTP
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5
    });

    // Verificar conexión SMTP
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Error de conexión SMTP:', error);
      } else {
        console.log('✅ Servidor SMTP listo');
      }
    });
  }

  async start() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  📧 EMAIL WORKER - Procesador de Cola                 ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  Batch Size: ${this.batchSize}                                    ║`);
    console.log(`║  Interval: ${this.intervalMs}ms                                ║`);
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');

    // Verificar conexión a BD
    try {
      await testConnection();
      console.log('✅ Conectado a PostgreSQL');
    } catch (error) {
      console.error('❌ Error conectando a PostgreSQL:', error.message);
      process.exit(1);
    }

    this.isRunning = true;

    // Manejar señales de terminación
    process.on('SIGTERM', () => this.stop());
    process.on('SIGINT', () => this.stop());

    // Loop principal
    while (this.isRunning) {
      try {
        await this.processBatch();
      } catch (error) {
        console.error('❌ Error en batch:', error);
      }
      
      await this.sleep(this.intervalMs);
    }
  }

  async processBatch() {
    // Obtener jobs pendientes
    const jobs = await query(`
      SELECT * FROM email_queue 
      WHERE status = 'pending' 
        AND scheduled_at <= NOW()
        AND attempts < max_attempts
      ORDER BY priority ASC, created_at ASC
      LIMIT $1
      FOR UPDATE SKIP LOCKED
    `, [this.batchSize]);

    if (jobs.rows.length === 0) {
      process.stdout.write('.'); // Indicador de actividad
      return;
    }

    console.log(`\n📨 Procesando ${jobs.rows.length} emails...`);

    // Procesar secuencialmente para no saturar SMTP
    for (const job of jobs.rows) {
      await this.sendEmail(job);
    }

    console.log(`✅ Batch completado`);
  }

  async sendEmail(job) {
    const startTime = Date.now();

    try {
      // Marcar como procesando
      await query(`
        UPDATE email_queue 
        SET status = 'processing', attempts = attempts + 1
        WHERE id = $1
      `, [job.id]);

      // Inyectar pixel de tracking
      const trackingPixel = generateTrackingPixel(job.tracking_id);
      const bodyWithTracking = job.body_html + trackingPixel;

      // Enviar email
      const info = await this.transporter.sendMail({
        from: `"${job.from_name || process.env.FROM_NAME}" <${job.from_email || process.env.FROM_EMAIL}>`,
        to: `"${job.to_name}" <${job.to_email}>`,
        subject: job.subject,
        html: bodyWithTracking,
        text: job.body_text || '',
        replyTo: job.reply_to || process.env.REPLY_TO
      });

      const duration = Date.now() - startTime;

      // Actualizar como enviado
      await query(`
        UPDATE email_queue 
        SET status = 'sent', processed_at = NOW(), error_message = NULL
        WHERE id = $1
      `, [job.id]);

      // Actualizar contador de campaña
      await query(`
        UPDATE marketing_campaigns 
        SET sent_count = sent_count + 1
        WHERE id = $1
      `, [job.campaign_id]);

      console.log(`  ✅ ${job.to_email} (${duration}ms)`);

    } catch (error) {
      console.error(`  ❌ ${job.to_email}: ${error.message}`);
      
      const shouldRetry = job.attempts + 1 < (job.max_attempts || this.maxRetries);
      
      await query(`
        UPDATE email_queue 
        SET status = $1, 
            error_message = $2,
            failed_at = NOW()
        WHERE id = $3
      `, [
        shouldRetry ? 'pending' : 'failed',
        error.message,
        job.id
      ]);

      // Si es error permanente (ej: email inválido), marcar como fallido
      if (error.responseCode === 550 || error.responseCode === 551) {
        await query(`
          UPDATE email_queue SET status = 'failed' WHERE id = $1
        `, [job.id]);
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    console.log('\n🛑 Deteniendo Email Worker...');
    this.isRunning = false;
    this.transporter.close();
    process.exit(0);
  }
}

// Iniciar worker
const worker = new EmailWorker();
worker.start().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
