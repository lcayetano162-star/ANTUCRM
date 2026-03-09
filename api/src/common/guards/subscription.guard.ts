import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';


@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Si es Super Admin, saltar validación de suscripción
        if (user?.role === 'SUPER_ADMIN') {
            return true;
        }

        if (!user?.tenantId) {
            return true; // Dejar que TenantGuard maneje esto
        }

        // Buscar el tenant y su suscripción
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: user.tenantId },
            include: {
                subscription: true
            }
        });

        if (!tenant) {
            throw new ForbiddenException('Tenant no encontrado');
        }

        // Permitir acceso solo si el tenant está activo
        if (!tenant.isActive) {
            // Si el estado es de impago o expiración, redirigir verbalmente via error
            // El frontend interceptará este 403 y mostrará el módulo de pago
            throw new ForbiddenException({
                message: 'Tu suscripción ha expirado o el pago ha fallado.',
                code: 'SUBSCRIPTION_REQUIRED',
                status: tenant.subscription?.status || 'INACTIVE'
            });
        }

        if (tenant.subscription && ['UNPAID', 'CANCELED'].includes(tenant.subscription.status)) {
            throw new ForbiddenException({
                message: 'Tu cuenta requiere una suscripción activa.',
                code: 'SUBSCRIPTION_EXPIRED'
            });
        }

        return true;
    }
}
