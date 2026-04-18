import Joi from 'joi';

export const createCampaignSchema = Joi.object({
  name: Joi.string().max(255).required(),
  messageBody: Joi.string().min(1).required(),
  type: Joi.string().valid('MARKETING', 'TRANSACTIONAL').default('MARKETING'),
  senderIdId: Joi.string().uuid().required(),
  contactListId: Joi.string().uuid().optional().allow(null),
  templateId: Joi.string().uuid().optional().allow(null),
});

export const updateCampaignSchema = Joi.object({
  name: Joi.string().max(255),
  messageBody: Joi.string().min(1),
  type: Joi.string().valid('MARKETING', 'TRANSACTIONAL'),
  senderIdId: Joi.string().uuid().allow(null),
  contactListId: Joi.string().uuid().allow(null),
  templateId: Joi.string().uuid().allow(null),
}).min(1);

export const scheduleCampaignSchema = Joi.object({
  scheduledAt: Joi.date().iso().greater('now').required(),
});
