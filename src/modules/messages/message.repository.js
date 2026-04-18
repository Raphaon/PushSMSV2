import pool from '../../shared/config/database/db.js';

export const findByTenant = async (tenantId, { limit, offset, campaignId, status }) => {
  const values = [tenantId];
  let where = 'WHERE tenant_id = $1';
  if (campaignId) { values.push(campaignId); where += ` AND campaign_id = $${values.length}`; }
  if (status) { values.push(status); where += ` AND status = $${values.length}`; }

  const countRes = await pool.query(`SELECT COUNT(*) FROM messages ${where}`, values);
  const total = parseInt(countRes.rows[0].count);
  values.push(limit, offset);
  const result = await pool.query(
    `SELECT * FROM messages ${where} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { rows: result.rows, total };
};

export const findById = async (id, tenantId) => {
  const result = await pool.query('SELECT * FROM messages WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return result.rows[0] || null;
};

export const create = async (data, client = pool) => {
  const {
    tenantId, campaignId, campaignRecipientId, contactId, providerId,
    destinationNumber, senderValue, body, partsCount, unitPrice, totalPrice,
  } = data;
  const result = await client.query(
    `INSERT INTO messages
     (tenant_id, campaign_id, campaign_recipient_id, contact_id, provider_id,
      destination_number, sender_value, body, parts_count, unit_price, total_price, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'queued') RETURNING *`,
    [tenantId, campaignId, campaignRecipientId || null, contactId || null, providerId || null,
     destinationNumber, senderValue, body, partsCount, unitPrice, totalPrice]
  );
  return result.rows[0];
};

export const updateStatus = async (id, status, extra = {}, client = pool) => {
  const allowed = {
    sent_at: 'sentAt', delivered_at: 'deliveredAt', failed_at: 'failedAt',
    failure_reason: 'failureReason', provider_message_id: 'providerMessageId',
  };
  const fields = [`status = $1`];
  const values = [status];
  let i = 2;
  for (const [col, key] of Object.entries(allowed)) {
    if (extra[key] !== undefined) { fields.push(`${col} = $${i++}`); values.push(extra[key]); }
  }
  values.push(id);
  await client.query(`UPDATE messages SET ${fields.join(', ')} WHERE id = $${i}`, values);
};

export const addEvent = async (data, client = pool) => {
  const { messageId, eventType, providerStatus, rawPayload, reasonCode } = data;
  const result = await client.query(
    `INSERT INTO message_events (message_id, event_type, provider_status, raw_payload, reason_code)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [messageId, eventType, providerStatus || null, rawPayload ? JSON.stringify(rawPayload) : null, reasonCode || null]
  );
  return result.rows[0];
};

export const countByStatus = async (campaignId, tenantId) => {
  const result = await pool.query(
    'SELECT status, COUNT(*)::int AS count FROM messages WHERE campaign_id = $1 AND tenant_id = $2 GROUP BY status',
    [campaignId, tenantId]
  );
  const counts = {};
  for (const row of result.rows) counts[row.status] = row.count;
  return counts;
};

export const getEvents = async (messageId, tenantId) => {
  // Verify tenant ownership first
  const msg = await findById(messageId, tenantId);
  if (!msg) return null;
  const result = await pool.query(
    'SELECT * FROM message_events WHERE message_id = $1 ORDER BY event_date ASC',
    [messageId]
  );
  return result.rows;
};
