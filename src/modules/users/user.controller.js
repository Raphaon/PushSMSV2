import * as userService from './user.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response.js';
import { logAction } from '../audit-logs/audit-log.service.js';

export const listUsers = async (req, res, next) => {
  try {
    const { users, pagination } = await userService.listUsers(req.user.tenantId, req.query);
    return sendPaginated(res, users, pagination);
  } catch (err) { next(err); }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUser(req.params.id, req.user.tenantId);
    return sendSuccess(res, user);
  } catch (err) { next(err); }
};

export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.user.tenantId, req.body);
    logAction({ tenantId: req.user.tenantId, userId: req.user.id, action: 'user.create', entityType: 'user', entityId: user.id, metadata: { email: user.email } }).catch(() => {});
    return sendCreated(res, user, 'User created successfully');
  } catch (err) { next(err); }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.user.tenantId, req.body);
    logAction({ tenantId: req.user.tenantId, userId: req.user.id, action: 'user.update', entityType: 'user', entityId: req.params.id }).catch(() => {});
    return sendSuccess(res, user, 'User updated');
  } catch (err) { next(err); }
};

export const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user.tenantId, req.user.id);
    logAction({ tenantId: req.user.tenantId, userId: req.user.id, action: 'user.delete', entityType: 'user', entityId: req.params.id }).catch(() => {});
    return sendSuccess(res, null, 'User deactivated');
  } catch (err) { next(err); }
};

export const changePassword = async (req, res, next) => {
  try {
    await userService.changePassword(req.params.id, req.user.tenantId, req.body);
    return sendSuccess(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
};
