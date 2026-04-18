import * as service from './sms-template.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response.js';

export const listTemplates = async (req, res, next) => {
  try {
    const { templates, pagination } = await service.listTemplates(req.user.tenantId, req.query);
    return sendPaginated(res, templates, pagination);
  } catch (err) { next(err); }
};

export const getTemplate = async (req, res, next) => {
  try {
    const tmpl = await service.getTemplate(req.params.id, req.user.tenantId);
    return sendSuccess(res, tmpl);
  } catch (err) { next(err); }
};

export const createTemplate = async (req, res, next) => {
  try {
    const tmpl = await service.createTemplate(req.user.tenantId, req.body);
    return sendCreated(res, tmpl, 'Template created');
  } catch (err) { next(err); }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const tmpl = await service.updateTemplate(req.params.id, req.user.tenantId, req.body);
    return sendSuccess(res, tmpl, 'Template updated');
  } catch (err) { next(err); }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    await service.deleteTemplate(req.params.id, req.user.tenantId);
    return sendSuccess(res, null, 'Template deleted');
  } catch (err) { next(err); }
};

export const previewTemplate = async (req, res, next) => {
  try {
    const preview = await service.previewTemplate(req.params.id, req.user.tenantId, req.body.variables);
    return sendSuccess(res, preview);
  } catch (err) { next(err); }
};
