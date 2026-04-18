import * as service from './provider.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export const listProviders = async (req, res, next) => {
  try {
    const providers = await service.listProviders();
    return sendSuccess(res, providers);
  } catch (err) { next(err); }
};

export const getPricing = async (req, res, next) => {
  try {
    const pricing = await service.getPricing();
    return sendSuccess(res, pricing);
  } catch (err) { next(err); }
};
