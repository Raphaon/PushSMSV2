import * as paymentRepo from './payment.repository.js';
import { creditWallet } from '../wallet/wallet.service.js';
import { withTransaction } from '../../shared/config/database/db.js';
import { NotFoundError, AppError } from '../../shared/errors/AppError.js';

export const initiatePayment = async (tenantId, data) => {
  const normalized = {
    amount: data.amount,
    currency: data.currency || 'XAF',
    paymentMethod: data.provider || data.paymentMethod,
    externalReference: data.phone || data.externalReference || null,
    description: data.description || null,
  };
  const payment = await paymentRepo.create(tenantId, normalized);
  // Expose a user-friendly reference field
  return { ...payment, reference: payment.external_reference || payment.id };
};

export const confirmPayment = async (id, tenantId) => {
  return withTransaction(async (client) => {
    const payment = await paymentRepo.findById(id, tenantId);
    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.status !== 'pending') throw new AppError('Payment cannot be confirmed', 400);

    const updated = await paymentRepo.updateStatus(id, tenantId, 'confirmed', client);

    await creditWallet(
      tenantId,
      parseFloat(updated.amount),
      updated.id,
      `Payment confirmed: ${updated.payment_method}`,
      client
    );

    return updated;
  });
};

export const cancelPayment = async (id, tenantId) => {
  const payment = await paymentRepo.findById(id, tenantId);
  if (!payment) throw new NotFoundError('Payment not found');
  if (payment.status !== 'pending') throw new AppError('Only pending payments can be cancelled', 400);
  return paymentRepo.updateStatus(id, tenantId, 'cancelled');
};
