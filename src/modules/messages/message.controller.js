import * as service from './message.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response.js';

export const listMessages = async (req, res, next) => {
  try {
    const { messages, pagination } = await service.listMessages(req.user.tenantId, req.query);
    return sendPaginated(res, messages, pagination);
  } catch (err) { next(err); }
};

export const getMessage = async (req, res, next) => {
  try {
    const message = await service.getMessage(req.params.id, req.user.tenantId);
    return sendSuccess(res, message);
  } catch (err) { next(err); }
};

export const getMessageEvents = async (req, res, next) => {
  try {
    const events = await service.getMessageEvents(req.params.id, req.user.tenantId);
    return sendSuccess(res, events);
  } catch (err) { next(err); }
};

export const sendSms = async (req, res, next) => {
  try {
    const result = await service.sendSingleSms(req.user.tenantId, req.user.id, req.body);
    return sendCreated(res, result, 'SMS sent');
  } catch (err) { next(err); }
};
