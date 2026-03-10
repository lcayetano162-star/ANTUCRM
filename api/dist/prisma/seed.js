"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seed: Iniciando...');
    const adminRole = await prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: { name: 'ADMIN', description: 'Administrador del sistema' }
    });
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'canon-rd' },
        update: {},
        create: {
            name: 'Canon RD',
            slug: 'canon-rd',
            isActive: true
        }
    });
    const passwordHash = await bcrypt.hash('Admin123!', 12);
    await prisma.user.upsert({
        where: { email: 'admin@canon.com.do' },
        update: {
            passwordHash,
            tenantId: tenant.id,
            roleId: adminRole.id
        },
        create: {
            email: 'admin@canon.com.do',
            passwordHash,
            firstName: 'Admin',
            lastName: 'Local',
            tenantId: tenant.id,
            roleId: adminRole.id
        }
    });
    const plans = [
        { code: 'STARTER', priceMonthly: 99.00, priceYearly: 990.00 },
        { code: 'BUSINESS', priceMonthly: 299.00, priceYearly: 2990.00 },
        { code: 'ENTERPRISE', priceMonthly: 799.00, priceYearly: 7990.00 }
    ];
    for (const plan of plans) {
        await prisma.plan.upsert({
            where: { code: plan.code },
            update: plan,
            create: plan
        });
    }
    console.log('Seed exitoso: admin@canon.com.do / Admin123!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map