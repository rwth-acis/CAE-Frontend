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

/**
*  Class representing the trace model of a file. Furthermore, the class
*  parses the given model and divides the file into its segments.
*/

export default class TraceModel{

  /**
  *  @param {Object} model                       - The model that should be used
  *  @param {string} model.text                  - The file content
  *  @param {Object} model.traces                - The traces of the file
  *  @param {Object} model.traces.traceSegments  - The traceable segments of the file
  */

  constructor(model){
    this.model = model;
    this.indexes=[];
    this.segments={};
    this.traces = {};
  }

  /**
  *  Returns the segment with the given id
  *  @param {string} id  - The id of the segment
  */

  getSegmentById(id){
    return this.segments[id];
  }

  /**
  * Returns the id of the code generation
  */

  getGenerationId(){
    return this.model.traces.generatedID;
  }

  /**
  *  Parses the model
  */

  parseModel(){
    let {traces : traceModel,text} = this.model;
    let {traceSegments, traces} = traceModel;
    let res =_parseSegments(traceSegments,text);
    this.indexes = res.traceSegments.indexes;
    this.segments = res.traceSegments.segments;
    this.traces = traces;
    console.log(this.traces);
  }

  /**
  *  Returns the model name of a segment used for the commit message
  *  @param {string} segmentId - The segment id
  */

  getModelName(segmentId){
    return this.getModelNameRecursive(segmentId) || `Untraced Segment[${segmentId}]`;
  }

  getModelNameRecursive(segmentId){
    let segment = this.segments[segmentId];
    if(segment){
      let modelName = false;

      for(let modelId in this.traces){
        if(this.traces.hasOwnProperty(modelId)){
          let model = this.traces[modelId];
          let segments = model.segments.filter( segment => segment == segmentId);
          if(segments && segments.length > 0){
            modelName = model.name;
            break;
          }
        }
      }

      if(modelName){
        return modelName;
      }
      else if( segment.getParent() ){
        return this.getModelName2(segment.getParent());
      }else{
        return false;
      }
    }else{
      return false;
    }
  }

  /*
  *  Returns all segments
  */

  getSegments(){
    return this.segments;
  }

  /*
  *  Returns the content of the file holded by the trace model
  */

  getContent(){
    return this.getFlattenIndexes().map( function(elm){
      return this.getSegmentById(elm.id).toString()
    }.bind(this)).join("");
  }

  /*
  *  Sets new indexes, i.e. new order of the segments
  *  @param {Object[]} indexes - The new indexes
  */

  setIndexes(indexes){
    this.indexes=indexes;
  }

  /*
  *  Returns the current indexes
  */

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

  /*
  *  Returns the flatten indexes
  *  @param [boolean]  withComposites  - Determine if the indexes of composites segments should also be included
  */

  getFlattenIndexes(withComposites=false){
    return this.getFlattenSubIndexes(this.indexes,withComposites);
  }

  /**
  *  Serialize a given subset of the segments to JSON
  *  @param {Object[]} children              - The ids of the segments that should be serializeModel
  *  @param {string}   children[].id         - The id of the segment
  *  @param {Object[]} [children[].children] - The list of sub segments of composite segment
  */

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
