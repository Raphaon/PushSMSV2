import * as authService from './auth.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { NotFoundError } from '../../shared/errors/AppError.js';
import { logAction } from '../audit-logs/audit-log.service.js';

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    logAction({ tenantId: result.user?.tenantId, userId: result.user?.id, action: 'auth.login', entityType: 'user', entityId: result.user?.id, metadata: { email: result.user?.email } }).catch(() => {});
    return sendSuccess(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    logAction({ tenantId: result.user?.tenantId, userId: result.user?.id, action: 'tenant.register', entityType: 'tenant', entityId: result.user?.tenantId, metadata: { email: result.user?.email, company: req.body.companyName } }).catch(() => {});
    return sendSuccess(res, result, 'Account created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    if (!user) throw new NotFoundError('User not found');
    return sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    return sendSuccess(res, null, 'Si un compte existe, un email a été envoyé');
  } catch (err) { next(err); }
};

export const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    return sendSuccess(res, null, 'Mot de passe réinitialisé avec succès');
  } catch (err) { next(err); }
};

export const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.id, req.user.tenantId, req.body.currentPassword, req.body.newPassword);
    return sendSuccess(res, null, 'Mot de passe modifié avec succès');
  } catch (err) { next(err); }
};
