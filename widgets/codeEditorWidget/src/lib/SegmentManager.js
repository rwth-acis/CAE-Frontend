import {EventEmitter} from 'events';
import ProtectedSegment from "./ProtectedSegment";
import CompositeSegment from "./CompositeSegment";
let Range = ace.require('ace/range').Range

class SegmentManager extends EventEmitter{

  constructor(editor){
    super();
    this.editor = editor;
    this.activeSegment;
    this.token =true;
  }

  setActiveSegment(segmentId){
    this.activeSegment = segmentId;
    if(typeof segmentId != "undefined"){
      if (this.isProtected(segmentId)) {
        $(".ace_cursor").addClass("disabled");
      }
      else{
        $(".ace_cursor").removeClass("disabled");
      }
    }
  }

  /**
   *  Get the name of the segment of the given id
   *  @param {string} segmentId - The id of the segment
   */

  getModelName(segmentId){
    return this.traceModel.getModelName(segmentId.toString());
  }

  getTracedSegmentPosition(){
    let segments = this.traceModel.getSegmets();

  }

  getOrderAbleSegments(){
    return this.list.toArray();
  }

  getSegmentsRaw(withComposites){
    let self = this;
    return this.traceModel.getFlattenIndexes(withComposites).map( function(index){
      if(index.children){
        return index;
      }else{
        return self.bindings[index.id];
      }
    } );
  }

  getSegments(){
    let self = this;
    return this.traceModel.getFlattenIndexes().map( function(index){ return {
      id:self.bindings[index.id].id,
      value:self.getSegmentById(index.id)
    } });
  }
  getNavigationString(segId){
    let nav="";
    let segment = this.getSegmentByIdRaw(segId).segment;
    if (segment.getParent()) {
      nav+=this.getNavigationString(segment.getParent())+">";
    }
    nav+=segment.getId();
    return nav;
  }

  getTraceModel(){
    return this.traceModel;
  }

  getSegmentByIdRaw(segmentId){
    let id = segmentId.toString();
    return this.bindings[segmentId];
  }

  getSegmentById(segmentId){
    let binding = this.getSegmentByIdRaw(segmentId);
    return binding && binding.segment && binding.segment.toString();
  }

  getActiveSegment(){
    return this.activeSegment;
  }

  getSegmentPosition(segment, offset){
    let start = offset;
    let end = start + segment.segment.toString().length;
    return {start,end};
  }

  getSegmentDim(segId,withComposites=false){
    let s =0;
    let diff;
    let indexes = this.traceModel.getFlattenIndexes(withComposites);
    for(let indexObj of indexes){
      let index = indexObj.id;
      let binding = this.bindings[index];
      if (binding.id == segId) {
        return {start:s,end:s+binding.segment.toString().length};
      }
      if( !(binding.segment instanceof CompositeSegment) ){
        s+=binding.segment.toString().length;
      }
    }
    return {start:s,end:s};
  }

  getSegmentStartIndex(segId){
    return this.getSegmentDim(segId).start;
  }

  createSegValue(id,value) {
    //ensure that we use a string as the key
    id = id.toString();
    let deferred = $.Deferred();
    let promise = this.map.get(id);
    //if yText for the segment id does not exist, we create it first
    if (promise === undefined) {
      this.map.set(id,Y.Text).then(function(yText){
        //set initial text value
        yText.insert(0,value);
        deferred.resolve(yText);
      }.bind(this));
    }else{
      promise.then( (yText) => { deferred.resolve(yText) });
    }
    return deferred.promise();
  }

  mutualExclusion(callback){
    return function(event){
      if ( this.token) {
        this.token = false;
        try{
          callback.bind(this)(event);
          this.token = true;
        }catch(e){
          console.error(e);
          this.token = true;
        }
        this.emit("change",{});
      }
    }.bind(this)
  }

  rebuildIndex(list,parent){
    let nIndexes=[];
    let topLevelSegments = list.toArray();
    for(let i=0;i<topLevelSegments.length;i++){
      let seg = topLevelSegments[i];
      let children =[];
      if (this.orders[seg]) {
        let sub = this.rebuildIndex(this.orders[seg],seg);
        children = children.concat(sub);
        nIndexes.push({id:seg,children:children});
      }else{
        nIndexes.push({id:seg});
      }

    }
    return nIndexes;
  }

  reorderSegmentsById(fromId,beforeId,parent){
    let list = this.orders[parent];
    let listArray = list.toArray();
    let to = listArray.indexOf(beforeId);
    let from = listArray.indexOf(fromId);
    if( to >-1 && from >-1){
      let targetS = list.get(from);
      list.delete(from);
      list.insert(to,[targetS]);
    }
  }

