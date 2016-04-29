import {delayed,debounce} from "./Utils";
let Range = ace.require('ace/range').Range
let maxUser = 10;

export default class{

  constructor(editor,segmentManager,workspace){
    this.segmentManager=segmentManager;
    this.editor = editor;
    this.workspace = workspace;
    this.workspace.addCursorChangeListener(this.remoteCursorChangeHandler.bind(this));
    this.timer = false;
    this.activeMarker = false;
    this.markers = [];
    this.cursorMarkers={};
    this.userCount=1;
  }

  //originally taken from http://blog.adamcole.ca/2011/11/simple-javascript-rainbow-color.html
  rainbow(step) {
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 2011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    var r, g, b;
    var h = step / maxUser;
    var i = ~~(h * 6);
    var f = h * 6 - i;
    var q = 1 - f;
    switch(i % 6){
      case 0: r = 1; g = f; b = 0; break;
      case 1: r = q; g = 1; b = 0; break;
      case 2: r = 0; g = 1; b = f; break;
      case 3: r = 0; g = q; b = 1; break;
      case 4: r = f; g = 0; b = 1; break;
      case 5: r = 1; g = 0; b = q; break;
    }
    var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
    return (c);
  }

  remoteCursorChangeHandler(name){
    try{
      if (name != this.workspace.getUserId()) {
        if (typeof this.cursorMarkers[name] === "undefined") {
          this.cursorMarkers[name]={id:this.userCount,marker:undefined,color:this.rainbow(this.userCount++),hide:debounce(this.hideUserName.bind(this),5000,true)}
        }
        this.cursorMarkers[name].hidden = false;
        this.renderCursor(name);
      }

    }catch(e){
      console.error(e);
    }
  }
  addMarker(start, end, klaaz, front){
    this.markers.push( this.editor.getSession().addMarker(new Range(start.row, start.column,end.row, end.column), klaaz, "text", front ) );
  }

  clearMarkers(){
    while(this.markers.length > 0){
      this.editor.session.removeMarker(this.markers.shift());
    }
  }

  getActiveSegment(){
    return this.segmentManager.getActiveSegment();
  }

  setActiveSegment(segment){
    let string = "";
    this.segmentManager.setActiveSegment(segment);
    if (segment) {
      string = this.segmentManager.getNavigationString(segment);
    }
    $("#footbar").html(string);
  }

  updateCursor(){
    this.setCursor(this.getCursorIndex());
  }
  setCursor(cursorPosIndex,segment){
    this.workspace.setCursor(this.workspace.getUserId(),cursorPosIndex);
  }

  getCursorIndex(){
    let aceDoc = this.editor.getSession().getDocument();
    return aceDoc.positionToIndex(this.editor.getCursorPosition(),0);
  }

  updateActiveSegment(){
    let aceDoc = this.editor.getSession().getDocument();
    let curPosIndex = this.getCursorIndex();
    let segment = this.segmentManager.findNearestSegment(curPosIndex);
    this.setActiveSegment(segment);
    if (typeof segment != "undefined") {
      this.renderActiveSegment();
    }
  }

  updateSegments(){
    let self = this;
    delayed.bind(this)(function(){
      self.render();
    },50,false);
  }

  hideUserName(usr){
    let id = `u${this.cursorMarkers[usr].id}`;
    let self = this;
    $(`div#${id}`).fadeOut(400,function(){
      self.cursorMarkers[usr].hidden = true;
    });
  }

  render(){
    this.renderSegments();
  }

  renderActiveSegment(){
    if (this.activeMarker) {
      this.editor.getSession().removeMarker(this.activeMarker);
    }
    let activeSegment = this.getActiveSegment();
    if (activeSegment && !this.segmentManager.isProtected(activeSegment) ) {
      let aceDoc = this.editor.getSession().getDocument();
      let s =this.segmentManager.getSegmentStartIndex(activeSegment);
      let str = this.segmentManager.getSegmentById(activeSegment);

      let start_ = aceDoc.indexToPosition(s,0);
      let end_ = aceDoc.indexToPosition(s+str.length,0);
      let className="activeTrace";

      this.activeMarker = this.editor.getSession().addMarker(new Range(start_.row, start_.column,end_.row, end_.column), className);
    }
  }

  renderCursor(usr){
    console.log("renderCursor",usr);
    let index = this.workspace.getCursor(usr);
    let cursor = this.cursorMarkers[usr];

    let userName = this.workspace.getUserNameByJabberId(usr);
    let aceDoc = this.editor.getSession().getDocument();
    let start = aceDoc.indexToPosition(index,0);
    if (typeof cursor != "undefined") {
      this.editor.getSession().removeMarker(cursor.marker);
      delete this.cursorMarkers[usr].marker;
    }
    let color = cursor.color;
    let id = `u${this.cursorMarkers[usr].id}`;
    this.cursorMarkers[usr].marker=this.editor.session.addMarker(new Range(start.row,start.column,start.row,start.column+1), "moveable", function(html,range,left,top,config){
      html.push(`<div style="top:${top};left:${left};height:${config.lineHeight};background-color:${color}" class="remoteCursor"></div>`);
      let width = userName.length * config.characterWidth;
      let leftName = left;
      let display = !cursor.hidden ? "block" : "none";
      leftName = Math.max(0,leftName-width+4);
      html.push(`<div id="${id}" style="display:${display};top:${top+config.lineHeight};left:${leftName};width:${width};height:${config.lineHeight};background-color:${color}" class="remoteCursor username">${userName}</div>`);
    },true);
    this.cursorMarkers[usr].hide(usr);
  }


  renderSegments(){
    let segs = this.segmentManager.getSegmentsRaw(true);
    let activeSegment = this.getActiveSegment();
    let s = 0;
    let aceDoc = this.editor.getSession().getDocument();
    this.clearMarkers();
    if (this.activeMarker) {
      this.editor.session.removeMarker(this.activeMarker);
    }
    for(let seg of segs){
      if (seg.segment) {
        let str = seg.segment.toString();
        let id = seg.id;
        let start_ = aceDoc.indexToPosition(s,0);
        let end_ = aceDoc.indexToPosition(s+str.length,0);
        let className = "ace_highlight-trace";

        if (id === activeSegment && !this.segmentManager.isProtected(id) ) {
          if (this.activeMarker) {
            this.editor.getSession().removeMarker(this.activeMarker);
          }
          this.activeMarker = this.editor.session.addMarker(new Range(start_.row, start_.column,end_.row, end_.column), "activeTrace");
        }else{

          if (this.segmentManager.isProtected(id) ) {
            this.markers.push( this.editor.session.addMarker(new Range(start_.row, start_.column,end_.row, end_.column), className) );
          }

        }
        s+=str.length;
      }
    }

  }
}
