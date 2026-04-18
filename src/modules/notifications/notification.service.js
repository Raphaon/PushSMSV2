import * as repo from './notification.repository.js';
import { getPagination, buildPaginationMeta } from '../../shared/utils/pagination.js';
import { NotFoundError } from '../../shared/errors/AppError.js';

export const createNotification = async (data, client) => {
  try {
    return await repo.create(data, client);
  } catch (err) {
    console.error('[notifications] Failed to create:', err.message);
    return null;
  }
};

export const getNotifications = async (tenantId, userId, query) => {
  const { page, limit, offset } = getPagination(query);
  const { rows, total } = await repo.findByUser(tenantId, userId, { limit, offset });
  return { notifications: rows, pagination: buildPaginationMeta(total, page, limit) };
};

export const getUnreadCount = async (tenantId, userId) => {
  const count = await repo.countUnread(tenantId, userId);
  return { count };
};

export const markNotificationRead = async (id, tenantId, userId) => {
  const n = await repo.markRead(id, tenantId, userId);
  if (!n) throw new NotFoundError('Notification not found');
  return n;
};

export const markAllNotificationsRead = async (tenantId, userId) => {
  await repo.markAllRead(tenantId, userId);
};
