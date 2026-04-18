import * as tenantService from './tenant.service.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.js';

export const createTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.createTenant(req.body);
    return sendCreated(res, tenant, 'Tenant created successfully');
  } catch (err) { next(err); }
};

export const getTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.getTenant(req.params.id);
    return sendSuccess(res, tenant);
  } catch (err) { next(err); }
};

export const updateTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    return sendSuccess(res, tenant, 'Tenant updated');
  } catch (err) { next(err); }
};
