import pool from '../../shared/config/database/db.js';

export const create = async (data, client = pool) => {
  const { tenantId, userId, type, title, body, metadata } = data;
  const result = await client.query(
    `INSERT INTO notifications (tenant_id, user_id, type, title, body, metadata)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [tenantId, userId || null, type, title, body || null, metadata ? JSON.stringify(metadata) : null]
  );
  return result.rows[0];
};

export const findByUser = async (tenantId, userId, { limit, offset }) => {
  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE tenant_id = $1 AND (user_id = $2 OR user_id IS NULL)
     ORDER BY created_at DESC
     LIMIT $3 OFFSET $4`,
    [tenantId, userId, limit, offset]
  );
  const countRes = await pool.query(
    `SELECT COUNT(*) FROM notifications WHERE tenant_id = $1 AND (user_id = $2 OR user_id IS NULL)`,
    [tenantId, userId]
  );
  return { rows: result.rows, total: parseInt(countRes.rows[0].count) };
};

export const countUnread = async (tenantId, userId) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM notifications
     WHERE tenant_id = $1 AND (user_id = $2 OR user_id IS NULL) AND is_read = FALSE`,
    [tenantId, userId]
  );
  return parseInt(result.rows[0].count);
};

export const markRead = async (id, tenantId, userId) => {
  const result = await pool.query(
    `UPDATE notifications SET is_read = TRUE
     WHERE id = $1 AND tenant_id = $2 AND (user_id = $3 OR user_id IS NULL) RETURNING *`,
    [id, tenantId, userId]
  );
  return result.rows[0] || null;
};

export const markAllRead = async (tenantId, userId) => {
  await pool.query(
    `UPDATE notifications SET is_read = TRUE
     WHERE tenant_id = $1 AND (user_id = $2 OR user_id IS NULL) AND is_read = FALSE`,
    [tenantId, userId]
  );
};
