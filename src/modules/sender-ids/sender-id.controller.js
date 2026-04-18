import * as service from './sender-id.service.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.js';

export const listSenderIds = async (req, res, next) => {
  try {
    const senders = await service.listSenderIds(req.user.tenantId);
    return sendSuccess(res, senders);
  } catch (err) { next(err); }
};

export const createSenderId = async (req, res, next) => {
  try {
    const sender = await service.createSenderId(req.user.tenantId, req.body);
    return sendCreated(res, sender, 'Sender ID created');
  } catch (err) { next(err); }
};

export const activateSenderId = async (req, res, next) => {
  try {
    const sender = await service.activateSenderId(req.params.id, req.user.tenantId);
    return sendSuccess(res, sender, 'Sender ID activated');
  } catch (err) { next(err); }
};

export const deactivateSenderId = async (req, res, next) => {
  try {
    const sender = await service.deactivateSenderId(req.params.id, req.user.tenantId);
    return sendSuccess(res, sender, 'Sender ID deactivated');
  } catch (err) { next(err); }
};
