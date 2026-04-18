import { Router } from 'express';
import NodeController from './node.controller.js';

const router = Router();
const nodeController = new NodeController();        

router.get('/', (req, res) => nodeController.getAllNodes(req, res));
router.post('/', (req, res) => nodeController.addNode(req, res));
router.delete('/:node_id', (req, res) => nodeController.deleteNode(req, res));

export default router;
