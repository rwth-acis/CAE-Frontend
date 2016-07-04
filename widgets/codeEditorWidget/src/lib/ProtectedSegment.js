import AbstractSegment from "./AbstractSegment";
/**
 * Special class for protected segments that ensures that the content cannnot be modified
 */
export default class ProtectedSegment extends AbstractSegment{

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

  setValue(){
    throw new Error("You must not change a protected segment");
  }
}
