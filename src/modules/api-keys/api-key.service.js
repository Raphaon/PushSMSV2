import { randomBytes, createHash } from 'crypto';
import * as repo from './api-key.repository.js';
import { NotFoundError } from '../../shared/errors/AppError.js';

const generateKey = () => {
  const prefix = 'psk_' + randomBytes(3).toString('hex');
  const secret = randomBytes(32).toString('hex');
  const fullKey = `${prefix}_${secret}`;
  const secretHash = createHash('sha256').update(fullKey).digest('hex');
  return { prefix, fullKey, secretHash };
};

export const listApiKeys = async (tenantId) => repo.findByTenant(tenantId);

export const createApiKey = async (tenantId, data) => {
  const { prefix, fullKey, secretHash } = generateKey();
  const apiKey = await repo.create(tenantId, {
    name: data.name,
    keyPrefix: prefix,
    secretHash,
    expiresAt: data.expiresAt || null,
  });

  // Return the full key only on creation — never again (expose as both 'key' and 'fullKey')
  return { ...apiKey, fullKey, key: fullKey };
};

export const revokeApiKey = async (id, tenantId) => {
  const key = await repo.revoke(id, tenantId);
  if (!key) throw new NotFoundError('API key not found');
};
