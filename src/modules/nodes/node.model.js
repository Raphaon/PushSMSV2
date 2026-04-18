import { node_type } from './node_type.js';
export default class node {

  constructor(value) {

    this.node_id = null;
    this.name = null;
    this.type = node_type.Default;
    this.parent_id = null;
    this.value = value;
    this.next = null;
    
  }


  save(){
    return true
  }

  delete(){
    return true
  }
}