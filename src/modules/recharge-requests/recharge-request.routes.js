import { Router } from 'express';
import { createRequest, listRequests, reviewRequest } from './recharge-request.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { ForbiddenError } from '../../shared/errors/AppError.js';

const router = Router();
router.use(authenticate);

const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'SUPERADMIN') return next(new ForbiddenError('Super admin access required'));
  next();
};

router.get('/', listRequests);
router.post('/', createRequest);
router.patch('/:id/review', requireSuperAdmin, reviewRequest);

export default router;
