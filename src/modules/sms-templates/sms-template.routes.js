import { Router } from 'express';
import { listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, previewTemplate } from './sms-template.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', listTemplates);
router.post('/', createTemplate);
router.get('/:id', getTemplate);
router.patch('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);
router.post('/:id/preview', previewTemplate);

export default router;
