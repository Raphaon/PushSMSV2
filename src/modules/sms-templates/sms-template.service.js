import * as repo from './sms-template.repository.js';
import { NotFoundError } from '../../shared/errors/AppError.js';
import { calculateParts, injectVariables } from '../../shared/utils/sms.js';
import { getPagination, buildPaginationMeta } from '../../shared/utils/pagination.js';

export const listTemplates = async (tenantId, query) => {
  const { page, limit, offset } = getPagination(query);
  const { rows, total } = await repo.findByTenant(tenantId, { limit, offset });
  return { templates: rows, pagination: buildPaginationMeta(total, page, limit) };
};

export const getTemplate = async (id, tenantId) => {
  const tmpl = await repo.findById(id, tenantId);
  if (!tmpl) throw new NotFoundError('Template not found');
  return tmpl;
};

export const createTemplate = async (tenantId, data) => repo.create(tenantId, data);

export const updateTemplate = async (id, tenantId, data) => {
  const tmpl = await repo.update(id, tenantId, data);
  if (!tmpl) throw new NotFoundError('Template not found');
  return tmpl;
};

export const deleteTemplate = async (id, tenantId) => {
  const tmpl = await repo.remove(id, tenantId);
  if (!tmpl) throw new NotFoundError('Template not found');
};

export const previewTemplate = async (id, tenantId, variables = {}) => {
  const tmpl = await getTemplate(id, tenantId);
  const body = injectVariables(tmpl.body, variables);
  return { body, parts: calculateParts(body), charCount: body.length };
};
