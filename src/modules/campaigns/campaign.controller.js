import * as service from './campaign.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response.js';

export const listCampaigns = async (req, res, next) => {
  try {
    const { campaigns, pagination } = await service.listCampaigns(req.user.tenantId, req.query);
    return sendPaginated(res, campaigns, pagination);
  } catch (err) { next(err); }
};

export const getCampaign = async (req, res, next) => {
  try {
    const campaign = await service.getCampaign(req.params.id, req.user.tenantId);
    return sendSuccess(res, campaign);
  } catch (err) { next(err); }
};

export const createCampaign = async (req, res, next) => {
  try {
    const campaign = await service.createCampaign(req.user.tenantId, req.user.id, req.body);
    return sendCreated(res, campaign, 'Campaign created');
  } catch (err) { next(err); }
};

export const updateCampaign = async (req, res, next) => {
  try {
    const campaign = await service.updateCampaign(req.params.id, req.user.tenantId, req.body);
    return sendSuccess(res, campaign, 'Campaign updated');
  } catch (err) { next(err); }
};

export const scheduleCampaign = async (req, res, next) => {
  try {
    const campaign = await service.scheduleCampaign(req.params.id, req.user.tenantId, req.body.scheduledAt);
    return sendSuccess(res, campaign, 'Campaign scheduled');
  } catch (err) { next(err); }
};

export const launchCampaign = async (req, res, next) => {
  try {
    const campaign = await service.launchCampaign(req.params.id, req.user.tenantId);
    return sendSuccess(res, campaign, 'Campaign launched successfully');
  } catch (err) { next(err); }
};

export const cancelCampaign = async (req, res, next) => {
  try {
    const campaign = await service.cancelCampaign(req.params.id, req.user.tenantId);
    return sendSuccess(res, campaign, 'Campaign cancelled');
  } catch (err) { next(err); }
};

export const getCampaignReport = async (req, res, next) => {
  try {
    const report = await service.getCampaignReport(req.params.id, req.user.tenantId);
    return sendSuccess(res, report);
  } catch (err) { next(err); }
};
