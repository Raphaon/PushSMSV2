import Joi from 'joi';

export const createTenantSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  slug: Joi.string().pattern(/^[a-z0-9-]+$/).min(2).max(100).required(),
  country: Joi.string().max(10).optional(),
  timezone: Joi.string().max(100).default('UTC'),
  currency: Joi.string().max(10).default('XAF'),
});

export const updateTenantSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  slug: Joi.string().pattern(/^[a-z0-9-]+$/).min(2).max(100),
  country: Joi.string().max(10).allow(null, ''),
  timezone: Joi.string().max(100),
  currency: Joi.string().max(10),
  status: Joi.string().valid('active', 'suspended', 'inactive'),
}).min(1);
