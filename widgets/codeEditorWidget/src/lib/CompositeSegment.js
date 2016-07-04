import AbstractSegment from "./AbstractSegment";

export default class CompositeSegment extends AbstractSegment{
  
  constructor(id,parent,children, type){
    super(id,parent);
    this.children = children;
    this.type = type;
  }

  getChildren(){
    return this.children;
  }

  getType(){
    return this.type;
  }

  getLength(){
    let length=0;
    for(let i=0;i<this.children.length;i++){
      let child = this.children[i];
      length+=child.getLength();
    }
    return length;
  }
}
