const bcrypt = require('bcryptjs');
const { query } = require('./database');

const seedDatabase = async () => {
  console.log('🌱 Creando datos iniciales...');

  try {
    // ============================================
    // 1. Crear Planes de Suscripción
    // ============================================
    console.log('📋 Creando planes...');
    
    const plans = [
      {
        name: 'Básico',
        slug: 'basico',
        description: 'Ideal para pequeños negocios que están comenzando',
        price_monthly: 29.00,
        price_yearly: 290.00,
        features: JSON.stringify([
          'Hasta 3 usuarios',
          'Hasta 500 clientes',
          'Pipeline de ventas básico',
          'Gestión de tareas',
          'Soporte por email'
        ]),
        limits: JSON.stringify({ max_users: 3, max_clients: 500, max_storage: 1073741824 }),
        sort_order: 1
      },
      {
        name: 'Profesional',
        slug: 'profesional',
        description: 'Para empresas en crecimiento que necesitan más potencia',
        price_monthly: 79.00,
        price_yearly: 790.00,
        features: JSON.stringify([
          'Hasta 10 usuarios',
          'Clientes ilimitados',
          'Pipeline avanzado',
          'Automatizaciones',
          'Reportes personalizados',
          'Soporte prioritario'
        ]),
        limits: JSON.stringify({ max_users: 10, max_clients: -1, max_storage: 10737418240 }),
        sort_order: 2
      },
      {
        name: 'Empresarial',
        slug: 'empresarial',
        description: 'Solución completa para grandes organizaciones',
        price_monthly: 199.00,
        price_yearly: 1990.00,
        features: JSON.stringify([
          'Usuarios ilimitados',
          'Clientes ilimitados',
          'Todas las funcionalidades',
          'API access',
          'Integraciones personalizadas',
          'Soporte dedicado 24/7',
          'On-premise opcional'
        ]),
        limits: JSON.stringify({ max_users: -1, max_clients: -1, max_storage: 1099511627776 }),
        sort_order: 3
      }
    ];

    for (const plan of plans) {
      await query(
        `INSERT INTO plans (name, slug, description, price_monthly, price_yearly, features, limits, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (slug) DO UPDATE SET 
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           price_monthly = EXCLUDED.price_monthly,
           price_yearly = EXCLUDED.price_yearly,
           features = EXCLUDED.features,
           limits = EXCLUDED.limits,
           sort_order = EXCLUDED.sort_order`,
        [plan.name, plan.slug, plan.description, plan.price_monthly, plan.price_yearly, 
         plan.features, plan.limits, plan.sort_order]
      );
    }
    console.log('✅ Planes creados');

    // ============================================
    // 2. Crear Super Admin en Landlord
    // ============================================
    console.log('👤 Creando Super Admin...');
    
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'lcayetano162@gmail.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'AntuCRM2024!';
    const passwordHash = await bcrypt.hash(superAdminPassword, 10);

    await query(
      `INSERT INTO landlord_users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET 
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         is_active = EXCLUDED.is_active`,
      [superAdminEmail, passwordHash, 'Luis', 'Cayetano', 'superadmin', true]
    );
    console.log('✅ Super Admin creado');

    // ============================================
    // 3. Crear Tenant Principal (SOLO en desarrollo)
    // ============================================
    // En producción: evita crear datos demo para que los nuevos tenants
    // no hereden ni confundan esta información.
    if (process.env.NODE_ENV === 'production' || process.env.SKIP_DEMO_SEED === 'true') {
      console.log('⏭️  Saltando demo tenant (producción o SKIP_DEMO_SEED=true)');
      console.log('');
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║  ✅ SEED COMPLETADO (sin datos demo)                   ║');
      console.log(`║  Super Admin: ${superAdminEmail.padEnd(41)}║`);
      console.log('╚════════════════════════════════════════════════════════╝');
      process.exit(0);
    }
    console.log('🏢 Creando tenant principal (demo)...');
    
    const planResult = await query("SELECT id FROM plans WHERE slug = 'empresarial'");
    const enterprisePlanId = planResult.rows[0]?.id;

    const tenantResult = await query(
      `INSERT INTO tenants (name, slug, domain, plan_id, status, database_name, settings)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (slug) DO UPDATE SET 
         name = EXCLUDED.name,
         plan_id = EXCLUDED.plan_id,
         status = EXCLUDED.status
       RETURNING id`,
      ['Antü CRM Principal', 'antucrm-principal', 'antucrm.com', enterprisePlanId, 'active', 
       'antucrm_principal', JSON.stringify({ timezone: 'America/Santo_Domingo', currency: 'DOP' })]
    );
    const tenantId = tenantResult.rows[0].id;
    console.log('✅ Tenant creado');

    // ============================================
    // 4. Crear Usuarios en el Tenant
    // ============================================
    console.log('👥 Creando usuarios del tenant...');

    // Admin del tenant
    const adminHash = await bcrypt.hash('admin123', 10);
    const adminResult = await query(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (tenant_id, email) DO UPDATE SET 
         password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [tenantId, 'admin@antucrm.com', adminHash, 'Administrador', 'Sistema', 'admin', true]
    );

    // Vendedor
    const sellerHash = await bcrypt.hash('vendedor123', 10);
    const sellerResult = await query(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (tenant_id, email) DO UPDATE SET 
         password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [tenantId, 'vendedor@antucrm.com', sellerHash, 'Vendedor', 'Demo', 'seller', true]
    );

    // Gerente de Ventas
    const managerHash = await bcrypt.hash('gerente123', 10);
    const managerResult = await query(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (tenant_id, email) DO UPDATE SET 
         password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [tenantId, 'gerente@antucrm.com', managerHash, 'Gerente', 'Ventas', 'sales_manager', true]
    );
    console.log('✅ Usuarios creados');

    // ============================================
    // 5. Crear Clientes de Ejemplo
    // ============================================
    console.log('📁 Creando clientes de ejemplo...');
    
    const clients = [
      { name: 'Tecnología Avanzada SRL', rnc: '101-12345-6', status: 'client', email: 'info@tecavanzada.com' },
      { name: 'Soluciones Digitales RD', rnc: '102-67890-1', status: 'client', email: 'contacto@solucionesdigitales.do' },
      { name: 'Constructora del Caribe', rnc: '103-45678-9', status: 'prospect', email: 'ventas@constructoracaribe.com' },
      { name: 'Importadora Nacional', rnc: '104-98765-4', status: 'prospect', email: 'info@importnacional.do' },
      { name: 'Servicios Financieros ABC', rnc: '105-23456-7', status: 'archived', email: 'contacto@finabc.com' },
    ];

    for (const client of clients) {
      await query(
        `INSERT INTO clients (tenant_id, name, rnc, email, status, assigned_to, city)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [tenantId, client.name, client.rnc, client.email, client.status, sellerResult.rows[0].id, 'Santo Domingo']
      );
    }
    console.log('✅ Clientes creados');

    // ============================================
    // 6. Crear Contactos de Ejemplo
    // ============================================
    console.log('📇 Creando contactos...');
    
    const clientResult = await query('SELECT id FROM clients WHERE tenant_id = $1 LIMIT 1', [tenantId]);
    if (clientResult.rows.length > 0) {
      const clientId = clientResult.rows[0].id;
      
      await query(
        `INSERT INTO contacts (tenant_id, client_id, first_name, last_name, email, phone, position, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [tenantId, clientId, 'Juan', 'Pérez', 'jperez@tecavanzada.com', '809-555-0101', 'Director General', true]
      );
      
      await query(
        `INSERT INTO contacts (tenant_id, client_id, first_name, last_name, email, phone, position, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [tenantId, clientId, 'María', 'García', 'mgarcia@tecavanzada.com', '809-555-0102', 'Gerente de Ventas', false]
      );
    }
    console.log('✅ Contactos creados');

    // ============================================
    // 7. Crear Oportunidades de Ejemplo
    // ============================================
    console.log('💼 Creando oportunidades...');
    
    const clientsResult = await query('SELECT id, name FROM clients WHERE tenant_id = $1', [tenantId]);
    const sellerId = sellerResult.rows[0]?.id;
    
    const opportunities = [
      { name: 'Implementación CRM Premium', stage: 'proposal', probability: 70, revenue: 15000 },
      { name: 'Licencias Anuales', stage: 'negotiation', probability: 90, revenue: 8500 },
      { name: 'Consultoría Digital', stage: 'qualify', probability: 30, revenue: 5000 },
    ];

    for (let i = 0; i < opportunities.length; i++) {
      const opp = opportunities[i];
      const clientId = clientsResult.rows[i % clientsResult.rows.length]?.id;
      
      await query(
        `INSERT INTO opportunities (tenant_id, name, client_id, owner_id, stage, probability, estimated_revenue, expected_close_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [tenantId, opp.name, clientId, sellerId, opp.stage, opp.probability, opp.revenue, 
         new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
      );
    }
    console.log('✅ Oportunidades creadas');

    // ============================================
    // RESUMEN
    // ============================================
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ SEED COMPLETADO - CREDENCIALES DE ACCESO           ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  🌐 Super Admin (Landlord):                            ║`);
    console.log(`║     Email:    ${superAdminEmail.padEnd(40)} ║`);
    console.log(`║     Password: ${superAdminPassword.padEnd(40)} ║`);
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  👤 Usuarios del Tenant:                               ║`);
    console.log(`║     admin@antucrm.com / admin123                       ║`);
    console.log(`║     vendedor@antucrm.com / vendedor123                 ║`);
    console.log(`║     gerente@antucrm.com / gerente123                   ║`);
    console.log('╚════════════════════════════════════════════════════════╝');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

seedDatabase();
