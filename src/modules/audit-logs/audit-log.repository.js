import pool from '../../shared/config/database/db.js';

export const log = async (data, client = pool) => {
  const { tenantId, userId, action, entityType, entityId, metadata } = data;
  await client.query(
    `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [tenantId, userId || null, action, entityType || null, entityId || null, metadata ? JSON.stringify(metadata) : null]
  );
};

export const findByTenant = async (tenantId, { limit, offset, userId, entityType, action }) => {
  const values = [tenantId];
  const conditions = ['al.tenant_id = $1'];

  if (userId) { values.push(userId); conditions.push(`al.user_id = $${values.length}`); }
  if (entityType) { values.push(entityType); conditions.push(`al.entity_type = $${values.length}`); }
  if (action) { values.push(action); conditions.push(`al.action = $${values.length}`); }

  const where = 'WHERE ' + conditions.join(' AND ');
  const countRes = await pool.query(`SELECT COUNT(*) FROM audit_logs al ${where}`, values);
  const total = parseInt(countRes.rows[0].count);

  values.push(limit, offset);
  const result = await pool.query(
    `SELECT al.*,
            al.entity_type  AS resource_type,
            al.entity_id    AS resource_id,
            COALESCE(u.email, 'System') AS user_email
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ${where}
     ORDER BY al.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { rows: result.rows, total };
};
