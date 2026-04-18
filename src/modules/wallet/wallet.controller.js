import * as walletService from './wallet.service.js';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.js';

export const getWallet = async (req, res, next) => {
  try {
    const wallet = await walletService.getWallet(req.user.tenantId);
    return sendSuccess(res, wallet);
  } catch (err) { next(err); }
};

export const getTransactions = async (req, res, next) => {
  try {
    const { transactions, pagination } = await walletService.getTransactions(req.user.tenantId, req.query);
    return sendPaginated(res, transactions, pagination);
  } catch (err) { next(err); }
};
