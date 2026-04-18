import * as listRepo from './contact-list.repository.js';
import * as contactRepo from '../contacts/contact.repository.js';
import { normalizePhone, isValidPhone } from '../../shared/utils/phone.js';
import { NotFoundError, ConflictError, BadRequestError } from '../../shared/errors/AppError.js';
import { getPagination, buildPaginationMeta } from '../../shared/utils/pagination.js';
import { withTransaction } from '../../shared/config/database/db.js';
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';

export const listContactLists = async (tenantId, query) => {
  const { page, limit, offset } = getPagination(query);
  const { rows, total } = await listRepo.findByTenant(tenantId, { limit, offset });
  return { lists: rows, pagination: buildPaginationMeta(total, page, limit) };
};

export const getContactList = async (id, tenantId) => {
  const list = await listRepo.findById(id, tenantId);
  if (!list) throw new NotFoundError('Contact list not found');
  return list;
};

export const createContactList = async (tenantId, data) => listRepo.create(tenantId, data);

export const updateContactList = async (id, tenantId, data) => {
  const list = await listRepo.update(id, tenantId, data);
  if (!list) throw new NotFoundError('Contact list not found');
  return list;
};

export const deleteContactList = async (id, tenantId) => {
  const list = await listRepo.remove(id, tenantId);
  if (!list) throw new NotFoundError('Contact list not found');
};

export const addMember = async (listId, data, tenantId) => {
  await getContactList(listId, tenantId);

  let contact;
  if (data.contactId) {
    contact = await contactRepo.findById(data.contactId, tenantId);
    if (!contact) throw new NotFoundError('Contact not found');
  } else if (data.phone) {
    const normalized = normalizePhone(data.phone);
    if (!isValidPhone(normalized)) throw new BadRequestError('Invalid phone number format');
    contact = await contactRepo.findByPhone(normalized, tenantId);
    if (!contact) {
      contact = await contactRepo.create({ tenantId, phoneNumber: normalized });
    }
  } else {
    throw new BadRequestError('Either contactId or phone is required');
  }

  const member = await listRepo.addMember(listId, contact.id, tenantId);
  if (!member) throw new ConflictError('Contact is already in this list');
  return member;
};

export const removeMember = async (listId, contactId, tenantId) => {
  await getContactList(listId, tenantId);
  await listRepo.removeMember(listId, contactId);
};

export const getMembers = async (listId, tenantId, query) => {
  await getContactList(listId, tenantId);
  const { page, limit, offset } = getPagination(query);
  const { rows, total } = await listRepo.getMembers(listId, tenantId, { limit, offset });
  return { members: rows, pagination: buildPaginationMeta(total, page, limit) };
};

const PHONE_COLS = ['phone_number', 'phone', 'telephone', 'téléphone', 'numero', 'mobile'];
const findCol = (headers, candidates) => {
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const c of candidates) {
    const i = lower.indexOf(c);
    if (i !== -1) return headers[i];
  }
  return null;
};

export const importToList = async (listId, tenantId, fileBuffer) => {
  await getContactList(listId, tenantId);

  const workbook = xlsxRead(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsxUtils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) throw new BadRequestError('Fichier vide ou sans données');

  const headers = Object.keys(rows[0]);
  const phoneCol = findCol(headers, PHONE_COLS);
  if (!phoneCol) throw new BadRequestError('Colonne téléphone introuvable (attendu: phone_number, phone, telephone...)');

  const firstNameCol = findCol(headers, ['first_name', 'firstname', 'prenom', 'prénom']);
  const lastNameCol = findCol(headers, ['last_name', 'lastname', 'nom']);
  const emailCol = findCol(headers, ['email', 'e-mail', 'mail', 'courriel']);

  const results = { imported: 0, skipped: 0, errors: [] };

  for (const row of rows) {
    const rawPhone = String(row[phoneCol] || '').trim();
    if (!rawPhone) { results.skipped++; continue; }

    const phone = normalizePhone(rawPhone);
    if (!isValidPhone(phone)) {
      results.errors.push({ phone: rawPhone, reason: 'Numéro invalide' });
      results.skipped++;
      continue;
    }

    try {
      let contact = await contactRepo.findByPhone(phone, tenantId);
      if (!contact) {
        contact = await contactRepo.create({
          tenantId, phoneNumber: phone,
          firstName: firstNameCol ? String(row[firstNameCol] || '').trim() || null : null,
          lastName: lastNameCol ? String(row[lastNameCol] || '').trim() || null : null,
          email: emailCol ? String(row[emailCol] || '').trim() || null : null,
        });
      }
      const member = await listRepo.addMember(listId, contact.id, tenantId);
      if (member) results.imported++;
      else results.skipped++; // duplicate
    } catch (err) {
      results.errors.push({ phone, reason: err.message });
      results.skipped++;
    }
  }

  return { total: rows.length, ...results, errorSample: results.errors.slice(0, 10) };
};
