import pool from '../../shared/config/database/db.js';

export const createForTenant = async (tenantId, client = pool) => {
  const result = await client.query(
    'INSERT INTO wallets (tenant_id) VALUES ($1) RETURNING *',
    [tenantId]
  );
  return result.rows[0];
};

export const findByTenant = async (tenantId, client = pool) => {
  const result = await client.query('SELECT * FROM wallets WHERE tenant_id = $1', [tenantId]);
  return result.rows[0] || null;
};

export const credit = async (walletId, amount, client = pool) => {
  const result = await client.query(
    'UPDATE wallets SET balance = balance + $1, last_recharge_at = NOW() WHERE id = $2 RETURNING *',
    [amount, walletId]
  );
  return result.rows[0];
};

export const debit = async (walletId, amount, client = pool) => {
  const result = await client.query(
    'UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING *',
    [amount, walletId]
  );
  return result.rows[0] || null;
};

export const reserve = async (walletId, amount, client = pool) => {
  const result = await client.query(
    `UPDATE wallets SET balance = balance - $1, reserved_balance = reserved_balance + $1
     WHERE id = $2 AND balance >= $1 RETURNING *`,
    [amount, walletId]
  );
  return result.rows[0] || null;
};

export const releaseReservation = async (walletId, amount, client = pool) => {
  const result = await client.query(
    `UPDATE wallets SET balance = balance + $1, reserved_balance = reserved_balance - $1
     WHERE id = $2 RETURNING *`,
    [amount, walletId]
  );
  return result.rows[0];
};

export const settleReservation = async (walletId, reservedAmount, actualAmount, client = pool) => {
  const refund = reservedAmount - actualAmount;
  if (refund < 0) throw new Error('Actual cost exceeds reserved amount');
  const result = await client.query(
    `UPDATE wallets SET reserved_balance = reserved_balance - $1, balance = balance + $2
     WHERE id = $3 RETURNING *`,
    [reservedAmount, refund, walletId]
  );
  return result.rows[0];
};

export const createTransaction = async (data, client = pool) => {
  const { walletId, tenantId, paymentTransactionId, campaignId, type, direction, amount, balanceBefore, balanceAfter, description, metadata } = data;
  const result = await client.query(
    `INSERT INTO wallet_transactions
     (wallet_id, tenant_id, payment_transaction_id, campaign_id, type, direction, amount, balance_before, balance_after, description, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [walletId, tenantId, paymentTransactionId || null, campaignId || null, type, direction, amount, balanceBefore, balanceAfter, description || null, metadata ? JSON.stringify(metadata) : null]
  );
  return result.rows[0];
};

// ── Credits ──────────────────────────────────────────────────────────────────

export const creditCredits = async (walletId, amount, lastAmount, client = pool) => {
  const result = await client.query(
    `UPDATE wallets
     SET message_credits = message_credits + $1, last_credit_amount = $2, last_credits_at = NOW()
     WHERE id = $3 RETURNING *`,
    [amount, lastAmount, walletId]
  );
  return result.rows[0];
};

export const debitCredits = async (walletId, amount, client = pool) => {
  const result = await client.query(
    `UPDATE wallets SET message_credits = message_credits - $1
     WHERE id = $2 AND message_credits >= $1 RETURNING *`,
    [amount, walletId]
  );
  return result.rows[0] || null;
};

export const reserveCredits = async (walletId, amount, client = pool) => {
  const result = await client.query(
    `UPDATE wallets
     SET message_credits = message_credits - $1, reserved_credits = reserved_credits + $1
     WHERE id = $2 AND message_credits >= $1 RETURNING *`,
    [amount, walletId]
  );
  return result.rows[0] || null;
};

export const settleCreditsReservation = async (walletId, reservedAmount, actualAmount, client = pool) => {
  const refund = reservedAmount - actualAmount;
  const result = await client.query(
    `UPDATE wallets
     SET reserved_credits = reserved_credits - $1, message_credits = message_credits + $2
     WHERE id = $3 RETURNING *`,
    [reservedAmount, refund, walletId]
  );
  return result.rows[0];
};

export const findTransactions = async (tenantId, { limit, offset, type }) => {
  const values = [tenantId];
  let where = 'WHERE tenant_id = $1';
  if (type) { values.push(type); where += ` AND type = $${values.length}`; }

  const countRes = await pool.query(`SELECT COUNT(*) FROM wallet_transactions ${where}`, values);
  const total = parseInt(countRes.rows[0].count);

  values.push(limit, offset);
  const result = await pool.query(
    `SELECT * FROM wallet_transactions ${where} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { rows: result.rows, total };
};
