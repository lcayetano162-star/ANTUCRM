const { query, testConnection } = require('./database');

const migrations = [
  // ============================================
  // LANDLORD TABLES (Multi-Tenant SaaS)
  // ============================================
  
  // Enable UUID extension
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
  
  // Plans table for subscription packages
  `CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    features JSONB DEFAULT '[]',
    limits JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Tenants table for companies/instances
  `CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    plan_id UUID REFERENCES plans(id),
    database_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    billing_info JSONB DEFAULT '{}',
    trial_ends_at TIMESTAMP,
    subscribed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Landlord users (Super Admins)
  `CREATE TABLE IF NOT EXISTS landlord_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'superadmin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Tenant-Users link table
  `CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    is_owner BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // ============================================
  // TENANT TABLES (Per-company data)
  // ============================================
  
  // Users table (tenant-specific)
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'seller',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    password_changed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
  );`,
  
  // Contacts table (for clients/prospects)
  `CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    position VARCHAR(100),
    department VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    client_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Clients table (con soporte para Leads integrado)
  `CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Información básica
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    rnc VARCHAR(50),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    email VARCHAR(255),
    
    -- Dirección
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'República Dominicana',
    
    -- Tipo de contacto: 'lead', 'prospect', 'client', 'inactive'
    contact_type VARCHAR(20) DEFAULT 'lead',
    
    -- Estado del lead: 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'
    lead_status VARCHAR(30) DEFAULT 'new',
    
    -- Fuente del lead
    source VARCHAR(100),
    lead_source VARCHAR(50),
    
    -- Asignación
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMP,
    
    -- Puntuación del lead (0-100)
    lead_score INTEGER DEFAULT 0,
    
    -- Tracking de campañas
    campaign_id UUID,
    landing_page_id VARCHAR(100),
    
    -- UTM parameters
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- Tiempos de contacto
    first_contact_at TIMESTAMP,
    last_contact_at TIMESTAMP,
    converted_at TIMESTAMP,
    
    -- Datos fiscales (requeridos para clientes)
    billing_info JSONB DEFAULT '{}',
    
    -- Notas
    notes TEXT,
    
    -- Estado activo
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Opportunities table
  `CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id),
    contact_id UUID REFERENCES contacts(id),
    owner_id UUID REFERENCES users(id),
    stage VARCHAR(20) DEFAULT 'qualify',
    probability INTEGER DEFAULT 0,
    estimated_revenue DECIMAL(15, 2) DEFAULT 0,
    expected_close_date DATE,
    actual_close_date DATE,
    source VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Quotes table
  `CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id),
    opportunity_id UUID REFERENCES opportunities(id),
    status VARCHAR(20) DEFAULT 'draft',
    subtotal DECIMAL(15, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_monthly DECIMAL(15, 2) DEFAULT 0,
    total_onetime DECIMAL(15, 2) DEFAULT 0,
    valid_until DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Quote items table
  `CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(15, 2) DEFAULT 0,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    total_price DECIMAL(15, 2) DEFAULT 0,
    is_recurring BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Tasks table
  `CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    related_to_type VARCHAR(50),
    related_to_id UUID,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Activities/Notes table
  `CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    description TEXT,
    related_to_type VARCHAR(50),
    related_to_id UUID,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // ============================================
  // MARKETING TABLES
  // ============================================
  
  // Marketing Campaigns
  `CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'email',
    subject VARCHAR(255) NOT NULL,
    content TEXT,
    segment_id UUID,
    audience_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    open_rate DECIMAL(5, 2) DEFAULT 0,
    click_rate DECIMAL(5, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Marketing Automations
  `CREATE TABLE IF NOT EXISTS marketing_automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_config JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Marketing Automation Actions
  `CREATE TABLE IF NOT EXISTS marketing_automation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_id UUID REFERENCES marketing_automations(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_config JSONB DEFAULT '{}',
    sequence INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Automation Logs
  `CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_id UUID REFERENCES marketing_automations(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id),
    action_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Marketing Segments
  `CREATE TABLE IF NOT EXISTS marketing_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    criteria JSONB DEFAULT '{}',
    contact_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // ============================================
  // INDEXES
  // ============================================
  `CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
  `CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);`,
  `CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);`,
  `CREATE INDEX IF NOT EXISTS idx_contacts_client ON contacts(client_id);`,
  `CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);`,
  `CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);`,
  `CREATE INDEX IF NOT EXISTS idx_clients_assigned ON clients(assigned_to);`,
  `CREATE INDEX IF NOT EXISTS idx_opportunities_tenant ON opportunities(tenant_id);`,
  `CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);`,
  `CREATE INDEX IF NOT EXISTS idx_opportunities_owner ON opportunities(owner_id);`,
  `CREATE INDEX IF NOT EXISTS idx_quotes_tenant ON quotes(tenant_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);`,
  `CREATE INDEX IF NOT EXISTS idx_activities_tenant ON activities(tenant_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);`,
  `CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants(plan_id);`,
  
  // Email Queue (Cola de envío)
  `CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    to_email VARCHAR(255) NOT NULL,
    to_name VARCHAR(255),
    subject VARCHAR(500),
    body_html TEXT,
    body_text TEXT,
    tracking_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    delivered_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // Email Tracking Logs (El "Chismoso")
  `CREATE TABLE IF NOT EXISTS email_tracking_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id VARCHAR(100) NOT NULL,
    campaign_id UUID REFERENCES marketing_campaigns(id),
    contact_id UUID REFERENCES clients(id),
    tenant_id UUID REFERENCES tenants(id),
    event_type VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    link_url TEXT,
    link_id VARCHAR(100),
    country_code VARCHAR(2),
    city VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // Campaign Links (Links trackeables)
  `CREATE TABLE IF NOT EXISTS campaign_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    link_id VARCHAR(100) NOT NULL,
    original_url TEXT NOT NULL,
    tracking_url TEXT NOT NULL,
    click_count INTEGER DEFAULT 0,
    unique_click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, link_id)
  );`,

  // WhatsApp Links Generados
  `CREATE TABLE IF NOT EXISTS whatsapp_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES clients(id),
    campaign_id UUID REFERENCES marketing_campaigns(id),
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    encoded_message TEXT NOT NULL,
    wa_link TEXT NOT NULL,
    short_code VARCHAR(50),
    click_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // Automation Execution Logs
  `CREATE TABLE IF NOT EXISTS automation_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_id UUID REFERENCES marketing_automations(id),
    contact_id UUID REFERENCES clients(id),
    status VARCHAR(20),
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // Marketing indexes
  `CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_tenant ON marketing_campaigns(tenant_id);`,
  `CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);`,
  `CREATE INDEX IF NOT EXISTS idx_marketing_automations_tenant ON marketing_automations(tenant_id);`,
  `CREATE INDEX IF NOT EXISTS idx_marketing_segments_tenant ON marketing_segments(tenant_id);`,
  `CREATE INDEX IF NOT EXISTS idx_automation_logs_automation ON automation_logs(automation_id);`,
  
  // Email queue indexes
  `CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);`,
  `CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_at);`,
  `CREATE INDEX IF NOT EXISTS idx_email_queue_campaign ON email_queue(campaign_id);`,
  `CREATE INDEX IF NOT EXISTS idx_email_queue_tracking ON email_queue(tracking_id);`,
  
  // Tracking logs indexes
  `CREATE INDEX IF NOT EXISTS idx_tracking_logs_tracking ON email_tracking_logs(tracking_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tracking_logs_event ON email_tracking_logs(event_type);`,
  `CREATE INDEX IF NOT EXISTS idx_tracking_logs_campaign ON email_tracking_logs(campaign_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tracking_logs_created ON email_tracking_logs(created_at);`,
  
  // Campaign links indexes
  `CREATE INDEX IF NOT EXISTS idx_campaign_links_campaign ON campaign_links(campaign_id);`,
  `CREATE INDEX IF NOT EXISTS idx_campaign_links_link ON campaign_links(link_id);`,
  
  // Clients/Leads indexes
  `CREATE INDEX IF NOT EXISTS idx_clients_contact_type ON clients(contact_type);`,
  `CREATE INDEX IF NOT EXISTS idx_clients_lead_status ON clients(lead_status);`,
  `CREATE INDEX IF NOT EXISTS idx_clients_lead_source ON clients(lead_source);`,
  `CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);`,
  `CREATE INDEX IF NOT EXISTS idx_clients_campaign_id ON clients(campaign_id);`,
  `CREATE INDEX IF NOT EXISTS idx_clients_lead_score ON clients(lead_score);`,
  
  // WhatsApp links indexes
  `CREATE INDEX IF NOT EXISTS idx_whatsapp_links_tenant ON whatsapp_links(tenant_id);`,
  `CREATE INDEX IF NOT EXISTS idx_whatsapp_links_contact ON whatsapp_links(contact_id);`,
];

