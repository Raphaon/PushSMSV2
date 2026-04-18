import * as campaignRepo from './campaign.repository.js';
import * as messageRepo from '../messages/message.repository.js';
import * as senderIdRepo from '../sender-ids/sender-id.repository.js';
import * as listRepo from '../contact-lists/contact-list.repository.js';
import * as providerRepo from '../providers/provider.repository.js';
import { getProvider } from '../providers/provider.factory.js';
import { checkCredits, reserveCreditsForCampaign, settleCreditsAfterCampaign, getCreditsInfo } from '../wallet/wallet.service.js';
import { isOptedOut } from '../opt-outs/opt-out.repository.js';
import { withTransaction } from '../../shared/config/database/db.js';
import { calculateParts } from '../../shared/utils/sms.js';
import { getPagination, buildPaginationMeta } from '../../shared/utils/pagination.js';
import { NotFoundError, ForbiddenError, AppError, BadRequestError } from '../../shared/errors/AppError.js';
import { CAMPAIGN_STATUS } from '../../shared/constants/index.js';

export const listCampaigns = async (tenantId, query) => {
  const { page, limit, offset } = getPagination(query);
  const { rows, total } = await campaignRepo.findByTenant(tenantId, { limit, offset, status: query.status });
  return { campaigns: rows, pagination: buildPaginationMeta(total, page, limit) };
};

export const getCampaign = async (id, tenantId) => {
  const campaign = await campaignRepo.findById(id, tenantId);
  if (!campaign) throw new NotFoundError('Campaign not found');
  return campaign;
};

export const createCampaign = async (tenantId, userId, data) => {
  // Validate sender belongs to tenant
  const sender = await senderIdRepo.findById(data.senderIdId, tenantId);
  if (!sender) throw new NotFoundError('Sender ID not found');

  return campaignRepo.create(tenantId, userId, data);
};

export const updateCampaign = async (id, tenantId, data) => {
  const campaign = await campaignRepo.findById(id, tenantId);
  if (!campaign) throw new NotFoundError('Campaign not found');
  if (campaign.status !== CAMPAIGN_STATUS.DRAFT) throw new BadRequestError('Only DRAFT campaigns can be updated');

  if (data.senderIdId) {
    const sender = await senderIdRepo.findById(data.senderIdId, tenantId);
    if (!sender) throw new NotFoundError('Sender ID not found');
  }

  return campaignRepo.update(id, tenantId, data);
};

export const scheduleCampaign = async (id, tenantId, scheduledAt) => {
  const campaign = await campaignRepo.findById(id, tenantId);
  if (!campaign) throw new NotFoundError('Campaign not found');
  if (campaign.status !== CAMPAIGN_STATUS.DRAFT) throw new BadRequestError('Only DRAFT campaigns can be scheduled');

  return campaignRepo.updateStatus(id, tenantId, CAMPAIGN_STATUS.SCHEDULED, { scheduled_at: scheduledAt });
};

export const cancelCampaign = async (id, tenantId) => {
  const campaign = await campaignRepo.findById(id, tenantId);
  if (!campaign) throw new NotFoundError('Campaign not found');
  const cancellable = [CAMPAIGN_STATUS.DRAFT, CAMPAIGN_STATUS.SCHEDULED];
  if (!cancellable.includes(campaign.status)) throw new BadRequestError('Campaign cannot be cancelled in its current state');

  return campaignRepo.updateStatus(id, tenantId, CAMPAIGN_STATUS.CANCELLED);
};

export const getCampaignReport = async (id, tenantId) => {
  const campaign = await campaignRepo.findById(id, tenantId);
  if (!campaign) throw new NotFoundError('Campaign not found');

  const by_status = await messageRepo.countByStatus(id, tenantId);

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    target_count: campaign.target_count,
    sent_count: campaign.sent_count,
    delivered_count: campaign.delivered_count,
    failed_count: campaign.failed_count,
    estimated_cost: campaign.estimated_cost,
    actual_cost: campaign.actual_cost,
    launched_at: campaign.launched_at,
    completed_at: campaign.completed_at,
    by_status,
    delivery_rate: campaign.sent_count > 0
      ? ((campaign.delivered_count / campaign.sent_count) * 100).toFixed(2) + '%'
      : 'N/A',
  };
};

