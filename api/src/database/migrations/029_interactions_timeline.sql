-- Migration 029: Timeline Unificado de Interacciones

DO $$ BEGIN
    CREATE TYPE channel_type AS ENUM ('email', 'whatsapp', 'sms', 'call', 'note', 'meeting');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE direction_type AS ENUM ('inbound', 'outbound', 'internal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE status_type AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed', 'bounced', 'replied');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    channel channel_type NOT NULL,
    direction direction_type NOT NULL DEFAULT 'outbound',
    status status_type NOT NULL DEFAULT 'pending',
    subject VARCHAR(500),
    content TEXT NOT NULL,
    content_preview VARCHAR(300),
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255) NOT NULL,
    cc_addresses TEXT[],
    bcc_addresses TEXT[],
    provider VARCHAR(50) NOT NULL DEFAULT 'system',
    external_id VARCHAR(255),
    thread_id VARCHAR(255),
    metadata JSONB NOT NULL DEFAULT '{}',
    ai_insight JSONB,
    ai_status VARCHAR(20) DEFAULT 'pending',
    ai_processed_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    parent_id UUID REFERENCES interactions(id) ON DELETE SET NULL,
    thread_depth INTEGER DEFAULT 0,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_client_timeline ON interactions(tenant_id, client_id, created_at DESC);
CREATE INDEX idx_interactions_thread ON interactions(tenant_id, thread_id, created_at ASC);
CREATE INDEX idx_interactions_ai_pending ON interactions(ai_status) WHERE ai_status = 'pending';

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interactions_updated_at
    BEFORE UPDATE ON interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
