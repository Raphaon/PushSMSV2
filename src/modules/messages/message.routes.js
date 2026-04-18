import { Router } from 'express';
import { listMessages, getMessage, getMessageEvents, sendSms } from './message.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import Joi from 'joi';

const sendSmsSchema = Joi.object({
  senderIdId: Joi.string().uuid().required(),
  destinations: Joi.array().items(Joi.string().min(5).max(20)).min(1).max(500).required(),
  message: Joi.string().min(1).max(1600).required(),
});

const router = Router();
router.use(authenticate);

router.post('/send', validate(sendSmsSchema), sendSms);
router.get('/', listMessages);
router.get('/:id', getMessage);
router.get('/:id/events', getMessageEvents);

export default router;
