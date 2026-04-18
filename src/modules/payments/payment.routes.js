import { Router } from 'express';
import { initiatePayment, confirmPayment, cancelPayment } from './payment.controller.js';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { initiatePaymentSchema } from './payment.validation.js';

const router = Router();
router.use(authenticate);

router.post('/', requireRole('ADMIN'), validate(initiatePaymentSchema), initiatePayment);
router.post('/:id/confirm', requireRole('ADMIN'), confirmPayment);
router.post('/:id/cancel', requireRole('ADMIN'), cancelPayment);

export default router;
