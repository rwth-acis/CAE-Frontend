import {delayed,debounce,getParticipantColor} from "./Utils";
let Range = ace.require('ace/range').Range
let maxUser = 10;

class TraceHighlighter{

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

  remoteCursorChangeHandler(name){
    try{
      if (name != this.workspace.getUserId()) {
        //create a new cursor if it does not yet exists
        if (typeof this.cursorMarkers[name] === "undefined") {
          this.cursorMarkers[name]={
            id:this.userCount,
            marker:undefined,
            hide:debounce(this.hideUserName.bind(this),5000,true)
          }
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

  setActiveSegment(segmentId){
    this.segmentManager.setActiveSegment(segmentId);
  }

  updateCursor(){
    this.setCursor(this.getCursorIndex());
  }

  setCursor(cursorPosIndex){
    this.workspace.setCursor(cursorPosIndex);
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
    try{
      let id = `u${this.cursorMarkers[usr].id}`;
      let self = this;
      let cursor = $(`div#${id}`);
      if(cursor.size() <= 0){
        this.cursorMarkers[usr].hidden = true;
        this.renderCursor(usr);
      }
      $(`div#${id}`).fadeOut(400,function(){
        self.cursorMarkers[usr].hidden = true;
      });
    }catch(e){

    }
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

  clearCursorMarkers(){
    for(let usr in this.cursorMarkers){
      let cursor = this.cursorMarkers[usr];
      if(cursor){
        this.editor.getSession().removeMarker(cursor.marker);
        delete this.cursorMarkers[usr].marker;
      }
    }
  }

  renderCursors(){
    let users = this.workspace.getParticipants().filter( (user) => {
      return user.fileName == this.workspace.getCurrentFile();
    });
    for(let user of users){
      this.remoteCursorChangeHandler(user.id.toString());
    }
  }

  renderCursor(usr){
    let index = this.workspace.getRemoteCursor(usr);
    let cursor = this.cursorMarkers[usr];
    let userName = this.workspace.getUserNameByJabberId(usr);
    let aceDoc = this.editor.getSession().getDocument();
    let start = aceDoc.indexToPosition(index,0);
    if (typeof cursor != "undefined") {
      this.editor.getSession().removeMarker(cursor.marker);
      delete this.cursorMarkers[usr].marker;
    }
    if( index > -1 ){
      let color = getParticipantColor( this.workspace.getUserByJabberId(usr).count );
      let id = `u${this.cursorMarkers[usr].id}`;
      this.cursorMarkers[usr].marker=this.editor.session.addMarker(new Range(start.row,start.column,start.row,start.column+1), "moveable", function(html,range,left,top,config){
        html.push(`<div style="top:${top};left:${left};height:${config.lineHeight};background-color:${color.bg};color:${color.fg}" class="remoteCursor"></div>`);
        let width = userName.length * config.characterWidth;
        let leftName = left;
        let display = !cursor.hidden ? "block" : "none";
        leftName = Math.max(0,leftName-width+4);
        html.push(`<div id="${id}" style="display:${display};top:${top+config.lineHeight};left:${leftName};width:${width};height:${config.lineHeight};background-color:${color.bg};color:${color.fg}" class="remoteCursor username">${userName}</div>`);
      },true);
      this.cursorMarkers[usr].hide(usr);
    }
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
export default TraceHighlighter;