  reorderSegmentsByPosition(from,to,parent){
    if(from == to){
      //nothing to do
      return;
    }

    let list = this.orders[parent];
    let listArray = list.toArray();
    let orderAbleSegments = [];
    let notOrdered=[];

    //collect all segments that also need to be reordered, e.g. indentions
    for(let i=0;i<listArray.length;i++){
      let sId = listArray[i];
      if(sId.indexOf("htmlElement") > -1){
        orderAbleSegments.push({position:i,not:notOrdered});
        notOrdered=[];
      }else{
        notOrdered.push(i);
      }
    }

    let fromGroup = orderAbleSegments[from];
    let fromIds = fromGroup.not.map( position => list.get(position) );
    fromIds.push( list.get(fromGroup.position) );

    let toGroup = orderAbleSegments[to];
    let toIds = toGroup.not.map( position => list.get(position) );
    toIds.push( list.get( toGroup.position ) );

    let toId = "";
    if( from > to){
      //our destination is the first "to" element
      toId = toIds[0];
    }else{
      //we need to reverse the "from" elements if we sort from top to down
      fromIds = fromIds.reverse();
      //our destination is the last "to" element
      toId = toIds.slice(-1).pop();
    }

    for(let i=0;i<fromIds.length;i++){
      this.reorderSegmentsById(fromIds[i],toId,parent);
    }
    console.log(list.toArray());
    this.emit("orderChange",this.orders,this.indexes);
  }

  swapSegments(target,source){
    let deferred = $.Deferred();
    if (target.parent && target.parent == source.parent) {
      let sI = source.index;
      let tI = target.index;
      let list = this.orders[target.parent]
      let targetS = list.get(tI);
      let sourceS = list.get(sI);
      list.delete(sI);
      list.insert(sI,[targetS]);
      list.delete(tI);
      list.insert(tI,[sourceS]);
    }
    deferred.resolve();
    return deferred.promise();
  }


  reordered(indexes){
    this.token=false;
    this.traceModel.setIndexes(indexes);
    let self = this,
    content = this.traceModel.getContent();
    this.editor.setValue( content ,1 );
    this.emit("change",{}, content );
    this.token=true;
  }

  buildOrders(indexes,segments){
    for(let i=0;i<indexes.length;i++){
      let index = indexes[i];
      let seg = segments[index.id];
      if (index.children) {
        this.buildOrders(index.children,segments);
      }
      if (seg.getParent()) {
        this.orders[seg.getParent()].push([index.id]);
      }else{
        this.list.push([index.id]);
      }
    }
  }

  initOrders(orders){
    for(let order of orders){
      this.orders[order.id] = order.list;
    }
    console.log(this.orders);
  }

  bindOrders(orders){
    let self = this;
    for(let order of orders){
      order.list.observe(function(){
        try{
          let indexes = self.rebuildIndex(self.list);
          self.reordered(indexes);
          self.emit("orderChange",self.orders,self.indexes);
        }catch(e){
          console.error(e);
        }
      });
    }
  }

  bindYTextSegment(segment,yText){
    let self = this;
    let aceDocument = this.editor.getSession().getDocument();
    yText.observe(function(events){
      //ignore empty events
      if(events && events.length){
        self.mutualExclusion(function(elm){
          let segStart = self.getSegmentStartIndex(segment.getId());
          for(let i=0;i<elm.length;i++){
            let event = elm[i];
            if (event.type === 'insert') {
              let start = aceDocument.indexToPosition(event.index + segStart, 0);
              aceDocument.insert(start, event.value);
            } else if (event.type === 'delete') {
              let start = aceDocument.indexToPosition(event.index + segStart, 0);
              let end = aceDocument.indexToPosition(event.index  + segStart + event.length, 0);
              let range = new Range(start.row, start.column, end.row, end.column);
              aceDocument.remove(range);
            }
          }
          segment.setValue(yText.toString());
        })(events);
      }
    });
  }

  emitLoadingUpdate(status,total){
    this.emit("loading",{status,total});
  }

  disableBindings(){
    this.token = false;
  }

  enableBindings(){
    this.token = true;
  }

  bindSegments(traceModel,ySegmentMap,ySegmentArray,reordered,orders){

    this.disableBindings();

    this.list = ySegmentArray;
    this.map = ySegmentMap;
    this.orders = {};
    this.traceModel = traceModel;

    let segments = this.traceModel.getSegments(),
    indexes = this.traceModel.getIndexes(),

    flattenIndexes = this.traceModel.getFlattenIndexes(),
    flattenWithComposites = this.traceModel.getFlattenIndexes(true),
    synchedSegs = {},
    count = 0,
    self = this,
    deferred = $.Deferred();

    this.initOrders(orders);

    if (reordered) {
      this.buildOrders(indexes,segments);
    }

    function finish(){
      count++;
      if (count === flattenWithComposites.length) {
        self.setSegments(synchedSegs,indexes);
        self.editor.setValue(flattenIndexes.map( elm => synchedSegs[elm.id].segment.toString() ).join(""),1 );
        self.bindOrders(orders);

        self.emitLoadingUpdate(count,flattenWithComposites.length);

        //(re-)activate the bindings
        self.enableBindings();

        //fire order changed event
        self.emit("orderChange",self.orders,self.indexes);

        //finally resolve the promise
        deferred.resolve();
      }
    }

    for(let i=0;i<flattenWithComposites.length;i++){
      let index = flattenWithComposites[i].id;
      let segment = segments[index];
      //distinguish between composites and text segments
      if ( segment instanceof CompositeSegment ) {
        synchedSegs[index]={id:index,segment:segment};
        finish();
      }else{
        if (!(segment instanceof ProtectedSegment)) {
          //create yText for segment if it does not already exists
          this.createSegValue(index,segment.toString()).then(function(yText){
            let length  = yText.toString().length;
            synchedSegs[index]={id:index,yText,segment:segment};
            segment.setValue(yText.toString());
            //bind yText to Segment
            self.bindYTextSegment(segment,yText);
            finish();
          });
        }else{
          //segment is protected
          //we use a "isProtected" property as it is faster than "instanceof ProtectedSegment"
          synchedSegs[index]={id:index,segment:segment,isProtected:1};
          finish();
        }
      }
    }

    return deferred.promise();
  }


