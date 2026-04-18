-- PushSMS - Seed data
-- Creates a demo tenant + admin user + ObitSMS provider

-- Demo tenant
INSERT INTO tenants (id, name, slug, country, timezone, currency, status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Demo Company',
  'demo-company',
  'CM',
  'Africa/Douala',
  'XAF',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Admin user (password: Admin1234!)
-- hash generated with: bcryptjs.hashSync('Admin1234!', 12)
INSERT INTO users (id, tenant_id, first_name, last_name, email, password_hash, role, status)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Admin',
  'Demo',
  'admin@demo.com',
  '$2b$12$8vK9wXyWXzV3cKGaiyoBJOKp4aXYQBfodzNHhrw95OA0aMi.dvF9W',
  'ADMIN',
  'active'
) ON CONFLICT DO NOTHING;

-- Wallet for demo tenant
INSERT INTO wallets (tenant_id, balance, reserved_balance, status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  50000.0000,
  0.0000,
  'active'
) ON CONFLICT (tenant_id) DO NOTHING;

-- ObitSMS provider
INSERT INTO sms_providers (id, name, api_base_url, auth_type, status, priority)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'OBITSMS',
  'https://obitsms.com/api/bulksms',
  'query_param',
  'active',
  1
) ON CONFLICT (name) DO NOTHING;

-- Pricing for Cameroon (237)
INSERT INTO provider_pricing (provider_id, country_code, currency, price_per_sms, price_per_part)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  '237',
  'XAF',
  25.000000,
  25.000000
) ON CONFLICT DO NOTHING;
