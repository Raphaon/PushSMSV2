import Joi from 'joi';

export const createContactSchema = Joi.object({
  firstName: Joi.string().max(100).allow('', null),
  lastName: Joi.string().max(100).allow('', null),
  phoneNumber: Joi.string().max(30).required(),
  email: Joi.string().email().allow('', null),
  country: Joi.string().max(10).allow('', null),
  city: Joi.string().max(100).allow('', null),
});

export const updateContactSchema = Joi.object({
  firstName: Joi.string().max(100).allow('', null),
  lastName: Joi.string().max(100).allow('', null),
  email: Joi.string().email().allow('', null),
  country: Joi.string().max(10).allow('', null),
  city: Joi.string().max(100).allow('', null),
  optInStatus: Joi.string().valid('opted_in', 'opted_out'),
  status: Joi.string().valid('active', 'archived'),
}).min(1);
