import Joi from 'joi';

export const initiatePaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().max(10).default('XAF'),
  // Accept 'provider' (frontend) or 'paymentMethod' (legacy)
  provider: Joi.string().max(50),
  paymentMethod: Joi.string().max(50),
  // Accept 'phone' (frontend Mobile Money) or 'externalReference' (legacy)
  phone: Joi.string().max(30).allow('', null),
  externalReference: Joi.string().max(255).allow('', null),
  description: Joi.string().max(500).allow('', null),
}).or('paymentMethod', 'provider');
