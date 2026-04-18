import { Router } from 'express';
import { listProviders, getPricing } from './provider.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', listProviders);
router.get('/pricing', getPricing);

export default router;
