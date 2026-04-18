import pool from '../../shared/config/database/db.js';

export const findByTenant = async (tenantId, { limit, offset, search }) => {
  const values = [tenantId];
  let where = 'WHERE u.tenant_id = $1';

  if (search) {
    values.push(`%${search}%`);
    where += ` AND (u.email ILIKE $${values.length} OR u.first_name ILIKE $${values.length} OR u.last_name ILIKE $${values.length})`;
  }

  const countResult = await pool.query(`SELECT COUNT(*) FROM users u ${where}`, values);
  const total = parseInt(countResult.rows[0].count);

  values.push(limit, offset);
  const result = await pool.query(
    `SELECT u.id, u.tenant_id, u.first_name, u.last_name, u.email, u.phone,
            u.role, u.status, u.last_login_at, u.created_at
     FROM users u ${where}
     ORDER BY u.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { rows: result.rows, total };
};

export const findById = async (id, tenantId) => {
  const result = await pool.query(
    `SELECT id, tenant_id, first_name, last_name, email, phone, role, status, last_login_at, created_at
     FROM users WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  return result.rows[0] || null;
};

export const findByEmail = async (email, tenantId) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND tenant_id = $2',
    [email.toLowerCase(), tenantId]
  );
  return result.rows[0] || null;
};

export const create = async (data, client = pool) => {
  const { tenantId, firstName, lastName, email, phone, passwordHash, role } = data;
  const result = await client.query(
    `INSERT INTO users (tenant_id, first_name, last_name, email, phone, password_hash, role, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') RETURNING
     id, tenant_id, first_name, last_name, email, phone, role, status, created_at`,
    [tenantId, firstName || null, lastName || null, email.toLowerCase(), phone || null, passwordHash, role || 'OPERATOR']
  );
  return result.rows[0];
};

export const update = async (id, tenantId, data) => {
  const fields = [];
  const values = [];
  let i = 1;

  const allowed = { first_name: 'firstName', last_name: 'lastName', phone: 'phone', role: 'role', status: 'status' };
  for (const [col, key] of Object.entries(allowed)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = $${i++}`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) return findById(id, tenantId);

  values.push(id, tenantId);
  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} AND tenant_id = $${i + 1}
     RETURNING id, tenant_id, first_name, last_name, email, phone, role, status, created_at`,
    values
  );
  return result.rows[0] || null;
};

export const updatePassword = async (id, tenantId, passwordHash) => {
  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2 AND tenant_id = $3',
    [passwordHash, id, tenantId]
  );
};

export const remove = async (id, tenantId) => {
  const result = await pool.query(
    "UPDATE users SET status = 'inactive' WHERE id = $1 AND tenant_id = $2 RETURNING id",
    [id, tenantId]
  );
  return result.rows[0] || null;
};
