import pool from '../../shared/config/database/db.js';

export const findByTenant = async (tenantId, { limit, offset, search, status }) => {
  const values = [tenantId];
  const conditions = ['tenant_id = $1'];

  if (search) {
    values.push(`%${search}%`);
    const p = values.length;
    conditions.push(`(phone_number ILIKE $${p} OR first_name ILIKE $${p} OR last_name ILIKE $${p} OR email ILIKE $${p})`);
  }
  if (status) { values.push(status); conditions.push(`status = $${values.length}`); }

  const where = 'WHERE ' + conditions.join(' AND ');
  const countRes = await pool.query(`SELECT COUNT(*) FROM contacts ${where}`, values);
  const total = parseInt(countRes.rows[0].count);

  values.push(limit, offset);
  const result = await pool.query(
    `SELECT * FROM contacts ${where} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { rows: result.rows, total };
};

export const findById = async (id, tenantId) => {
  const result = await pool.query(
    'SELECT * FROM contacts WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );
  return result.rows[0] || null;
};

export const findByPhone = async (phoneNumber, tenantId) => {
  const result = await pool.query(
    'SELECT * FROM contacts WHERE phone_number = $1 AND tenant_id = $2',
    [phoneNumber, tenantId]
  );
  return result.rows[0] || null;
};

export const create = async (data, client = pool) => {
  const { tenantId, firstName, lastName, phoneNumber, email, country, city } = data;
  const result = await client.query(
    `INSERT INTO contacts (tenant_id, first_name, last_name, phone_number, email, country, city)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [tenantId, firstName || null, lastName || null, phoneNumber, email || null, country || null, city || null]
  );
  return result.rows[0];
};

export const update = async (id, tenantId, data) => {
  const map = { first_name: 'firstName', last_name: 'lastName', email: 'email', country: 'country', city: 'city', opt_in_status: 'optInStatus', status: 'status' };
  const fields = [];
  const values = [];
  let i = 1;

  for (const [col, key] of Object.entries(map)) {
    if (data[key] !== undefined) { fields.push(`${col} = $${i++}`); values.push(data[key]); }
  }
  if (fields.length === 0) return findById(id, tenantId);

  values.push(id, tenantId);
  const result = await pool.query(
    `UPDATE contacts SET ${fields.join(', ')} WHERE id = $${i} AND tenant_id = $${i + 1} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

export const archive = async (id, tenantId) => {
  const result = await pool.query(
    "UPDATE contacts SET status = 'archived' WHERE id = $1 AND tenant_id = $2 RETURNING id",
    [id, tenantId]
  );
  return result.rows[0] || null;
};
