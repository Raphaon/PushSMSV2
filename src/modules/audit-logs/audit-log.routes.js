import { Router } from 'express';
import { listAuditLogs } from './audit-log.controller.js';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware.js';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));
router.get('/', listAuditLogs);

export default router;
