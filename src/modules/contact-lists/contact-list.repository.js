import pool from '../../shared/config/database/db.js';

export const findByTenant = async (tenantId, { limit, offset }) => {
  const countRes = await pool.query('SELECT COUNT(*) FROM contact_lists WHERE tenant_id = $1', [tenantId]);
  const total = parseInt(countRes.rows[0].count);
  const result = await pool.query(
    'SELECT * FROM contact_lists WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [tenantId, limit, offset]
  );
  return { rows: result.rows, total };
};

export const findById = async (id, tenantId) => {
  const result = await pool.query('SELECT * FROM contact_lists WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return result.rows[0] || null;
};

export const create = async (tenantId, data) => {
  const result = await pool.query(
    'INSERT INTO contact_lists (tenant_id, name, description) VALUES ($1, $2, $3) RETURNING *',
    [tenantId, data.name, data.description || null]
  );
  return result.rows[0];
};

export const update = async (id, tenantId, data) => {
  const fields = [];
  const values = [];
  let i = 1;
  if (data.name !== undefined) { fields.push(`name = $${i++}`); values.push(data.name); }
  if (data.description !== undefined) { fields.push(`description = $${i++}`); values.push(data.description); }
  if (fields.length === 0) return findById(id, tenantId);
  values.push(id, tenantId);
  const result = await pool.query(
    `UPDATE contact_lists SET ${fields.join(', ')} WHERE id = $${i} AND tenant_id = $${i + 1} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

export const remove = async (id, tenantId) => {
  const result = await pool.query(
    'DELETE FROM contact_lists WHERE id = $1 AND tenant_id = $2 RETURNING id',
    [id, tenantId]
  );
  return result.rows[0] || null;
};

export const addMember = async (listId, contactId, tenantId) => {
  const result = await pool.query(
    'INSERT INTO contact_list_members (contact_list_id, contact_id, tenant_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING *',
    [listId, contactId, tenantId]
  );
  await pool.query(
    'UPDATE contact_lists SET member_count = (SELECT COUNT(*) FROM contact_list_members WHERE contact_list_id = $1) WHERE id = $1',
    [listId]
  );
  return result.rows[0] || null;
};

export const removeMember = async (listId, contactId) => {
  await pool.query(
    'DELETE FROM contact_list_members WHERE contact_list_id = $1 AND contact_id = $2',
    [listId, contactId]
  );
  await pool.query(
    'UPDATE contact_lists SET member_count = (SELECT COUNT(*) FROM contact_list_members WHERE contact_list_id = $1) WHERE id = $1',
    [listId]
  );
};

export const getMembers = async (listId, tenantId, { limit, offset }) => {
  const countRes = await pool.query(
    'SELECT COUNT(*) FROM contact_list_members clm JOIN contacts c ON c.id = clm.contact_id WHERE clm.contact_list_id = $1 AND clm.tenant_id = $2',
    [listId, tenantId]
  );
  const total = parseInt(countRes.rows[0].count);
  const result = await pool.query(
    `SELECT c.id AS contact_id, c.first_name, c.last_name, c.phone_number AS phone, c.email, c.opt_in_status, clm.added_at
     FROM contact_list_members clm
     JOIN contacts c ON c.id = clm.contact_id
     WHERE clm.contact_list_id = $1 AND clm.tenant_id = $2
     ORDER BY clm.added_at DESC LIMIT $3 OFFSET $4`,
    [listId, tenantId, limit, offset]
  );
  return { rows: result.rows, total };
};

export const getActiveMemberPhones = async (listId, tenantId) => {
  const result = await pool.query(
    `SELECT c.id AS contact_id, c.phone_number
     FROM contact_list_members clm
     JOIN contacts c ON c.id = clm.contact_id
     WHERE clm.contact_list_id = $1
       AND clm.tenant_id = $2
       AND c.status = 'active'
       AND c.opt_in_status = 'opted_in'`,
    [listId, tenantId]
  );
  return result.rows;
};
