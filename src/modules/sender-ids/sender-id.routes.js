import { Router } from 'express';
import { listSenderIds, createSenderId, activateSenderId, deactivateSenderId } from './sender-id.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { createSenderIdSchema } from './sender-id.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', listSenderIds);
router.post('/', validate(createSenderIdSchema), createSenderId);
router.patch('/:id/activate', activateSenderId);
router.patch('/:id/deactivate', deactivateSenderId);

export default router;
