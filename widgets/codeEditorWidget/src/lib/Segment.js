import AbstractSegment from "./AbstractSegment";

export default class Segment extends AbstractSegment{
  constructor(value,id,parent){
    super(id,parent);
    this.value=value;
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
