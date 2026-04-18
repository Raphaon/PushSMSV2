import * as service from './opt-out.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response.js';

export const listOptOuts = async (req, res, next) => {
  try {
    const { optOuts, pagination } = await service.listOptOuts(req.user.tenantId, req.query);
    return sendPaginated(res, optOuts, pagination);
  } catch (err) { next(err); }
};

export const checkOptOut = async (req, res, next) => {
  try {
    const result = await service.checkOptOut(req.query.phone, req.user.tenantId);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const createOptOut = async (req, res, next) => {
  try {
    const optOut = await service.createOptOut(req.user.tenantId, req.user.id, req.body);
    return sendCreated(res, optOut, 'Opt-out registered');
  } catch (err) { next(err); }
};

export const removeOptOut = async (req, res, next) => {
  try {
    await service.removeOptOut(req.body.phoneNumber, req.user.tenantId);
    return sendSuccess(res, null, 'Opt-out removed');
  } catch (err) { next(err); }
};
