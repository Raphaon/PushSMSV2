import Joi from 'joi';

export const createSenderIdSchema = Joi.object({
  value: Joi.string().max(15).required(),
  type: Joi.string().valid('ALPHANUMERIC', 'LONGCODE', 'SHORTCODE').default('ALPHANUMERIC'),
});
