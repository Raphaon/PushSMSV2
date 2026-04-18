import { Router } from 'express';
import { listUsers, getUser, createUser, updateUser, deleteUser, changePassword } from './user.controller.js';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { createUserSchema, updateUserSchema, changePasswordSchema } from './user.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', listUsers);
router.post('/', requireRole('ADMIN'), validate(createUserSchema), createUser);
router.get('/:id', getUser);
router.patch('/:id', requireRole('ADMIN'), validate(updateUserSchema), updateUser);
router.delete('/:id', requireRole('ADMIN'), deleteUser);
router.post('/:id/change-password', validate(changePasswordSchema), changePassword);

export default router;
