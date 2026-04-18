import * as repo from './opt-out.repository.js';
import { normalizePhone, isValidPhone } from '../../shared/utils/phone.js';
import { BadRequestError } from '../../shared/errors/AppError.js';
import { getPagination, buildPaginationMeta } from '../../shared/utils/pagination.js';
import pool from '../../shared/config/database/db.js';

export const listOptOuts = async (tenantId, query) => {
  const { page, limit, offset } = getPagination(query);
  const { rows, total } = await repo.findByTenant(tenantId, { limit, offset });
  return { optOuts: rows, pagination: buildPaginationMeta(total, page, limit) };
};

export const checkOptOut = async (phoneNumber, tenantId) => {
  const phone = normalizePhone(phoneNumber);
  if (!isValidPhone(phone)) throw new BadRequestError('Invalid phone number');
  const optedOut = await repo.isOptedOut(phone, tenantId);
  return { phone, optedOut };
};

export const createOptOut = async (tenantId, userId, data) => {
  const phone = normalizePhone(data.phoneNumber);
  if (!isValidPhone(phone)) throw new BadRequestError('Invalid phone number');

  // Find contact if exists
  const contactRes = await pool.query(
    'SELECT id FROM contacts WHERE phone_number = $1 AND tenant_id = $2',
    [phone, tenantId]
  );
  const contactId = contactRes.rows[0]?.id || null;

  // Update contact opt_in_status if found
  if (contactId) {
    await pool.query(
      "UPDATE contacts SET opt_in_status = 'opted_out' WHERE id = $1",
      [contactId]
    );
  }

  return repo.create({ tenantId, contactId, phoneNumber: phone, ...data, processedByUserId: userId });
};

export const removeOptOut = async (phoneNumber, tenantId) => {
  const phone = normalizePhone(phoneNumber);
  const result = await repo.remove(phone, tenantId);
  if (result) {
    await pool.query(
      "UPDATE contacts SET opt_in_status = 'opted_in' WHERE phone_number = $1 AND tenant_id = $2",
      [phone, tenantId]
    );
  }
  return !!result;
};
