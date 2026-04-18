import { Router } from 'express';
import { createTenant, getTenant, updateTenant } from './tenant.controller.js';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { createTenantSchema, updateTenantSchema } from './tenant.validation.js';

const router = Router();

// Admin-only: platform-level tenant management
router.post('/', validate(createTenantSchema), createTenant);
router.get('/:id', authenticate, getTenant);
router.patch('/:id', authenticate, requireRole('ADMIN'), validate(updateTenantSchema), updateTenant);

export default router;
