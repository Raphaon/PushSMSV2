import pool from '../../shared/config/database/db.js';

export const create = async (tenantId, data, client = pool) => {
  const { amount, currency, paymentMethod, externalReference, description } = data;
  const result = await client.query(
    `INSERT INTO payment_transactions (tenant_id, amount, currency, payment_method, external_reference, description, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
    [tenantId, amount, currency || 'XAF', paymentMethod || null, externalReference || null, description || null]
  );
  return result.rows[0];
};

export const findById = async (id, tenantId) => {
  const result = await pool.query(
    'SELECT * FROM payment_transactions WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );
  return result.rows[0] || null;
};

export const updateStatus = async (id, tenantId, status, client = pool) => {
  const extraField = status === 'confirmed' ? ', confirmed_at = NOW()' : '';
  const result = await client.query(
    `UPDATE payment_transactions SET status = $1${extraField} WHERE id = $2 AND tenant_id = $3 RETURNING *`,
    [status, id, tenantId]
  );
  return result.rows[0] || null;
};
