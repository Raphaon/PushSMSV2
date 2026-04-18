import * as contactRepo from './contact.repository.js';
import { normalizePhone, isValidPhone } from '../../shared/utils/phone.js';
import { ConflictError, NotFoundError, BadRequestError } from '../../shared/errors/AppError.js';
import { getPagination, buildPaginationMeta } from '../../shared/utils/pagination.js';
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';

export const listContacts = async (tenantId, query) => {
  const { page, limit, offset } = getPagination(query);
  const { rows, total } = await contactRepo.findByTenant(tenantId, { limit, offset, search: query.search, status: query.status });
  return { contacts: rows, pagination: buildPaginationMeta(total, page, limit) };
};

export const getContact = async (id, tenantId) => {
  const contact = await contactRepo.findById(id, tenantId);
  if (!contact) throw new NotFoundError('Contact not found');
  return contact;
};

export const createContact = async (tenantId, data) => {
  const phone = normalizePhone(data.phoneNumber);
  if (!isValidPhone(phone)) throw new BadRequestError('Invalid phone number format');

  const existing = await contactRepo.findByPhone(phone, tenantId);
  if (existing) throw new ConflictError('A contact with this phone number already exists');

  return contactRepo.create({ ...data, phoneNumber: phone, tenantId });
};

export const updateContact = async (id, tenantId, data) => {
  const contact = await contactRepo.update(id, tenantId, data);
  if (!contact) throw new NotFoundError('Contact not found');
  return contact;
};

export const deleteContact = async (id, tenantId) => {
  const contact = await contactRepo.archive(id, tenantId);
  if (!contact) throw new NotFoundError('Contact not found');
};

const PHONE_HEADERS = ['phone', 'telephone', 'téléphone', 'numero', 'numéro', 'mobile', 'phone_number', 'phonenumber'];
const FIRSTNAME_HEADERS = ['firstname', 'prénom', 'prenom', 'first_name', 'nom'];
const LASTNAME_HEADERS = ['lastname', 'nom de famille', 'last_name', 'surname'];
const EMAIL_HEADERS = ['email', 'e-mail', 'courriel', 'mail'];

const findCol = (headers, candidates) => {
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const c of candidates) {
    const i = lower.indexOf(c);
    if (i !== -1) return headers[i];
  }
  return null;
};

export const importContacts = async (tenantId, fileBuffer, mimeType) => {
  const workbook = xlsxRead(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsxUtils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) throw new BadRequestError('File is empty or has no data rows');

  const headers = Object.keys(rows[0]);
  const phoneCol = findCol(headers, PHONE_HEADERS);
  if (!phoneCol) throw new BadRequestError('No phone number column found. Expected: phone, telephone, mobile...');

  const firstNameCol = findCol(headers, FIRSTNAME_HEADERS);
  const lastNameCol = findCol(headers, LASTNAME_HEADERS);
  const emailCol = findCol(headers, EMAIL_HEADERS);

  let created = 0, skipped = 0, errors = [];

  for (const row of rows) {
    const rawPhone = String(row[phoneCol] || '').trim();
    if (!rawPhone) { skipped++; continue; }

    const phone = normalizePhone(rawPhone);
    if (!isValidPhone(phone)) {
      errors.push({ phone: rawPhone, reason: 'Invalid phone number' });
      skipped++;
      continue;
    }

    const existing = await contactRepo.findByPhone(phone, tenantId);
    if (existing) { skipped++; continue; }

    try {
      await contactRepo.create({
        tenantId,
        phoneNumber: phone,
        firstName: firstNameCol ? String(row[firstNameCol] || '').trim() || null : null,
        lastName: lastNameCol ? String(row[lastNameCol] || '').trim() || null : null,
        email: emailCol ? String(row[emailCol] || '').trim() || null : null,
      });
      created++;
    } catch {
      skipped++;
    }
  }

  return { total: rows.length, created, skipped, errors: errors.slice(0, 20) };
};