  setSegments(bindings,indexes){
    this.indexes = indexes;
    this.bindings = bindings;
  }

  editorChangeHandler(e){
    if (this.getActiveSegment()) {
      this.mutualExclusion(function(e){
        let aceDoc = this.editor.getSession().getDocument();
        let {lines,start,end,action} = e;
        let sIndex = aceDoc.positionToIndex(start,0);
        let segStart = this.getSegmentStartIndex(this.getActiveSegment());
        let relSegStart = Math.max(sIndex-segStart,0);
        let {yText,segment} = this.getSegmentByIdRaw(this.getActiveSegment().toString());
        if (yText) {
          if (action === 'insert') {
            yText.insert(relSegStart, lines.join('\n'));
          } else if (action === 'remove') {
            if (relSegStart >= 0) {
              let length = lines.join('\n').length
              yText.delete(relSegStart, length)
            }
          }

          if (!(segment instanceof ProtectedSegment)) {
            segment.setValue(yText.toString());
            this.emit("saveEvent",this.getActiveSegment());
          }
        }

      } ).bind(this)(e);
    }
  }

  findPreviousSegment(posIndex,segmentId){
    let res = undefined;
    let s =0;
    let {start,end} = this.getSegmentDim(segmentId);
    if (start === posIndex) {
      let indexes = this.traceModel.getFlattenIndexes();
      for(let indexObj of indexes){
        let index = indexObj.id;
        let binding = this.bindings[index];
        let pos = this.getSegmentPosition(binding,s);
        if (pos.end <= start && binding.id != segmentId) {
          res = binding.id;
        }
        s+=binding.segment.toString().length;
      }
    }
    return res;
  }

  findNextSegment(posIndex,segmentId){
    let s =0;
    let {start,end} = this.getSegmentDim(segmentId);
    if (end === posIndex) {
      let indexes = this.traceModel.getFlattenIndexes();
      for(let indexObj of indexes){
        let index = indexObj.id;
        let binding = this.bindings[index];
        let pos = this.getSegmentPosition(binding,s);
        if (pos.start >= end && binding.id != segmentId) {
          return binding.id;
        }
        s+=binding.segment.toString().length;
      }
    }
    return undefined;
  }

  findNearestSegment(posIndex,offset=0){
    let s =0;
    let _nearest;
    let diff;
    let indexes = this.traceModel.getFlattenIndexes();
    for(let indexObj of indexes){
      let index = indexObj.id;
      let binding = this.bindings[index];
      let {start,end} = this.getSegmentPosition(binding,s);
      if (start<= posIndex && posIndex - offset < end) {
        if (!diff || (posIndex-start)-offset < diff ) {
          diff = (posIndex-start);
          _nearest = binding.id;
        }
      }
      s+=binding.segment.toString().length;
    }
    return _nearest;
  }

  findSegment(posIndex,offset=0){
    let s =0;
    let diff;
    let indexes = this.traceModel.getFlattenIndexes();
    for(let indexObj of indexes){
      let index = indexObj.id;
      let binding = this.bindings[index];
      let {start,end} = this.getSegmentPosition(binding,s);
      if (start<= posIndex && posIndex - offset < end) {
        return binding.id;
      }
      s+=binding.segment.toString().length;
    }
    return undefined;
  }

  /**
   *  Determine whether the segment of the given id is protected or not
   *  @param {string} segmentId - The id of the segment
   */

  isProtected(segmentId){
    let binding = this.getSegmentByIdRaw(segmentId);
    return  binding && binding.isProtected;
  }

  addSaveListener(listener){
    this.on("saveEvent",listener);
  }

  removeChangeListener(listener){
    this.removeListener("saveEvent",listener);
  }

  addChangeListener(listener){
    this.on("change" , listener);
  }

  removeChangeListener(listener){
    this.removeListener("change", listener);
  }

  addLoadingListener(listener){
    this.on("loading" , listener);
  }

  removeLoadingListener(listener){
    this.removeListener("loading", listener);
  }

  addOrderChangeListener(listener){
    this.on("orderChange" , listener);
  }

  removeOrderChangeListener(listener){
    this.removeListener("orderChange", listener);
  }

}

export default SegmentManager;
