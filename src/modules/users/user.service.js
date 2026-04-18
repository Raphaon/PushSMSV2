import bcrypt from 'bcryptjs';
import * as userRepo from './user.repository.js';
import pool from '../../shared/config/database/db.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../shared/errors/AppError.js';
import { getPagination, buildPaginationMeta } from '../../shared/utils/pagination.js';

const SALT_ROUNDS = 12;

export const listUsers = async (tenantId, query) => {
  const { page, limit, offset } = getPagination(query);
  const { rows, total } = await userRepo.findByTenant(tenantId, { limit, offset, search: query.search });
  return { users: rows, pagination: buildPaginationMeta(total, page, limit) };
};

export const getUser = async (id, tenantId) => {
  const user = await userRepo.findById(id, tenantId);
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const createUser = async (tenantId, data) => {
  const existing = await userRepo.findByEmail(data.email, tenantId);
  if (existing) throw new ConflictError('A user with this email already exists in this tenant');

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  return userRepo.create({ ...data, tenantId, passwordHash });
};

export const updateUser = async (id, tenantId, data) => {
  const user = await userRepo.update(id, tenantId, data);
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const deleteUser = async (id, tenantId, requesterId) => {
  if (id === requesterId) throw new ConflictError('You cannot delete your own account');
  const user = await userRepo.remove(id, tenantId);
  if (!user) throw new NotFoundError('User not found');
};

export const changePassword = async (id, tenantId, { currentPassword, newPassword }) => {
  const result = await pool.query(
    'SELECT password_hash FROM users WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );
  const user = result.rows[0];
  if (!user) throw new NotFoundError('User not found');

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new UnauthorizedError('Current password is incorrect');

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userRepo.updatePassword(id, tenantId, newHash);
};