const seedData = async () => {
  try {
    // Check if plans exist
    const plansResult = await query('SELECT COUNT(*) as count FROM plans');
    if (parseInt(plansResult.rows[0].count) === 0) {
      console.log('🌱 Insertando planes iniciales...');
      await query(`
        INSERT INTO plans (name, slug, description, price_monthly, price_yearly, features, limits) VALUES
        ('Básico', 'basico', 'Plan básico para pequeñas empresas', 29, 290, '["Hasta 5 usuarios", "1000 contactos", "Soporte por email"]'::jsonb, '{"users": 5, "contacts": 1000}'::jsonb),
        ('Profesional', 'profesional', 'Plan para empresas en crecimiento', 79, 790, '["Hasta 20 usuarios", "10000 contactos", "Soporte prioritario", "Reportes avanzados"]'::jsonb, '{"users": 20, "contacts": 10000}'::jsonb),
        ('Empresarial', 'empresarial', 'Plan completo para grandes empresas', 199, 1990, '["Usuarios ilimitados", "Contactos ilimitados", "Soporte 24/7", "API access", "Personalización completa"]'::jsonb, '{"users": -1, "contacts": -1}'::jsonb)
      `);
      console.log('✅ Planes insertados');
    }

    // Check if super admin exists
    const adminResult = await query('SELECT COUNT(*) as count FROM landlord_users WHERE email = $1', ['lcayetano162@gmail.com']);
    if (parseInt(adminResult.rows[0].count) === 0) {
      console.log('🌱 Creando Super Admin inicial...');
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash('AntuCRM2024!', 10);
      await query(`
        INSERT INTO landlord_users (email, password_hash, first_name, last_name, role, is_active)
        VALUES ($1, $2, 'Super', 'Admin', 'superadmin', true)
      `, ['lcayetano162@gmail.com', passwordHash]);
      console.log('✅ Super Admin creado');
    }
  } catch (error) {
    console.error('❌ Error en seed:', error.message);
  }
};

