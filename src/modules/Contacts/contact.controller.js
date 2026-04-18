import * as contactService from './contact.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response.js';
import { BadRequestError } from '../../shared/errors/AppError.js';

export const listContacts = async (req, res, next) => {
  try {
    const { contacts, pagination } = await contactService.listContacts(req.user.tenantId, req.query);
    return sendPaginated(res, contacts, pagination);
  } catch (err) { next(err); }
};

export const getContact = async (req, res, next) => {
  try {
    const contact = await contactService.getContact(req.params.id, req.user.tenantId);
    return sendSuccess(res, contact);
  } catch (err) { next(err); }
};

export const createContact = async (req, res, next) => {
  try {
    const contact = await contactService.createContact(req.user.tenantId, req.body);
    return sendCreated(res, contact, 'Contact created successfully');
  } catch (err) { next(err); }
};

export const updateContact = async (req, res, next) => {
  try {
    const contact = await contactService.updateContact(req.params.id, req.user.tenantId, req.body);
    return sendSuccess(res, contact, 'Contact updated');
  } catch (err) { next(err); }
};

export const deleteContact = async (req, res, next) => {
  try {
    await contactService.deleteContact(req.params.id, req.user.tenantId);
    return sendSuccess(res, null, 'Contact archived');
  } catch (err) { next(err); }
};

export const importContacts = async (req, res, next) => {
  try {
    if (!req.file) throw new BadRequestError('No file uploaded');
    const result = await contactService.importContacts(req.user.tenantId, req.file.buffer, req.file.mimetype);
    return sendCreated(res, result, `Import complete: ${result.created} created, ${result.skipped} skipped`);
  } catch (err) { next(err); }
};
