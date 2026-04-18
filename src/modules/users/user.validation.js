import Joi from 'joi';

export const createUserSchema = Joi.object({
  firstName: Joi.string().max(100).optional().allow('', null),
  lastName: Joi.string().max(100).optional().allow('', null),
  email: Joi.string().email().lowercase().required(),
  phone: Joi.string().max(30).optional().allow('', null),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('ADMIN', 'OPERATOR').default('OPERATOR'),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().max(100).allow('', null),
  lastName: Joi.string().max(100).allow('', null),
  phone: Joi.string().max(30).allow('', null),
  role: Joi.string().valid('ADMIN', 'OPERATOR'),
  status: Joi.string().valid('active', 'suspended', 'inactive'),
}).min(1);

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});
