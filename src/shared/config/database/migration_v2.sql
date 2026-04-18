-- PushSMS Migration v2
-- Run: psql -U postgres -d PushSMS -f migration_v2.sql

-- 1. Extend SUPERADMIN role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('ADMIN', 'OPERATOR', 'SUPERADMIN'));

-- 2. Add message credits to wallets
ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS message_credits    INTEGER NOT NULL DEFAULT 0 CHECK (message_credits >= 0),
  ADD COLUMN IF NOT EXISTS reserved_credits   INTEGER NOT NULL DEFAULT 0 CHECK (reserved_credits >= 0),
  ADD COLUMN IF NOT EXISTS last_credit_amount INTEGER,
  ADD COLUMN IF NOT EXISTS last_credits_at    TIMESTAMPTZ;

-- 3. Add password reset to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_reset_token   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

-- 4. Fix api_keys key_prefix length
ALTER TABLE api_keys ALTER COLUMN key_prefix TYPE VARCHAR(20);

-- 5. Recharge requests
CREATE TABLE IF NOT EXISTS recharge_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_by    UUID NOT NULL REFERENCES users(id),
  credits_amount  INTEGER NOT NULL CHECK (credits_amount > 0),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  note            TEXT,
  admin_note      TEXT,
  reviewed_by     UUID REFERENCES users(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recharge_req_tenant ON recharge_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recharge_req_status ON recharge_requests(status);

-- 6. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  metadata    JSONB,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_tenant ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notif_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(tenant_id, is_read) WHERE is_read = FALSE;

-- 7. updated_at trigger for recharge_requests
DO $$
BEGIN
  DROP TRIGGER IF EXISTS trg_recharge_requests_updated_at ON recharge_requests;
  CREATE TRIGGER trg_recharge_requests_updated_at
  BEFORE UPDATE ON recharge_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
END;
$$;

\echo 'Migration v2 complete.'
