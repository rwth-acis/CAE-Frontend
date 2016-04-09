import AbstractSegment from "./AbstractSegment";

export default class Segment extends AbstractSegment{
    constructor(value,id,parent){
        super(id,parent);
        this.value=value;
    }
    
    toString(){
        return this.value;
    }
    
    setValue(value){
        this.value=value;
    }
}