import AbstractSegment from "./AbstractSegment";

export default class CompositeSegment extends AbstractSegment{
    constructor(id,parent,orderAble,children){
        super(id,parent);
        this.children = children;
    }
    
    getChildren(){
        return this.children;
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