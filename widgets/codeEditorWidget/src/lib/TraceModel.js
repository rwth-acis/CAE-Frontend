import Segment from "./Segment";
import ProtectedSegment from "./ProtectedSegment";
import CompositeSegment from "./CompositeSegment";

let _parseSegments = function(segments,text,s=0,depth=0,parent){
    let res = {};
    let indexes = [];
    for(let i=0;i<segments.length;i++){
        let segment = segments[i];
        if (segment.type === "composite") {
            let sub = _parseSegments(segment.traceSegments,text,s,depth+1,segment.id);
            let subS = sub.traceSegments.segments;
            let subI = sub.traceSegments.indexes;
            let length = 0;

            for(let ii=0;ii<subI.length;ii++){
                let id= subI[ii].id;
                if ( subS.hasOwnProperty(id) ) {
                    length+=subS[id].getLength();
                }
            }

            for(let id in subS){
                if ( subS.hasOwnProperty(id) ){
                    if(!res.hasOwnProperty(id) ) {
                        res[id]=subS[id];
                    }
                }
            }

            res[segment.id] = new CompositeSegment(segment.id,parent,segment.orderAble,subI.map( elm => subS[elm.id] ) );
            indexes.push({id:segment.id,children:subI});
            s+=length;

        }else{
            let {length,type,id,orderAble=false}=segment;
            length = parseInt(length);
            let isProtected = type === "protected";
            let value= text.slice(s,s+length);

            if ( !res.hasOwnProperty(id) ) {
                let seg;
                if (isProtected) {
                    seg = new ProtectedSegment(value,id,parent);
                }else{
                    seg = new Segment(value,id,parent);
                }
                res[id]=seg;
            }
            indexes.push({id});
            s+=length;
        }
    }
    return {
        traceSegments:{
            indexes,
            segments:res,
        }
    };
}
export default class TraceModel{
    constructor(model){
        this.model = model;
        this.indexes=[];
        this.segments={};
    }

    getSegmentById(id){
        return this.segments[id];
    }

    parseModel(){
        let {traces,text} = this.model;
        let {traceSegments} = traces;
        let res =_parseSegments(traceSegments,text);
        this.indexes = res.traceSegments.indexes;
        this.segments = res.traceSegments.segments;
    }

    getSegments(){
        return this.segments;
    }

    getContent(){
        return this.getFlattenIndexes().map( function(elm){
            return this.getSegmentById(elm.id).toString()
        }.bind(this)).join("");
    }

    setIndexes(indexes){
        this.indexes=indexes;
    }

    getIndexes(){
        return this.indexes;
    }

    getFlattenSubIndexes(indexes,withComposites=false){
        let res=[];
        for(let i=0;i<indexes.length;i++){
            let index = indexes[i];
            if (index.children) {
                let sub = this.getFlattenSubIndexes(index.children,withComposites);
                res = res.concat(sub);
                if (withComposites) {
                    res.push(index);
                }
            }else{
                res.push({id:index.id});
            }
        }
        return res;
    }

    getFlattenIndexes(withComposites=false){
        return this.getFlattenSubIndexes(this.indexes,withComposites);
    }

    serializeModel(children){
        let traceSegments = [];
        let indexes = children || this.indexes;
        for(let i=0;i<indexes.length;i++){
            let index = indexes[i];
            let segment = this.segments[index.id];
            if (segment instanceof CompositeSegment) {
                let children = this.serializeModel(index.children);
                traceSegments.push({
                    id:index.id,
                    type: "composite",
                    traceSegments: children.traceSegments
                });
            }else{
                let type = segment instanceof ProtectedSegment ? "protected" : "unprotected";
                traceSegments.push({
                    id:index.id,
                    type: type,
                    length: segment.toString().length
                });
            }
        }
        let model = {
            traces: this.model.traces.traces,
            traceSegments: traceSegments
        };
        return model;
    }
}
