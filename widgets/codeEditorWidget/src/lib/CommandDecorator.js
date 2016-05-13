import SegmentManager from "./SegmentManager";
import {delayed} from "./Utils";

export default class CommandDecorator{

  constructor(editor,segmentManager,traceHighlighter){
    this.traceHighlighter = traceHighlighter;
    this.editor = editor;
    this.segmentManager = segmentManager;
    this.undos=[];
    this.redos=[];
  }

  isDeleteCommand(cmdName){
    return !!~["del","backspace"].indexOf(cmdName);
  }
  isNavigationCommand(cmdName){
    return !!~["gotoleft","gotoright","golineup","golinedown"].indexOf(cmdName);
  }
  isAllowedCommand(cmdName){
    return this.isDeleteCommand(cmdName) || !!~["insertstring","selectleft","selectright","selectdown","selectup","selectlineend","selectlinestart","copy","paste","indent"].indexOf(cmdName);
  }

  getActiveSegment(){
    return this.traceHighlighter.getActiveSegment();
  }

  setActiveSegment(segment){
    this.traceHighlighter.setActiveSegment(segment);
  }

  getCursorIndex(){
    return this.traceHighlighter.getCursorIndex();
  }

  getLastUndo(){
    return this.undos.pop();
  }

  addUndo(undo){
    this.undos.push(undos);
  }

  getLastRedo(){
    return this.redos.pop();
  }

  addRedo(redo){
    this.redos.push(redo);
  }

  render(){
    this.traceHighlighter.updateSegments();
  }

  renderActiveSegment(){
    let self = this;
    delayed.bind(this)(function(){
      self.traceHighlighter.renderActiveSegment();
    },20,false);
  }

  goToRightDecorator(){
    let aceDoc = this.editor.getSession().getDocument();
    let curPosIndex = this.getCursorIndex();
    let curSegment = this.getActiveSegment();

    let nextPosIndex = Math.min(curPosIndex,this.editor.getSession().getValue().length);
    let nextSegment = this.segmentManager.findNextSegment(nextPosIndex,curSegment);

    if ( (nextSegment && curSegment !== nextSegment) ) {
      this.setActiveSegment(nextSegment);
      return true;
    }
  }

  goToLeftDecorator(){
    let aceDoc = this.editor.getSession().getDocument();
    let curPosIndex = this.getCursorIndex();
    let curSegment = this.getActiveSegment();

    let nextPosIndex = Math.max(curPosIndex,0);
    let nextSegment = this.segmentManager.findPreviousSegment(nextPosIndex,curSegment);

    if ( (nextSegment && curSegment !== nextSegment) ) {
      this.setActiveSegment(nextSegment);
      return true;
    }
  }

  goLineUpOrDown(e){
    let res = e.command.exec(e.editor, e.args || {});
    let curPosIndex = this.getCursorIndex();
    let nextSegment = this.segmentManager.findSegment(curPosIndex,0);
    this.setActiveSegment(nextSegment);
    return true;
  }

  delDecorator(e){
    let curPosIndex = this.getCursorIndex();
    let dim = this.segmentManager.getSegmentDim(this.getActiveSegment());

    if (this.isSelectionOutOfDim(dim)) {
      return true;
    }else if (curPosIndex >= dim.end) {
      return true;
    }
  }

  backspaceDecorator(e){

    let curPosIndex = this.getCursorIndex();
    let dim = this.segmentManager.getSegmentDim(this.getActiveSegment());
    let relSegStart = Math.max( curPosIndex-dim.start,0);
    let selection = this.editor.selection;

    if (this.isSelectionOutOfDim(dim)) {
      return true;
    }else if (selection.isEmpty() && relSegStart <= 0) {
      console.log("not alowed");
      return true;
    }
  }

  pasteDecorator(e){
    let curPosIndex = this.getCursorIndex();
    let dim = this.segmentManager.getSegmentDim(this.getActiveSegment());

    if (this.isSelectionOutOfDim(dim)) {
      return true;
    }else{
      return false;
    }
  }

  isSelectionOutOfDim(dim){
    let aceDoc = this.editor.getSession().getDocument();
    let selection = this.editor.selection;

    if (!selection.isEmpty()) {
      let {start,end} = dim;
      let range = selection.getRange();
      let startP = range.start;
      let endP =range.end;
      let startIndex = aceDoc.positionToIndex(startP,0);
      let endIndex = aceDoc.positionToIndex(endP,0);
      console.log(startIndex < start);
      console.log(endIndex > end);
      if (startIndex < start || endIndex > end) {
        return true;
      }
    }else{
      return false;
    }
  }

  executeNavigationCommand(cmdName,e){
    switch (cmdName) {
      case "gotoleft":
      return this.goToLeftDecorator(e);
      break;
      case "gotoright":
      return this.goToRightDecorator(e);
      break;
      case "golinedown":
      return this.goLineUpOrDown(e);
      break;
      case "golineup":
      return this.goLineUpOrDown(e);
      break;
    }
  }

  executeDeleteCommand(cmdName,e){
    switch (cmdName) {
      case "del":
      return this.delDecorator(e);
      break;
      case "backspace":
      return this.backspaceDecorator(e);
      break;
    }
  }

  insertDecorator(e){
    let text = e.args || "";
    if(this.pasteDecorator(e)){
      return true;
    }else{
      //avoid deleting starting spaces when new lines are added
      //that can result in changes of following blocks, e.g protected blocks
      //there is no other solution to disable this behaviour in the ace editor
      //TODO: this may be reduced to the cases where the insertion is performed at the end of a unprotected block
      if(text == "\n" || text == "\r\n"){
        text = " "+text;
      }
      e.command.exec(e.editor, text );
      return true;
    }
  }

  executeOtherCommand(cmdName,e){
    switch(cmdName){
      case "paste":
      case "indent":
      return this.pasteDecorator(e);
      case "insertstring":
      return this.insertDecorator(e);
      break;
    }

    return false;
  }

  commandHandler(e){
    let cmdName = e.command.name;
    let activeSegment = this.getActiveSegment();

    if (this.isNavigationCommand(cmdName)) {
      let handlerRes = this.executeNavigationCommand(cmdName,e);
      if (handlerRes) {
        this.renderActiveSegment();
        return true;
      }
      let res = e.command.exec(e.editor, e.args || {});
      this.renderActiveSegment();
      return res;
    }

    if ( this.isDeleteCommand(cmdName)  ) {
      console.log("isDeleteCommand");
      if (typeof activeSegment != "undefined") {
        if(this.segmentManager.isProtected(activeSegment)) {
          return true;
        }else if (this.executeDeleteCommand(cmdName,e) ){
          return true;
        }
      }else{
        return true;
      }
    }
    //without an acitveSegment we cant insert any strings
    if (typeof activeSegment === "undefined" ){
      if(cmdName === "insertstring" ) {
        return true;
      }
    }else{
      if(this.segmentManager.isProtected(activeSegment)) {
        return true;
      }
    }
    //if we dont have handled the command yet, we will now do it
    console.log(cmdName);
    if(this.isAllowedCommand(cmdName)){
      if( this.executeOtherCommand(cmdName,e) ){
        return true;
      }else{
        console.log("execute " + cmdName);
        let res = e.command.exec(e.editor, e.args || {});
        return res;
      }
    }else{
      return true;
    }
  }

}
