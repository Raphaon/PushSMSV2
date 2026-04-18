import * as tenantRepo from './tenant.repository.js';
import * as walletRepo from '../wallet/wallet.repository.js';
import { withTransaction } from '../../shared/config/database/db.js';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError.js';

export const createTenant = async (data) => {
  const existing = await tenantRepo.findBySlug(data.slug);
  if (existing) throw new ConflictError(`Slug '${data.slug}' is already taken`);

  return withTransaction(async (client) => {
    const tenant = await tenantRepo.create(data, client);
    await walletRepo.createForTenant(tenant.id, client);
    return tenant;
  });
};

export const getTenant = async (id) => {
  const tenant = await tenantRepo.findById(id);
  if (!tenant) throw new NotFoundError('Tenant not found');
  return tenant;
};

export const updateTenant = async (id, data) => {
  if (data.slug) {
    const existing = await tenantRepo.findBySlug(data.slug);
    if (existing && existing.id !== id) throw new ConflictError(`Slug '${data.slug}' is already taken`);
  }
  const tenant = await tenantRepo.update(id, data);
  if (!tenant) throw new NotFoundError('Tenant not found');
  return tenant;
};
