-- PushSMS - PostgreSQL Schema
-- Run: psql -U postgres -d PushSMS -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TENANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  country     VARCHAR(10),
  timezone    VARCHAR(100) DEFAULT 'UTC',
  currency    VARCHAR(10) DEFAULT 'XAF',
  status      VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','suspended','inactive')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name      VARCHAR(100),
  last_name       VARCHAR(100),
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(30),
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(20) DEFAULT 'OPERATOR' CHECK (role IN ('ADMIN','OPERATOR')),
  status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','suspended','inactive')),
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- WALLETS
-- ============================================================
CREATE TABLE IF NOT EXISTS wallets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  balance           DECIMAL(15,4) DEFAULT 0 CHECK (balance >= 0),
  reserved_balance  DECIMAL(15,4) DEFAULT 0 CHECK (reserved_balance >= 0),
  status            VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','frozen')),
  last_recharge_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENT TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  amount              DECIMAL(15,4) NOT NULL CHECK (amount > 0),
  currency            VARCHAR(10) DEFAULT 'XAF',
  payment_method      VARCHAR(50),
  external_reference  VARCHAR(255),
  status              VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','failed','cancelled','refunded')),
  description         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_tenant ON payment_transactions(tenant_id);

-- ============================================================
-- WALLET TRANSACTIONS (ledger)
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id               UUID NOT NULL REFERENCES wallets(id),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  payment_transaction_id  UUID REFERENCES payment_transactions(id),
  campaign_id             UUID,
  type                    VARCHAR(20) NOT NULL CHECK (type IN ('CREDIT','DEBIT','RESERVE','RELEASE','REFUND')),
  direction               VARCHAR(5) NOT NULL CHECK (direction IN ('IN','OUT')),
  amount                  DECIMAL(15,4) NOT NULL CHECK (amount > 0),
  balance_before          DECIMAL(15,4) NOT NULL,
  balance_after           DECIMAL(15,4) NOT NULL,
  description             TEXT,
  metadata                JSONB,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_tenant ON wallet_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_id);

-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name      VARCHAR(100),
  last_name       VARCHAR(100),
  phone_number    VARCHAR(30) NOT NULL,
  email           VARCHAR(255),
  country         VARCHAR(10),
  city            VARCHAR(100),
  opt_in_status   VARCHAR(20) DEFAULT 'opted_in' CHECK (opt_in_status IN ('opted_in','opted_out')),
  status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number);

-- ============================================================
-- CONTACT LISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_lists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  member_count  INT DEFAULT 0,
  status        VARCHAR(20) DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_lists_tenant ON contact_lists(tenant_id);

