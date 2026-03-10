import { PrismaService } from '../prisma/prisma.service';
export declare class InvoiceService {
    private readonly prisma;
    private readonly logger;
    private readonly invoiceDir;
    constructor(prisma: PrismaService);
    generateInvoice(paymentLogId: string): Promise<string>;
}
