import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  tenantId: string;
  userId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();

    // Middleware RLS desactivado para compatibilidad Prisma 6
    /*
    this.$use(async (params, next) => {
      const tenantContext = tenantStorage.getStore();

      if (tenantContext) {
        // Establecer variables de sesión de PostgreSQL para RLS
        await this.$executeRawUnsafe(
          `SET LOCAL app.current_tenant_id = '${tenantContext.tenantId}';
           SET LOCAL app.current_user_id = '${tenantContext.userId}';`,
        );
      }

      const result = await next(params);

      // Limpiar variables de sesión
      if (tenantContext) {
        await this.$executeRawUnsafe(
          'RESET app.current_tenant_id; RESET app.current_user_id;',
        );
      }

      return result;
    });
    */
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('No se puede limpiar la base de datos en producción');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => typeof key === 'string' && !key.startsWith('_') && !key.startsWith('$'),
    );

    return Promise.all(
      models.map((modelKey) => (this as any)[modelKey].deleteMany()),
    );
  }
}
