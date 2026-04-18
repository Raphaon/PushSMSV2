import * as service from './recharge-request.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response.js';

export const createRequest = async (req, res, next) => {
  try {
    const request = await service.requestRecharge(req.user.tenantId, req.user.id, {
      creditsAmount: parseInt(req.body.creditsAmount),
      note: req.body.note,
    });
    return sendCreated(res, request, 'Demande de recharge envoyée');
  } catch (err) { next(err); }
};

export const listRequests = async (req, res, next) => {
  try {
    const { requests, pagination } = await service.listRequests(req.user.tenantId, req.user.role, req.query);
    return sendPaginated(res, requests, pagination);
  } catch (err) { next(err); }
};

export const reviewRequest = async (req, res, next) => {
  try {
    const result = await service.reviewRequest(
      req.params.id,
      req.user.id,
      req.body.action,
      req.body.adminNote
    );
    return sendSuccess(res, result, `Demande ${result.action === 'approved' ? 'approuvée' : 'rejetée'}`);
  } catch (err) { next(err); }
};
