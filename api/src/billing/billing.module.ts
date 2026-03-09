import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BillingService } from './billing.service';
import { InvoiceService } from './invoice.service';
import { BillingController } from './billing.controller';
import { StripeGateway } from './gateways/stripe.gateway';
import {
    PayPalGateway,
    AzulGateway,
    DLocalGateway,
    TPagoGateway
} from './gateways/other-gateways';

@Module({
    imports: [forwardRef(() => AuthModule)],
    providers: [
        BillingService,
        InvoiceService,
        StripeGateway,
        PayPalGateway,
        AzulGateway,
        DLocalGateway,
        TPagoGateway
    ],
    controllers: [BillingController],
    exports: [BillingService, InvoiceService],
})
export class BillingModule { }
