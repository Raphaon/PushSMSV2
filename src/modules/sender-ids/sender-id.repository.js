import pool from '../../shared/config/database/db.js';

export const findByTenant = async (tenantId) => {
  const result = await pool.query(
    'SELECT * FROM sender_ids WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId]
  );
  return result.rows;
};

export const findById = async (id, tenantId) => {
  const result = await pool.query('SELECT * FROM sender_ids WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return result.rows[0] || null;
};

export const findByValue = async (value, tenantId) => {
  const result = await pool.query('SELECT * FROM sender_ids WHERE value = $1 AND tenant_id = $2', [value, tenantId]);
  return result.rows[0] || null;
};

export const create = async (tenantId, data) => {
  const result = await pool.query(
    'INSERT INTO sender_ids (tenant_id, value, type) VALUES ($1, $2, $3) RETURNING *',
    [tenantId, data.value, data.type || 'ALPHANUMERIC']
  );
  return result.rows[0];
};

export const updateStatus = async (id, tenantId, status) => {
  const result = await pool.query(
    'UPDATE sender_ids SET status = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *',
    [status, id, tenantId]
  );
  return result.rows[0] || null;
};
