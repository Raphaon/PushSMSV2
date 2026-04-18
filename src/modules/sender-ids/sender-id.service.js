import * as repo from './sender-id.repository.js';
import { ConflictError, NotFoundError, BadRequestError } from '../../shared/errors/AppError.js';

const validateSenderValue = (value, type) => {
  if (type === 'ALPHANUMERIC') {
    if (!/^[A-Za-z0-9 ]{1,11}$/.test(value)) throw new BadRequestError('Alphanumeric sender ID must be 1-11 alphanumeric characters');
  }
};

export const listSenderIds = async (tenantId) => repo.findByTenant(tenantId);

export const createSenderId = async (tenantId, data) => {
  validateSenderValue(data.value, data.type);
  const existing = await repo.findByValue(data.value, tenantId);
  if (existing) throw new ConflictError('This sender ID already exists');
  return repo.create(tenantId, data);
};

export const activateSenderId = async (id, tenantId) => {
  const sender = await repo.updateStatus(id, tenantId, 'active');
  if (!sender) throw new NotFoundError('Sender ID not found');
  return sender;
};

export const deactivateSenderId = async (id, tenantId) => {
  const sender = await repo.updateStatus(id, tenantId, 'inactive');
  if (!sender) throw new NotFoundError('Sender ID not found');
  return sender;
};
