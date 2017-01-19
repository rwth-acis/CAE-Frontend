import AbstractSegment from "./AbstractSegment";

export default class UnprotectedSegment extends AbstractSegment{
  constructor(value,id,parent){
    super(id,parent);
    this.value=value;
    this.integrityCheck=false;
  }

  setHash(hash){
    this.hash = hash;
    this.integrityCheck = true;
  }

  toString(){
    return this.value;
  }

  getLength(){
    return this.toString().length;
  }

  setValue(value){
    this.value=value;
  }
}
