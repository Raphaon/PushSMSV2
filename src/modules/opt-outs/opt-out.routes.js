import { Router } from 'express';
import { listOptOuts, checkOptOut, createOptOut, removeOptOut } from './opt-out.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', listOptOuts);
router.get('/check', checkOptOut);
router.post('/', createOptOut);
router.delete('/', removeOptOut);

export default router;
