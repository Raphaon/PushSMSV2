import pool from '../../shared/config/database/db.js';

export const create = async (data, client = pool) => {
  const { tenantId, requestedBy, creditsAmount, note } = data;
  const result = await client.query(
    `INSERT INTO recharge_requests (tenant_id, requested_by, credits_amount, note)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [tenantId, requestedBy, creditsAmount, note || null]
  );
  return result.rows[0];
};

export const findById = async (id, client = pool) => {
  const result = await client.query(
    `SELECT rr.*, t.name AS tenant_name,
            u.email AS requester_email, u.first_name AS requester_first_name
     FROM recharge_requests rr
     JOIN tenants t ON t.id = rr.tenant_id
     JOIN users u ON u.id = rr.requested_by
     WHERE rr.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// All requests — for SUPERADMIN
export const findAll = async ({ limit, offset, status }) => {
  const values = [];
  let where = '';
  if (status) { values.push(status); where = `WHERE rr.status = $1`; }

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM recharge_requests rr ${where}`, values
  );
  const total = parseInt(countRes.rows[0].count);

  values.push(limit, offset);
  const result = await pool.query(
    `SELECT rr.*, t.name AS tenant_name,
            u.email AS requester_email, u.first_name AS requester_first_name
     FROM recharge_requests rr
     JOIN tenants t ON t.id = rr.tenant_id
     JOIN users u ON u.id = rr.requested_by
     ${where}
     ORDER BY rr.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { rows: result.rows, total };
};

// Tenant-specific — for regular admins
export const findByTenant = async (tenantId, { limit, offset, status }) => {
  const values = [tenantId];
  let where = 'WHERE rr.tenant_id = $1';
  if (status) { values.push(status); where += ` AND rr.status = $${values.length}`; }

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM recharge_requests rr ${where}`, values
  );
  const total = parseInt(countRes.rows[0].count);

  values.push(limit, offset);
  const result = await pool.query(
    `SELECT rr.*,
            u.email AS requester_email, u.first_name AS requester_first_name
     FROM recharge_requests rr
     JOIN users u ON u.id = rr.requested_by
     ${where}
     ORDER BY rr.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { rows: result.rows, total };
};

export const updateStatus = async (id, status, reviewedBy, adminNote, client = pool) => {
  const result = await client.query(
    `UPDATE recharge_requests
     SET status = $1, reviewed_by = $2, admin_note = $3, reviewed_at = NOW()
     WHERE id = $4 RETURNING *`,
    [status, reviewedBy, adminNote || null, id]
  );
  return result.rows[0] || null;
};
