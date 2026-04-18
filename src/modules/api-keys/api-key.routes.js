import { Router } from 'express';
import { listApiKeys, createApiKey, revokeApiKey } from './api-key.controller.js';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware.js';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));

router.get('/', listApiKeys);
router.post('/', createApiKey);
router.delete('/:id', revokeApiKey);

export default router;
