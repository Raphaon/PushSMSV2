import pool from '../../shared/config/database/db.js';

export const findByTenant = async (tenantId, { limit, offset }) => {
  const countRes = await pool.query('SELECT COUNT(*) FROM opt_outs WHERE tenant_id = $1', [tenantId]);
  const total = parseInt(countRes.rows[0].count);
  const result = await pool.query(
    'SELECT * FROM opt_outs WHERE tenant_id = $1 ORDER BY opted_out_at DESC LIMIT $2 OFFSET $3',
    [tenantId, limit, offset]
  );
  return { rows: result.rows, total };
};

export const isOptedOut = async (phoneNumber, tenantId) => {
  const result = await pool.query(
    'SELECT id FROM opt_outs WHERE phone_number = $1 AND tenant_id = $2',
    [phoneNumber, tenantId]
  );
  return result.rows.length > 0;
};

export const create = async (data, client = pool) => {
  const { tenantId, contactId, phoneNumber, channel, reason, processedByUserId } = data;
  const result = await client.query(
    `INSERT INTO opt_outs (tenant_id, contact_id, phone_number, channel, reason, processed_by_user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (tenant_id, phone_number) DO UPDATE SET opted_out_at = NOW()
     RETURNING *`,
    [tenantId, contactId || null, phoneNumber, channel || 'MANUAL', reason || null, processedByUserId || null]
  );
  return result.rows[0];
};

export const remove = async (phoneNumber, tenantId) => {
  const result = await pool.query(
    'DELETE FROM opt_outs WHERE phone_number = $1 AND tenant_id = $2 RETURNING id',
    [phoneNumber, tenantId]
  );
  return result.rows[0] || null;
};
