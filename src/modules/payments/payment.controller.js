import * as service from './payment.service.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.js';

export const initiatePayment = async (req, res, next) => {
  try {
    const payment = await service.initiatePayment(req.user.tenantId, req.body);
    return sendCreated(res, payment, 'Payment initiated');
  } catch (err) { next(err); }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const payment = await service.confirmPayment(req.params.id, req.user.tenantId);
    return sendSuccess(res, payment, 'Payment confirmed and wallet credited');
  } catch (err) { next(err); }
};

export const cancelPayment = async (req, res, next) => {
  try {
    const payment = await service.cancelPayment(req.params.id, req.user.tenantId);
    return sendSuccess(res, payment, 'Payment cancelled');
  } catch (err) { next(err); }
};
