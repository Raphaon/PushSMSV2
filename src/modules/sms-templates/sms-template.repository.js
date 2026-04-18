import pool from '../../shared/config/database/db.js';

export const findByTenant = async (tenantId, { limit, offset }) => {
  const countRes = await pool.query('SELECT COUNT(*) FROM sms_templates WHERE tenant_id = $1', [tenantId]);
  const total = parseInt(countRes.rows[0].count);
  const result = await pool.query(
    'SELECT * FROM sms_templates WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [tenantId, limit, offset]
  );
  return { rows: result.rows, total };
};

export const findById = async (id, tenantId) => {
  const result = await pool.query('SELECT * FROM sms_templates WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return result.rows[0] || null;
};

export const create = async (tenantId, data) => {
  const result = await pool.query(
    `INSERT INTO sms_templates (tenant_id, name, body, variables, category)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [tenantId, data.name, data.body, JSON.stringify(data.variables || []), data.category || null]
  );
  return result.rows[0];
};

export const update = async (id, tenantId, data) => {
  const map = { name: 'name', body: 'body', category: 'category', is_active: 'isActive' };
  const fields = [];
  const values = [];
  let i = 1;

  for (const [col, key] of Object.entries(map)) {
    if (data[key] !== undefined) { fields.push(`${col} = $${i++}`); values.push(data[key]); }
  }
  if (data.variables !== undefined) { fields.push(`variables = $${i++}`); values.push(JSON.stringify(data.variables)); }
  if (fields.length === 0) return findById(id, tenantId);

  values.push(id, tenantId);
  const result = await pool.query(
    `UPDATE sms_templates SET ${fields.join(', ')} WHERE id = $${i} AND tenant_id = $${i + 1} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

export const remove = async (id, tenantId) => {
  const result = await pool.query(
    'DELETE FROM sms_templates WHERE id = $1 AND tenant_id = $2 RETURNING id',
    [id, tenantId]
  );
  return result.rows[0] || null;
};
