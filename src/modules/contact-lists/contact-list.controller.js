import * as service from './contact-list.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response.js';
import { BadRequestError } from '../../shared/errors/AppError.js';

export const listContactLists = async (req, res, next) => {
  try {
    const { lists, pagination } = await service.listContactLists(req.user.tenantId, req.query);
    return sendPaginated(res, lists, pagination);
  } catch (err) { next(err); }
};

export const getContactList = async (req, res, next) => {
  try {
    const list = await service.getContactList(req.params.id, req.user.tenantId);
    return sendSuccess(res, list);
  } catch (err) { next(err); }
};

export const createContactList = async (req, res, next) => {
  try {
    const list = await service.createContactList(req.user.tenantId, req.body);
    return sendCreated(res, list, 'Contact list created');
  } catch (err) { next(err); }
};

export const updateContactList = async (req, res, next) => {
  try {
    const list = await service.updateContactList(req.params.id, req.user.tenantId, req.body);
    return sendSuccess(res, list, 'Contact list updated');
  } catch (err) { next(err); }
};

export const deleteContactList = async (req, res, next) => {
  try {
    await service.deleteContactList(req.params.id, req.user.tenantId);
    return sendSuccess(res, null, 'Contact list deleted');
  } catch (err) { next(err); }
};

export const addMember = async (req, res, next) => {
  try {
    const member = await service.addMember(req.params.id, req.body, req.user.tenantId);
    return sendCreated(res, member, 'Contact added to list');
  } catch (err) { next(err); }
};

export const removeMember = async (req, res, next) => {
  try {
    await service.removeMember(req.params.id, req.params.contactId, req.user.tenantId);
    return sendSuccess(res, null, 'Contact removed from list');
  } catch (err) { next(err); }
};

export const getMembers = async (req, res, next) => {
  try {
    const { members, pagination } = await service.getMembers(req.params.id, req.user.tenantId, req.query);
    return sendPaginated(res, members, pagination);
  } catch (err) { next(err); }
};

export const importToList = async (req, res, next) => {
  try {
    if (!req.file) throw new BadRequestError('Aucun fichier fourni');
    const result = await service.importToList(req.params.id, req.user.tenantId, req.file.buffer);
    return sendCreated(res, result, `Import terminé : ${result.imported} ajouté(s)`);
  } catch (err) { next(err); }
};