export const launchCampaign = async (id, tenantId) => {
  return withTransaction(async (client) => {
    // 1. Fetch and validate campaign
    const campaign = await campaignRepo.findById(id, tenantId, client);
    if (!campaign) throw new NotFoundError('Campaign not found');
    if (![CAMPAIGN_STATUS.DRAFT, CAMPAIGN_STATUS.SCHEDULED].includes(campaign.status)) {
      throw new BadRequestError('Campaign cannot be launched in its current state');
    }

    // 2. Validate sender belongs to tenant and is active
    const sender = await senderIdRepo.findById(campaign.sender_id, tenantId);
    if (!sender) throw new ForbiddenError('Sender ID not found or does not belong to this tenant');
    if (sender.status !== 'active') throw new BadRequestError('Sender ID is not active');

    // 3. Validate contact list belongs to tenant
    if (!campaign.contact_list_id) throw new BadRequestError('Campaign has no contact list attached');
    const list = await listRepo.findById(campaign.contact_list_id, tenantId);
    if (!list) throw new ForbiddenError('Contact list does not belong to this tenant');

    // 4. Get valid recipients (active, opted-in, not in opt-out registry)
    const rawRecipients = await listRepo.getActiveMemberPhones(campaign.contact_list_id, tenantId);
    const filteredRecipients = [];
    for (const r of rawRecipients) {
      const optedOut = await isOptedOut(r.phone_number, tenantId);
      if (!optedOut) filteredRecipients.push(r);
    }

    if (filteredRecipients.length === 0) throw new BadRequestError('No valid recipients after opt-out filtering');

    // 5. Get provider
    const provider = await providerRepo.findActiveDefault();
    if (!provider) throw new AppError('No active SMS provider configured', 503);

    const parts = calculateParts(campaign.message_body);
    const recipientCount = filteredRecipients.length;

    // 5b. Check and reserve credits (1 credit per recipient)
    await checkCredits(tenantId, recipientCount);
    await reserveCreditsForCampaign(tenantId, recipientCount, client);

    // 7. Set campaign to PROCESSING and freeze recipient list
    await campaignRepo.updateStatus(id, tenantId, CAMPAIGN_STATUS.PROCESSING, {
      launched_at: new Date().toISOString(),
      target_count: recipientCount,
      estimated_cost: recipientCount,
    }, client);

    await campaignRepo.insertRecipients(id, tenantId, filteredRecipients.map(r => ({
      contactId: r.contact_id,
      phoneNumber: r.phone_number,
    })), client);

    // 8. Send messages
    const recipients = await campaignRepo.getRecipients(id, client);
    const smsProvider = getProvider(provider.name);

    let sentCount = 0;
    let failedCount = 0;
    let actualCost = 0;

    for (const recipient of recipients) {
      const message = await messageRepo.create({
        tenantId, campaignId: id,
        campaignRecipientId: recipient.id,
        contactId: recipient.contact_id,
        providerId: provider.id,
        destinationNumber: recipient.phone_number,
        senderValue: sender.value,
        body: campaign.message_body,
        partsCount: parts,
        unitPrice: 1,
        totalPrice: 1,
      }, client);

      const result = await smsProvider.send({
        destination: recipient.phone_number,
        sender: sender.value,
        message: campaign.message_body,
      });

      if (result.success) {
        await messageRepo.updateStatus(message.id, 'sent', {
          sentAt: new Date().toISOString(),
          providerMessageId: result.providerMessageId,
        }, client);
        await messageRepo.addEvent({
          messageId: message.id, eventType: 'sent',
          providerStatus: result.status, rawPayload: result.rawResponse,
        }, client);
        await campaignRepo.updateRecipientStatus(recipient.id, 'sent', client);
        sentCount++;
        actualCost += 1; // 1 credit per sent message
      } else {
        await messageRepo.updateStatus(message.id, 'failed', {
          failedAt: new Date().toISOString(),
          failureReason: result.failureReason,
        }, client);
        await messageRepo.addEvent({
          messageId: message.id, eventType: 'failed',
          providerStatus: result.status, rawPayload: result.rawResponse,
          reasonCode: result.failureReason,
        }, client);
        await campaignRepo.updateRecipientStatus(recipient.id, 'failed', client);
        failedCount++;
      }
    }

    // 9. Settle credits (release unused reserved credits)
    await settleCreditsAfterCampaign(tenantId, recipientCount, actualCost, client);

    // 10. Update campaign counters and mark completed
    const updated = await campaignRepo.updateCounters(id, tenantId, {
      sentCount, deliveredCount: 0, failedCount, actualCost,
    }, client);

    return updated;
  });
};
