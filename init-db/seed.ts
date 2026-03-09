import { PrismaClient, UserRole, ModuleCode } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'antu-crm' },
    update: {},
    create: {
      name: 'ANTÜ CRM',
      slug: 'antu-crm',
      description: 'Plataforma ANTÜ CRM - Tenant principal',
      email: 'CEO@antucrm.com',
      timezone: 'America/Santo_Domingo',
      currency: 'DOP',
      isActive: true,
      settings: {
        language: 'es',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12h',
      },
    },
  });

  console.log(`✅ Tenant created: ${tenant.name}`);

  // Hash de contraseña por defecto (cambiar tras primer login)
  const hashedPassword = await bcrypt.hash('Antu2026!', 12);

  // Super Admin #1 - Luis Cayetano
  const superAdmin1 = await prisma.user.upsert({
    where: { email_tenantId: { email: 'lcayetano162@gmail.com', tenantId: tenant.id } },
    update: {},
    create: {
      email: 'lcayetano162@gmail.com',
      password: hashedPassword,
      firstName: 'Luis',
      lastName: 'Cayetano',
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      isActive: true,
      tenantId: tenant.id,
      permissions: ['*'],
    },
  });
  console.log(`✅ Super Admin #1: ${superAdmin1.email}`);

  // Super Admin #2 - CEO ANTÜ CRM
  const superAdmin2 = await prisma.user.upsert({
    where: { email_tenantId: { email: 'CEO@antucrm.com', tenantId: tenant.id } },
    update: {},
    create: {
      email: 'CEO@antucrm.com',
      password: hashedPassword,
      firstName: 'CEO',
      lastName: 'ANTÜ',
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      isActive: true,
      tenantId: tenant.id,
      permissions: ['*'],
    },
  });
  console.log(`✅ Super Admin #2: ${superAdmin2.email}`);

  // Admin operativo del sistema
  const superAdmin = superAdmin1; // referencia para el resto del seed

  // Create admin user
  const admin = await prisma.user.upsert({
    where: {
      email_tenantId: {
        email: 'admin@antu.crm',
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      email: 'admin@antu.crm',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      emailVerified: true,
      isActive: true,
      tenantId: tenant.id,
      permissions: [
        'users:read',
        'users:write',
        'contacts:read',
        'contacts:write',
        'companies:read',
        'companies:write',
        'opportunities:read',
        'opportunities:write',
        'activities:read',
        'activities:write',
        'documents:read',
        'documents:write',
        'reports:read',
        'settings:read',
        'settings:write',
      ],
    },
  });

  console.log(`✅ Admin created: ${admin.email}`);

  // Create manager user
  const manager = await prisma.user.upsert({
    where: {
      email_tenantId: {
        email: 'manager@antu.crm',
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      email: 'manager@antu.crm',
      password: hashedPassword,
      firstName: 'Manager',
      lastName: 'User',
      role: UserRole.MANAGER,
      emailVerified: true,
      isActive: true,
      tenantId: tenant.id,
      permissions: [
        'contacts:read',
        'contacts:write',
        'companies:read',
        'companies:write',
        'opportunities:read',
        'opportunities:write',
        'activities:read',
        'activities:write',
        'documents:read',
        'reports:read',
      ],
    },
  });

  console.log(`✅ Manager created: ${manager.email}`);

  // Create regular user
  const user = await prisma.user.upsert({
    where: {
      email_tenantId: {
        email: 'user@antu.crm',
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      email: 'user@antu.crm',
      password: hashedPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.USER,
      emailVerified: true,
      isActive: true,
      tenantId: tenant.id,
      permissions: [
        'contacts:read',
        'contacts:write',
        'companies:read',
        'opportunities:read',
        'activities:read',
        'activities:write',
      ],
    },
  });

  console.log(`✅ User created: ${user.email}`);

  // Enable inventory module
  await prisma.tenantModule.upsert({
    where: {
      tenantId_moduleCode: {
        tenantId: tenant.id,
        moduleCode: ModuleCode.INVENTORY,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      moduleCode: ModuleCode.INVENTORY,
      isEnabled: true,
      enabledAt: new Date(),
    },
  });

  console.log('✅ Inventory module enabled');

  // Create default warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'PRINCIPAL',
      },
    },
    update: {},
    create: {
      name: 'Bodega Principal',
      code: 'PRINCIPAL',
      isDefault: true,
      isActive: true,
      tenantId: tenant.id,
      createdById: admin.id,
    },
  });

  console.log(`✅ Warehouse created: ${warehouse.name}`);

  // Create sample categories
  const electronics = await prisma.category.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'Electrónica',
      },
    },
    update: {},
    create: {
      name: 'Electrónica',
      tenantId: tenant.id,
    },
  });

  const office = await prisma.category.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'Oficina',
      },
    },
    update: {},
    create: {
      name: 'Oficina',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Categories created');

  // Create sample products
  const products = [
    {
      sku: 'LAPTOP-001',
      name: 'Laptop Dell Inspiron 15',
      categoryId: electronics.id,
      type: 'PHYSICAL' as const,
      unitOfMeasure: 'unidad',
      averageCost: 45000,
      salePrice: 55000,
      currentStock: 12,
      minStock: 5,
      reorderPoint: 8,
    },
    {
      sku: 'MOUSE-001',
      name: 'Mouse Logitech Wireless',
      categoryId: electronics.id,
      type: 'PHYSICAL' as const,
      unitOfMeasure: 'unidad',
      averageCost: 800,
      salePrice: 1200,
      currentStock: 50,
      minStock: 10,
      reorderPoint: 15,
    },
    {
      sku: 'PAPER-A4',
      name: 'Papel A4 Resma 500 hojas',
      categoryId: office.id,
      type: 'PHYSICAL' as const,
      unitOfMeasure: 'resma',
      averageCost: 150,
      salePrice: 250,
      currentStock: 100,
      minStock: 20,
      reorderPoint: 30,
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: {
        tenantId_sku: {
          tenantId: tenant.id,
          sku: productData.sku,
        },
      },
      update: {},
      create: {
        ...productData,
        tenantId: tenant.id,
        createdById: admin.id,
      },
    });

    // Create inventory item
    await prisma.inventoryItem.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: productData.currentStock,
      },
    });

    // Create initial movement
    await prisma.inventoryMovement.create({
      data: {
        tenantId: tenant.id,
        productId: product.id,
        type: 'INITIAL',
        quantity: productData.currentStock,
        previousStock: 0,
        newStock: productData.currentStock,
        unitCost: productData.averageCost,
        fromWarehouseId: warehouse.id,
        description: 'Carga inicial de inventario',
        createdById: admin.id,
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script',
      },
    });

    console.log(`✅ Product created: ${product.name}`);
  }

  console.log('\n✅ Database seed completed successfully!');
  console.log('\n📧 Credenciales de acceso (password temporal: Antu2026!):');
  console.log('   Super Admin #1: lcayetano162@gmail.com');
  console.log('   Super Admin #2: CEO@antucrm.com');
  console.log('   Admin:          admin@antu.crm');
  console.log('   Manager:        manager@antu.crm');
  console.log('   User:           user@antu.crm');
  console.log('\n🏢 Tenant: antu-crm');
  console.log('\n⚠️  Cambia las contraseñas después del primer login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