-- ============================================================
-- CONTACT LIST MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_list_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_list_id  UUID NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,
  contact_id       UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  added_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (contact_list_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_clm_list ON contact_list_members(contact_list_id);
CREATE INDEX IF NOT EXISTS idx_clm_contact ON contact_list_members(contact_id);

-- ============================================================
-- OPT OUTS
-- ============================================================
CREATE TABLE IF NOT EXISTS opt_outs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  contact_id            UUID REFERENCES contacts(id),
  phone_number          VARCHAR(30) NOT NULL,
  channel               VARCHAR(20) DEFAULT 'MANUAL',
  reason                TEXT,
  processed_by_user_id  UUID REFERENCES users(id),
  opted_out_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_opt_outs_tenant ON opt_outs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opt_outs_phone ON opt_outs(phone_number);

-- ============================================================
-- SENDER IDS
-- ============================================================
CREATE TABLE IF NOT EXISTS sender_ids (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  value       VARCHAR(15) NOT NULL,
  type        VARCHAR(20) DEFAULT 'ALPHANUMERIC' CHECK (type IN ('ALPHANUMERIC','LONGCODE','SHORTCODE')),
  status      VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','active','inactive')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, value)
);

-- ============================================================
-- SMS TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS sms_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  body        TEXT NOT NULL,
  variables   JSONB DEFAULT '[]',
  category    VARCHAR(50),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_templates_tenant ON sms_templates(tenant_id);

-- ============================================================
-- SMS PROVIDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS sms_providers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) UNIQUE NOT NULL,
  api_base_url  TEXT NOT NULL,
  auth_type     VARCHAR(30) DEFAULT 'query_param',
  status        VARCHAR(20) DEFAULT 'active',
  priority      INT DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROVIDER PRICING
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_pricing (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES sms_providers(id),
  country_code    VARCHAR(10) NOT NULL,
  currency        VARCHAR(10) DEFAULT 'XAF',
  price_per_sms   DECIMAL(12,6) NOT NULL,
  price_per_part  DECIMAL(12,6),
  effective_from  TIMESTAMPTZ DEFAULT NOW(),
  effective_to    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pricing_provider ON provider_pricing(provider_id);

-- ============================================================
-- CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  created_by_user_id  UUID NOT NULL REFERENCES users(id),
  sender_id           UUID REFERENCES sender_ids(id),
  contact_list_id     UUID REFERENCES contact_lists(id),
  template_id         UUID REFERENCES sms_templates(id),
  name                VARCHAR(255) NOT NULL,
  message_body        TEXT NOT NULL,
  type                VARCHAR(30) DEFAULT 'MARKETING' CHECK (type IN ('MARKETING','TRANSACTIONAL')),
  status              VARCHAR(30) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SCHEDULED','PROCESSING','COMPLETED','FAILED','CANCELLED')),
  scheduled_at        TIMESTAMPTZ,
  launched_at         TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  target_count        INT DEFAULT 0,
  sent_count          INT DEFAULT 0,
  delivered_count     INT DEFAULT 0,
  failed_count        INT DEFAULT 0,
  estimated_cost      DECIMAL(15,4),
  actual_cost         DECIMAL(15,4),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- ============================================================
-- CAMPAIGN RECIPIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  contact_id   UUID REFERENCES contacts(id),
  phone_number VARCHAR(30) NOT NULL,
  status       VARCHAR(20) DEFAULT 'queued',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipients_campaign ON campaign_recipients(campaign_id);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  campaign_id             UUID REFERENCES campaigns(id),
  campaign_recipient_id   UUID REFERENCES campaign_recipients(id),
  contact_id              UUID REFERENCES contacts(id),
  provider_id             UUID REFERENCES sms_providers(id),
  destination_number      VARCHAR(30) NOT NULL,
  sender_value            VARCHAR(15) NOT NULL,
  body                    TEXT NOT NULL,
  parts_count             INT DEFAULT 1,
  unit_price              DECIMAL(12,6),
  total_price             DECIMAL(15,4),
  provider_message_id     VARCHAR(255),
  status                  VARCHAR(20) DEFAULT 'queued',
  queued_at               TIMESTAMPTZ DEFAULT NOW(),
  sent_at                 TIMESTAMPTZ,
  delivered_at            TIMESTAMPTZ,
  failed_at               TIMESTAMPTZ,
  failure_reason          TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_campaign ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- ============================================================
-- MESSAGE EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS message_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id       UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  event_type       VARCHAR(50) NOT NULL,
  event_date       TIMESTAMPTZ DEFAULT NOW(),
  provider_status  VARCHAR(50),
  raw_payload      JSONB,
  reason_code      VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_msg_events_message ON message_events(message_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  user_id      UUID REFERENCES users(id),
  action       VARCHAR(100) NOT NULL,
  entity_type  VARCHAR(100),
  entity_id    UUID,
  metadata     JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ============================================================
-- API KEYS
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  key_prefix   VARCHAR(10) NOT NULL,
  secret_hash  VARCHAR(255) NOT NULL,
  status       VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','revoked')),
  expires_at   TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['tenants','users','wallets','contacts','contact_lists','sender_ids','sms_templates','campaigns'] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s;
      CREATE TRIGGER trg_%s_updated_at
      BEFORE UPDATE ON %s
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END;
$$;
