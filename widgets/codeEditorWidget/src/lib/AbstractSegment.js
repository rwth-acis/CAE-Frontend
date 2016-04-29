export default class AbstractSegment{
  constructor(id,parent){
    this.id=id;
    this.parent = parent;
  }

  getId(){
    return this.id;
  }

  getParent(){
    return this.parent;
  }
}