const runMigrations = async () => {
  console.log('🔄 Verificando conexión a base de datos...');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Port: ${process.env.DB_PORT || '5432'}`);
  console.log(`   Database: ${process.env.DB_NAME || 'antucrm_production'}`);
  console.log(`   User: ${process.env.DB_USER || 'antucrm_admin'}`);
  
  try {
    await testConnection();
    console.log('✅ Conexión exitosa\n');
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error.message);
    console.error('\nVerifique que:');
    console.error('  1. PostgreSQL está ejecutándose');
    console.error('  2. Las credenciales en .env son correctas');
    console.error('  3. El host y puerto son accesibles');
    process.exit(1);
  }

  console.log('🔄 Ejecutando migraciones...\n');
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < migrations.length; i++) {
    try {
      await query(migrations[i]);
      successCount++;
    } catch (error) {
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate key') ||
          error.code === '42P07' ||  // PostgreSQL: relation already exists
          error.code === '42710') {  // PostgreSQL: constraint already exists
        skipCount++;
      } else {
        console.error(`❌ Error en migración ${i + 1}:`, error.message);
        errorCount++;
      }
    }
  }

  console.log('\n📊 Resumen de migraciones:');
  console.log(`   ✅ Exitosas: ${successCount}`);
  console.log(`   ⏭️  Ya existían: ${skipCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n✅ Migraciones completadas exitosamente');
    await seedData();
  } else {
    console.log('\n⚠️  Algunas migraciones fallaron');
  }

  process.exit(errorCount > 0 ? 1 : 0);
};

runMigrations();
