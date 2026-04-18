import { Router } from 'express';
import {
  listContactLists, getContactList, createContactList,
  updateContactList, deleteContactList, addMember, removeMember, getMembers, importToList
} from './contact-list.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();
router.use(authenticate);

router.get('/', listContactLists);
router.post('/', createContactList);
router.get('/:id', getContactList);
router.patch('/:id', updateContactList);
router.delete('/:id', deleteContactList);
router.get('/:id/members', getMembers);
router.post('/:id/members', addMember);
router.post('/:id/import', upload.single('file'), importToList);
router.delete('/:id/members/:contactId', removeMember);

export default router;
