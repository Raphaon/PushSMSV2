import * as repo from './recharge-request.repository.js';
import * as userRepo from '../users/user.repository.js';
import { addCredits, getCreditsInfo } from '../wallet/wallet.service.js';
import { createNotification } from '../notifications/notification.service.js';
import { sendRechargeApprovedEmail, sendRechargeRejectedEmail } from '../email/mail.service.js';
import { withTransaction } from '../../shared/config/database/db.js';
import { getPagination, buildPaginationMeta } from '../../shared/utils/pagination.js';
import { BadRequestError, NotFoundError } from '../../shared/errors/AppError.js';
import { NOTIFICATION_TYPES } from '../../shared/constants/index.js';

const LOW_CREDITS_THRESHOLD_PCT = 0.20;

export const requestRecharge = async (tenantId, userId, { creditsAmount, note }) => {
  if (!Number.isInteger(creditsAmount) || creditsAmount <= 0) {
    throw new BadRequestError('Le nombre de crédits doit être un entier positif');
  }
  return repo.create({ tenantId, requestedBy: userId, creditsAmount, note });
};

export const listRequests = async (tenantId, role, query) => {
  const { page, limit, offset } = getPagination(query);
  const status = query.status || undefined;

  let rows, total;
  if (role === 'SUPERADMIN') {
    ({ rows, total } = await repo.findAll({ limit, offset, status }));
  } else {
    ({ rows, total } = await repo.findByTenant(tenantId, { limit, offset, status }));
  }
  return { requests: rows, pagination: buildPaginationMeta(total, page, limit) };
};

export const reviewRequest = async (id, reviewerUserId, action, adminNote) => {
  if (!['approved', 'rejected'].includes(action)) {
    throw new BadRequestError('Action must be approved or rejected');
  }

  return withTransaction(async (client) => {
    const req = await repo.findById(id, client);
    if (!req) throw new NotFoundError('Recharge request not found');
    if (req.status !== 'pending') throw new BadRequestError('This request has already been reviewed');

    await repo.updateStatus(id, action, reviewerUserId, adminNote, client);

    if (action === 'approved') {
      await addCredits(req.tenant_id, req.credits_amount, client);
    }

    // Notification
    const title = action === 'approved'
      ? `Recharge de ${req.credits_amount} crédits approuvée`
      : 'Demande de recharge rejetée';

    await createNotification({
      tenantId: req.tenant_id,
      userId: req.requested_by,
      type: action === 'approved' ? NOTIFICATION_TYPES.RECHARGE_APPROVED : NOTIFICATION_TYPES.RECHARGE_REJECTED,
      title,
      body: adminNote || '',
      metadata: { requestId: id, creditsAmount: req.credits_amount },
    }, client);

    // Email (non-blocking)
    if (action === 'approved') {
      sendRechargeApprovedEmail(req.requester_email, req.requester_first_name, req.credits_amount).catch(() => {});
    } else {
      sendRechargeRejectedEmail(req.requester_email, req.requester_first_name, adminNote).catch(() => {});
    }

    return { action, requestId: id, creditsAmount: req.credits_amount };
  });
};

// Called after sending messages to check if low on credits
export const checkAndNotifyLowCredits = async (tenantId) => {
  try {
    const info = await getCreditsInfo(tenantId);
    if (info.isLow) {
      await createNotification({
        tenantId,
        type: NOTIFICATION_TYPES.LOW_CREDITS,
        title: `Crédits faibles — il vous reste ${info.credits} crédit(s)`,
        body: 'Pensez à faire une demande de recharge pour ne pas interrompre vos envois.',
        metadata: { credits: info.credits, threshold: info.threshold },
      });
    }
  } catch { /* silent */ }
};
