import { randomUUID } from 'crypto';
import Node from './node.model.js';
import { ErrorHandler } from '../../../Error.js';


export default class NodeController {


    Mynodes = [
        {
            node_id: '1',
            name: 'Node 1',
            type: 'Default',
            parent_id: null,
            value: 'Value 1',
            next: null  
        },
        {
            node_id: '2',
            name: 'Node 2',
            type: 'Default',
            parent_id: '1',
            value: 'Value 2',
            next: null  
        }   
    ];


  generateNodeId() {
    return randomUUID();
  }

  addNode(req, res) {
    if (!req.body || Object.keys(req.body).length === 0) {
      const errorHandler = new ErrorHandler();
      errorHandler.setError('Invalid request body', 400);
      return res.status(errorHandler.statusCode).json(errorHandler.getError());
    }

    const { name, type, parent_id, value } = req.body;
    const newNode = new Node(value);
    newNode.node_id = this.generateNodeId();
    newNode.name = name || null;
    newNode.type = type || newNode.type;
    newNode.parent_id = parent_id || null;
    newNode.value = value || null;

    if (newNode.save()) {
      this.Mynodes.push(newNode);
      return res.status(201).json(newNode);
    }

    const errorHandler = new ErrorHandler();
    errorHandler.setError('Failed to save node', 500);
    return res.status(errorHandler.statusCode).json(errorHandler.getError());
  }
    

  getAllNodes(req, res) {
    return res.status(200).json(this.Mynodes);
  }
 
       

  getChildNodes(req, res) {
    const { node_id } = req.params;

    if (!node_id) {
      const errorHandler = new ErrorHandler();
      errorHandler.setError('Node ID is required', 400);
      return res.status(errorHandler.statusCode).json(errorHandler.getError());
    }

    const childNodes = this.nodes.filter((item) => item.parent_id === node_id);
    return res.status(200).json(childNodes);
  } 




  deleteNode(req, res) {
    const { node_id } = req.params;

    if (!node_id) {
      const errorHandler = new ErrorHandler();
      errorHandler.setError('Node ID is required', 400);
      return res.status(errorHandler.statusCode).json(errorHandler.getError());
    }

    const index = this.nodes.findIndex((item) => item.node_id === node_id);
    if (index === -1) {
      const errorHandler = new ErrorHandler();
      errorHandler.setError('Node not found', 404);
      return res.status(errorHandler.statusCode).json(errorHandler.getError());
    }

    this.nodes[index].delete();
    this.nodes.splice(index, 1);

    return res.status(200).json({ message: 'Node deleted successfully', node_id });
  }


    updateNode (){

    }

    showNode (){

    }

    assignParentNode (){

    }

getNodeOwner(){

}


  createNode(value) {
    const newNode = new Node(value);
    this.nodes.push(newNode);
    return newNode;
  }

  constructor() {
    this.nodes = [];
  }
}