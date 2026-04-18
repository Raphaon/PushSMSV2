import * as service from './notification.service.js';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.js';

export const listNotifications = async (req, res, next) => {
  try {
    const { notifications, pagination } = await service.getNotifications(req.user.tenantId, req.user.id, req.query);
    return sendPaginated(res, notifications, pagination);
  } catch (err) { next(err); }
};

export const unreadCount = async (req, res, next) => {
  try {
    const result = await service.getUnreadCount(req.user.tenantId, req.user.id);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const markRead = async (req, res, next) => {
  try {
    const n = await service.markNotificationRead(req.params.id, req.user.tenantId, req.user.id);
    return sendSuccess(res, n);
  } catch (err) { next(err); }
};

export const markAllRead = async (req, res, next) => {
  try {
    await service.markAllNotificationsRead(req.user.tenantId, req.user.id);
    return sendSuccess(res, null, 'Toutes les notifications marquées comme lues');
  } catch (err) { next(err); }
};
