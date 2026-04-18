import * as service from './api-key.service.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.js';

export const listApiKeys = async (req, res, next) => {
  try {
    const keys = await service.listApiKeys(req.user.tenantId);
    return sendSuccess(res, keys);
  } catch (err) { next(err); }
};

export const createApiKey = async (req, res, next) => {
  try {
    const key = await service.createApiKey(req.user.tenantId, req.body);
    return sendCreated(res, key, 'API key created. Store the fullKey securely — it will not be shown again.');
  } catch (err) { next(err); }
};

export const revokeApiKey = async (req, res, next) => {
  try {
    await service.revokeApiKey(req.params.id, req.user.tenantId);
    return sendSuccess(res, null, 'API key revoked');
  } catch (err) { next(err); }
};
