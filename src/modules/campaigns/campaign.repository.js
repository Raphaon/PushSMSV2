import pool from '../../shared/config/database/db.js';

export const findByTenant = async (tenantId, { limit, offset, status }) => {
  const values = [tenantId];
  let where = 'WHERE tenant_id = $1';
  if (status) { values.push(status); where += ` AND status = $${values.length}`; }

  const countRes = await pool.query(`SELECT COUNT(*) FROM campaigns ${where}`, values);
  const total = parseInt(countRes.rows[0].count);

  values.push(limit, offset);
  const result = await pool.query(
    `SELECT * FROM campaigns ${where} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { rows: result.rows, total };
};

export const findById = async (id, tenantId, client = pool) => {
  const result = await client.query('SELECT * FROM campaigns WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return result.rows[0] || null;
};

export const create = async (tenantId, userId, data, client = pool) => {
  const { name, messageBody, type, senderIdId, contactListId, templateId } = data;
  const result = await client.query(
    `INSERT INTO campaigns (tenant_id, created_by_user_id, sender_id, contact_list_id, template_id, name, message_body, type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [tenantId, userId, senderIdId, contactListId || null, templateId || null, name, messageBody, type || 'MARKETING']
  );
  return result.rows[0];
};

export const update = async (id, tenantId, data, client = pool) => {
  const map = { name: 'name', message_body: 'messageBody', type: 'type', sender_id: 'senderIdId', contact_list_id: 'contactListId', template_id: 'templateId' };
  const fields = [];
  const values = [];
  let i = 1;
  for (const [col, key] of Object.entries(map)) {
    if (data[key] !== undefined) { fields.push(`${col} = $${i++}`); values.push(data[key]); }
  }
  if (fields.length === 0) return findById(id, tenantId, client);
  values.push(id, tenantId);
  const result = await client.query(
    `UPDATE campaigns SET ${fields.join(', ')} WHERE id = $${i} AND tenant_id = $${i + 1} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

export const updateStatus = async (id, tenantId, status, extra = {}, client = pool) => {
  const extraFields = Object.entries(extra).map(([k]) => k);
  const extraVals = Object.values(extra);
  const setStr = ['status = $1', ...extraFields.map((f, idx) => `${f} = $${idx + 2}`)].join(', ');
  const values = [status, ...extraVals, id, tenantId];
  const result = await client.query(
    `UPDATE campaigns SET ${setStr} WHERE id = $${values.length - 1} AND tenant_id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

export const updateCounters = async (id, tenantId, counters, client = pool) => {
  const { sentCount, deliveredCount, failedCount, actualCost } = counters;
  const result = await client.query(
    `UPDATE campaigns SET
       sent_count = $1, delivered_count = $2, failed_count = $3, actual_cost = $4,
       completed_at = NOW(), status = 'COMPLETED'
     WHERE id = $5 AND tenant_id = $6 RETURNING *`,
    [sentCount, deliveredCount, failedCount, actualCost, id, tenantId]
  );
  return result.rows[0];
};

export const insertRecipients = async (campaignId, tenantId, recipients, client = pool) => {
  if (recipients.length === 0) return;
  const values = [];
  const placeholders = recipients.map((r, i) => {
    const base = i * 4;
    values.push(campaignId, tenantId, r.contactId || null, r.phoneNumber);
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
  });
  await client.query(
    `INSERT INTO campaign_recipients (campaign_id, tenant_id, contact_id, phone_number) VALUES ${placeholders.join(',')}`,
    values
  );
};

export const getRecipients = async (campaignId, client = pool) => {
  const result = await client.query(
    'SELECT * FROM campaign_recipients WHERE campaign_id = $1',
    [campaignId]
  );
  return result.rows;
};

export const updateRecipientStatus = async (id, status, client = pool) => {
  await client.query('UPDATE campaign_recipients SET status = $1 WHERE id = $2', [status, id]);
};
