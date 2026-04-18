import { Router } from 'express';
import { getWallet, getTransactions } from './wallet.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', getWallet);
router.get('/transactions', getTransactions);

export default router;
