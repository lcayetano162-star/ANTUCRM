"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var InvoiceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const path = require("path");
const fs = require("fs");
let InvoiceService = InvoiceService_1 = class InvoiceService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(InvoiceService_1.name);
        this.invoiceDir = path.join(process.cwd(), 'uploads', 'invoices');
        if (!fs.existsSync(this.invoiceDir)) {
            fs.mkdirSync(this.invoiceDir, { recursive: true });
        }
    }
    async generateInvoice(paymentLogId) {
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
        if (!payment)
            throw new Error('Pago no encontrado');
        const invoiceNumber = `INV-${Date.now()}-${payment.id.substring(0, 4)}`;
        const fileName = `${invoiceNumber}.pdf`;
        const filePath = path.join(this.invoiceDir, fileName);
        this.logger.log(`Generando factura ${invoiceNumber} para tenant ${payment.tenantId}`);
        const mockContent = `
      ANTÜ CRM - FACTURA DE SERVICIOS
      Número: ${invoiceNumber}
      Fecha: ${new Date().toLocaleDateString()}
      
      Cliente: ${payment.subscription.tenant.name}
      Plan: ${payment.subscription.plan.name || payment.subscription.plan.code}
      Monto: ${payment.amount} ${payment.currency}
      Pasarela: ${payment.gateway}
      Referencia: ${payment.gatewayRef}
      
      Gracias por su confianza.
    `;
        fs.writeFileSync(filePath.replace('.pdf', '.txt'), mockContent);
        const url = `/uploads/invoices/${fileName}`;
        await this.prisma.paymentLog.update({
            where: { id: paymentLogId },
            data: { metadata: { invoiceUrl: url } }
        });
        return url;
    }
};
exports.InvoiceService = InvoiceService;
exports.InvoiceService = InvoiceService = InvoiceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvoiceService);
//# sourceMappingURL=invoice.service.js.map