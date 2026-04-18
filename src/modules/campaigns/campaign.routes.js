import { Router } from 'express';
import {
  listCampaigns, getCampaign, createCampaign, updateCampaign,
  scheduleCampaign, launchCampaign, cancelCampaign, getCampaignReport
} from './campaign.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { createCampaignSchema, updateCampaignSchema, scheduleCampaignSchema } from './campaign.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', listCampaigns);
router.post('/', validate(createCampaignSchema), createCampaign);
router.get('/:id', getCampaign);
router.patch('/:id', validate(updateCampaignSchema), updateCampaign);
router.post('/:id/schedule', validate(scheduleCampaignSchema), scheduleCampaign);
router.post('/:id/launch', launchCampaign);
router.post('/:id/cancel', cancelCampaign);
router.get('/:id/report', getCampaignReport);

export default router;
