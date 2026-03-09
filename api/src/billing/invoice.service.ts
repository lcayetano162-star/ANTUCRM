import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class InvoiceService {
    private readonly logger = new Logger(InvoiceService.name);
    private readonly invoiceDir = path.join(process.cwd(), 'uploads', 'invoices');

    constructor(private readonly prisma: PrismaService) {
        if (!fs.existsSync(this.invoiceDir)) {
            fs.mkdirSync(this.invoiceDir, { recursive: true });
        }
    }

    /**
     * Genera un comprobante de pago en PDF
     */
    async generateInvoice(paymentLogId: string): Promise<string> {
        const payment = await this.prisma.paymentLog.findUnique({
            where: { id: paymentLogId },
            include: {
                subscription: {
                    include: {
                        plan: true,
                        tenant: true
                    }
                }
            }
        });

        if (!payment) throw new Error('Pago no encontrado');

        const invoiceNumber = `INV-${Date.now()}-${payment.id.substring(0, 4)}`;
        const fileName = `${invoiceNumber}.pdf`;
        const filePath = path.join(this.invoiceDir, fileName);

        this.logger.log(`Generando factura ${invoiceNumber} para tenant ${payment.tenantId}`);

        // MOCK: En un entorno real usaríamos 'pdfkit' o 'puppeteer'
        // simulamos la creación del archivo
        const mockContent = `
      ANTÜ CRM - FACTURA DE SERVICIOS
      Número: ${invoiceNumber}
      Fecha: ${new Date().toLocaleDateString()}
      
      Cliente: ${payment.subscription.tenant.name}
      Plan: ${(payment.subscription.plan as any).name || payment.subscription.plan.code}
      Monto: ${payment.amount} ${payment.currency}
      Pasarela: ${payment.gateway}
      Referencia: ${payment.gatewayRef}
      
      Gracias por su confianza.
    `;

        fs.writeFileSync(filePath.replace('.pdf', '.txt'), mockContent);

        // Retornamos la URL relativa
        const url = `/uploads/invoices/${fileName}`;

        await this.prisma.paymentLog.update({
            where: { id: paymentLogId },
            data: { metadata: { invoiceUrl: url } }
        });

        return url;
    }
}
