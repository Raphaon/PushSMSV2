import { Router } from 'express';
import { listContacts, getContact, createContact, updateContact, deleteContact, importContacts } from './contact.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { createContactSchema, updateContactSchema } from './contact.validation.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();
router.use(authenticate);

router.get('/', listContacts);
router.post('/', validate(createContactSchema), createContact);
router.post('/import', upload.single('file'), importContacts);
router.get('/:id', getContact);
router.patch('/:id', validate(updateContactSchema), updateContact);
router.delete('/:id', deleteContact);

export default router;
