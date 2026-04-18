import { Router } from 'express';
import { listNotifications, unreadCount, markRead, markAllRead } from './notification.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', listNotifications);
router.get('/unread-count', unreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

export default router;
