import pool from '../../shared/config/database/db.js';

export const findByTenant = async (tenantId) => {
  const result = await pool.query(
    'SELECT id, tenant_id, name, key_prefix, status, expires_at, last_used_at, created_at FROM api_keys WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId]
  );
  return result.rows;
};

export const create = async (tenantId, data) => {
  const { name, keyPrefix, secretHash, expiresAt } = data;
  const result = await pool.query(
    `INSERT INTO api_keys (tenant_id, name, key_prefix, secret_hash, expires_at)
     VALUES ($1,$2,$3,$4,$5) RETURNING id, tenant_id, name, key_prefix, status, expires_at, created_at`,
    [tenantId, name, keyPrefix, secretHash, expiresAt || null]
  );
  return result.rows[0];
};

export const revoke = async (id, tenantId) => {
  const result = await pool.query(
    "UPDATE api_keys SET status = 'revoked' WHERE id = $1 AND tenant_id = $2 RETURNING id",
    [id, tenantId]
  );
  return result.rows[0] || null;
};

export const findByPrefix = async (keyPrefix) => {
  const result = await pool.query(
    "SELECT * FROM api_keys WHERE key_prefix = $1 AND status = 'active'",
    [keyPrefix]
  );
  return result.rows[0] || null;
};

export const updateLastUsed = async (id) => {
  await pool.query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [id]);
};
