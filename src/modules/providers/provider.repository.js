import pool from '../../shared/config/database/db.js';

export const findAll = async () => {
  const result = await pool.query('SELECT id, name, api_base_url, auth_type, status, priority FROM sms_providers ORDER BY priority');
  return result.rows;
};

export const findByName = async (name) => {
  const result = await pool.query('SELECT * FROM sms_providers WHERE name = $1', [name]);
  return result.rows[0] || null;
};

export const findActiveDefault = async () => {
  const result = await pool.query(
    "SELECT * FROM sms_providers WHERE status = 'active' ORDER BY priority LIMIT 1"
  );
  return result.rows[0] || null;
};

export const getCurrentPricing = async (providerId, countryCode) => {
  const result = await pool.query(
    `SELECT * FROM provider_pricing
     WHERE provider_id = $1 AND country_code = $2
       AND effective_from <= NOW()
       AND (effective_to IS NULL OR effective_to > NOW())
     ORDER BY effective_from DESC LIMIT 1`,
    [providerId, countryCode]
  );
  return result.rows[0] || null;
};

export const getPricing = async () => {
  const result = await pool.query(
    `SELECT pp.*, sp.name AS provider_name
     FROM provider_pricing pp
     JOIN sms_providers sp ON sp.id = pp.provider_id
     WHERE pp.effective_from <= NOW() AND (pp.effective_to IS NULL OR pp.effective_to > NOW())
     ORDER BY sp.priority, pp.country_code`
  );
  return result.rows;
};
