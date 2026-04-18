import * as walletRepo from './wallet.repository.js';
import { NotFoundError, AppError } from '../../shared/errors/AppError.js';
import { getPagination, buildPaginationMeta } from '../../shared/utils/pagination.js';
import { WALLET_TX_TYPES, WALLET_TX_DIRECTIONS } from '../../shared/constants/index.js';

export const getWallet = async (tenantId) => {
  const wallet = await walletRepo.findByTenant(tenantId);
  if (!wallet) throw new NotFoundError('Wallet not found');
  return {
    ...wallet,
    availableBalance: parseFloat(wallet.balance),
    reservedBalance: parseFloat(wallet.reserved_balance),
    messageCredits: parseInt(wallet.message_credits || 0),
    reservedCredits: parseInt(wallet.reserved_credits || 0),
  };
};

export const getCreditsInfo = async (tenantId) => {
  const wallet = await walletRepo.findByTenant(tenantId);
  if (!wallet) throw new NotFoundError('Wallet not found');
  const credits = parseInt(wallet.message_credits || 0);
  const lastAmount = wallet.last_credit_amount ? parseInt(wallet.last_credit_amount) : null;
  const threshold = lastAmount ? Math.max(10, Math.ceil(lastAmount * 0.20)) : 10;
  return {
    credits,
    reservedCredits: parseInt(wallet.reserved_credits || 0),
    lastCreditAmount: lastAmount,
    lastCreditsAt: wallet.last_credits_at,
    threshold,
    isLow: credits <= threshold,
  };
};

export const addCredits = async (tenantId, credits, client) => {
  const wallet = await walletRepo.findByTenant(tenantId, client);
  if (!wallet) throw new NotFoundError('Wallet not found');
  return walletRepo.creditCredits(wallet.id, credits, credits, client);
};

export const checkCredits = async (tenantId, required) => {
  const wallet = await walletRepo.findByTenant(tenantId);
  if (!wallet) throw new NotFoundError('Wallet not found');
  const avail = parseInt(wallet.message_credits || 0);
  if (avail < required) throw new AppError(`Crédits insuffisants (${avail} dispo, ${required} requis)`, 402);
  return wallet;
};

export const reserveCreditsForCampaign = async (tenantId, amount, client) => {
  const wallet = await walletRepo.findByTenant(tenantId, client);
  if (!wallet) throw new NotFoundError('Wallet not found');
  const updated = await walletRepo.reserveCredits(wallet.id, amount, client);
  if (!updated) throw new AppError(`Crédits insuffisants pour la campagne`, 402);
  return updated;
};

export const settleCreditsAfterCampaign = async (tenantId, reservedAmount, actualAmount, client) => {
  const wallet = await walletRepo.findByTenant(tenantId, client);
  if (!wallet) throw new NotFoundError('Wallet not found');
  return walletRepo.settleCreditsReservation(wallet.id, reservedAmount, actualAmount, client);
};

export const getTransactions = async (tenantId, query) => {
  const { page, limit, offset } = getPagination(query);
  const { rows, total } = await walletRepo.findTransactions(tenantId, { limit, offset, type: query.type });
  return { transactions: rows, pagination: buildPaginationMeta(total, page, limit) };
};

export const creditWallet = async (tenantId, amount, paymentTransactionId, description, client) => {
  const wallet = await walletRepo.findByTenant(tenantId, client);
  if (!wallet) throw new NotFoundError('Wallet not found');

  const before = parseFloat(wallet.balance);
  const updated = await walletRepo.credit(wallet.id, amount, client);
  const after = parseFloat(updated.balance);

  await walletRepo.createTransaction({
    walletId: wallet.id, tenantId, paymentTransactionId,
    type: WALLET_TX_TYPES.CREDIT, direction: WALLET_TX_DIRECTIONS.IN,
    amount, balanceBefore: before, balanceAfter: after, description,
  }, client);

  return updated;
};

export const reserveForCampaign = async (tenantId, campaignId, amount, client) => {
  const wallet = await walletRepo.findByTenant(tenantId, client);
  if (!wallet) throw new NotFoundError('Wallet not found');

  const before = parseFloat(wallet.balance);
  const updated = await walletRepo.reserve(wallet.id, amount, client);
  if (!updated) throw new AppError('Insufficient wallet balance', 402);

  const after = parseFloat(updated.balance);
  await walletRepo.createTransaction({
    walletId: wallet.id, tenantId, campaignId,
    type: WALLET_TX_TYPES.RESERVE, direction: WALLET_TX_DIRECTIONS.OUT,
    amount, balanceBefore: before, balanceAfter: after,
    description: 'Campaign cost reservation',
  }, client);

  return updated;
};

export const debitForSms = async (tenantId, amount, description, client) => {
  const wallet = await walletRepo.findByTenant(tenantId, client);
  if (!wallet) throw new NotFoundError('Wallet not found');

  const before = parseFloat(wallet.balance);
  if (before < amount) throw new AppError('Insufficient wallet balance', 402);

  const updated = await walletRepo.debit(wallet.id, amount, client);
  if (!updated) throw new AppError('Insufficient wallet balance', 402);

  await walletRepo.createTransaction({
    walletId: wallet.id, tenantId,
    type: WALLET_TX_TYPES.DEBIT, direction: WALLET_TX_DIRECTIONS.OUT,
    amount, balanceBefore: before,
    balanceAfter: parseFloat(updated.balance),
    description,
  }, client);

  return updated;
};

export const settleAfterCampaign = async (tenantId, campaignId, reservedAmount, actualAmount, client) => {
  const wallet = await walletRepo.findByTenant(tenantId, client);
  if (!wallet) throw new NotFoundError('Wallet not found');

  const before = parseFloat(wallet.balance) + parseFloat(wallet.reserved_balance);
  const updated = await walletRepo.settleReservation(wallet.id, reservedAmount, actualAmount, client);

  if (actualAmount > 0) {
    await walletRepo.createTransaction({
      walletId: wallet.id, tenantId, campaignId,
      type: WALLET_TX_TYPES.DEBIT, direction: WALLET_TX_DIRECTIONS.OUT,
      amount: actualAmount, balanceBefore: before,
      balanceAfter: parseFloat(updated.balance),
      description: 'Campaign actual cost',
    }, client);
  }

  const refund = reservedAmount - actualAmount;
  if (refund > 0) {
    await walletRepo.createTransaction({
      walletId: wallet.id, tenantId, campaignId,
      type: WALLET_TX_TYPES.RELEASE, direction: WALLET_TX_DIRECTIONS.IN,
      amount: refund, balanceBefore: parseFloat(updated.balance) - refund,
      balanceAfter: parseFloat(updated.balance),
      description: 'Campaign reservation release',
    }, client);
  }

  return updated;
};
