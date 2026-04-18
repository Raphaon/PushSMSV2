import pool from '../../shared/config/database/db.js';

export const create = async (data, client = pool) => {
  const { name, slug, country, timezone, currency } = data;
  const result = await client.query(
    `INSERT INTO tenants (name, slug, country, timezone, currency, status)
     VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
    [name, slug, country || null, timezone || 'UTC', currency || 'XAF']
  );
  return result.rows[0];
};

export const findById = async (id) => {
  const result = await pool.query('SELECT * FROM tenants WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const findBySlug = async (slug) => {
  const result = await pool.query('SELECT * FROM tenants WHERE slug = $1', [slug]);
  return result.rows[0] || null;
};

export const update = async (id, data) => {
  const fields = [];
  const values = [];
  let i = 1;

  const allowed = ['name', 'slug', 'country', 'timezone', 'currency', 'status'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${i++}`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) return findById(id);

  values.push(id);
  const result = await pool.query(
    `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};
