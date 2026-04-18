import * as messageRepo from './message.repository.js';
import * as senderIdRepo from '../sender-ids/sender-id.repository.js';
import * as providerRepo from '../providers/provider.repository.js';
import { getProvider } from '../providers/provider.factory.js';
import { checkCredits } from '../wallet/wallet.service.js';
import { checkAndNotifyLowCredits } from '../recharge-requests/recharge-request.service.js';
import { withTransaction } from '../../shared/config/database/db.js';
import { calculateParts } from '../../shared/utils/sms.js';
import { NotFoundError, AppError, BadRequestError } from '../../shared/errors/AppError.js';
import { getPagination, buildPaginationMeta } from '../../shared/utils/pagination.js';

export const listMessages = async (tenantId, query) => {
  const { page, limit, offset } = getPagination(query);
  const { rows, total } = await messageRepo.findByTenant(tenantId, {
    limit, offset,
    campaignId: query.campaign_id || query.campaignId,
    status: query.status,
  });
  return { messages: rows, pagination: buildPaginationMeta(total, page, limit) };
};

export const getMessage = async (id, tenantId) => {
  const message = await messageRepo.findById(id, tenantId);
  if (!message) throw new NotFoundError('Message not found');
  return message;
};

export const getMessageEvents = async (id, tenantId) => {
  const events = await messageRepo.getEvents(id, tenantId);
  if (events === null) throw new NotFoundError('Message not found');
  return events;
};

export const sendSingleSms = async (tenantId, userId, data) => {
  const { senderIdId, destinations, message } = data;

  if (!Array.isArray(destinations) || destinations.length === 0) {
    throw new BadRequestError('At least one destination required');
  }

  const sender = await senderIdRepo.findById(senderIdId, tenantId);
  if (!sender) throw new NotFoundError('Sender ID not found');
  if (sender.status !== 'active') throw new BadRequestError('Sender ID is not active');

  const provider = await providerRepo.findActiveDefault();
  if (!provider) throw new AppError('No active SMS provider configured', 503);

  const parts = calculateParts(message);

  // Check credits upfront
  await checkCredits(tenantId, destinations.length);

  return withTransaction(async (client) => {
    const smsProvider = getProvider(provider.name);
    const results = [];
    let creditsUsed = 0;

    for (const dest of destinations) {
      const phone = String(dest).trim();
      const msg = await messageRepo.create({
        tenantId, campaignId: null, campaignRecipientId: null, contactId: null,
        providerId: provider.id, destinationNumber: phone,
        senderValue: sender.value, body: message, partsCount: parts,
        unitPrice: 1, totalPrice: 1,
      }, client);

      const result = await smsProvider.send({ destination: phone, sender: sender.value, message });

      if (result.success) {
        await messageRepo.updateStatus(msg.id, 'sent', {
          sentAt: new Date().toISOString(), providerMessageId: result.providerMessageId,
        }, client);
        await messageRepo.addEvent({ messageId: msg.id, eventType: 'sent', providerStatus: result.status, rawPayload: result.rawResponse }, client);
        // Debit 1 credit per successfully sent message
        await client.query(
          'UPDATE wallets SET message_credits = message_credits - 1 WHERE tenant_id = $1 AND message_credits >= 1',
          [tenantId]
        );
        creditsUsed++;
        results.push({ destination: phone, status: 'sent', messageId: msg.id });
      } else {
        await messageRepo.updateStatus(msg.id, 'failed', {
          failedAt: new Date().toISOString(), failureReason: result.failureReason,
        }, client);
        await messageRepo.addEvent({ messageId: msg.id, eventType: 'failed', providerStatus: result.status, rawPayload: result.rawResponse, reasonCode: result.failureReason }, client);
        results.push({ destination: phone, status: 'failed', reason: result.failureReason, messageId: msg.id });
      }
    }

    const sent = results.filter(r => r.status === 'sent').length;
    const failed = results.filter(r => r.status === 'failed').length;
    return { sent, failed, total: results.length, creditsUsed, results };
  }).then(result => {
    checkAndNotifyLowCredits(tenantId).catch(() => {});
    return result;
  });
};
