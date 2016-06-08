import SegmentManager from "./SegmentManager";
import {delayed} from "./Utils";

/**
* This class is responsible to decorate all ace editor commands in such a way it respect unprotected/protected segment.
* Additionaly, a whitelist is used to explicitly define allowed commands.
*/

class CommandDecorator{

  /**
  * Creates a new CommandDecorator instance
  * @param {object} editor - An ace editor instance
  * @param {SegmentManager} segmentManager - An manager that is responsible for the segments
  * @param {TraceHighlighter} traceHighlighter - An instance that hightlights the traces/segments
  */

  constructor(editor,segmentManager,traceHighlighter){
    this.traceHighlighter = traceHighlighter;
    this.editor = editor;
    this.segmentManager = segmentManager;
  }

  /**
  * Check if a command is a deletion command
  * @param  {string}  cmdName  - The name of the command
  * @return {boolean}          - True, if the command is a deletion command. Otherwise, false
  */
  isDeleteCommand(cmdName){
    return !!~["del","backspace"].indexOf(cmdName);
  }

  /**
  * Check if a command is a navigation command, i.e. the cursor is moved
  * @param {string} cmdName  - The name of the command
  * @return {boolean}         - True, if the command is a deletion command. Otherwise, false
  */

  isNavigationCommand(cmdName){
    return !!~["gotoleft","gotoright","golineup","golinedown"].indexOf(cmdName);
  }

  /**
  * Check if a command is allowed
  * @param {string}  cmdName - The name of the command
  * @return {boolean}        - True, if the command is whitelisted and therefore allowed;
  */

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

  render(){
    this.traceHighlighter.updateSegments();
  }

  renderActiveSegment(){
    let self = this;
    delayed.bind(this)(function(){
      self.traceHighlighter.renderActiveSegment();
    },20,false);
  }

  /**
  *	Decorator for the goToRight command
  *	@return {boolean}  - True, if the decorator has performed its action
  */

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

  /**
  * Decorator for the goToLeft command
  * @return {boolean}  - True, if the decorator has performed its action
  */

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

  /**
  * Decorator for the goLineUp or goLineDown command
  * @param {object} e  - The event object of the ace editor
  * @return {boolean}  - True, if the decorator has performed its action
  */

  goLineUpOrDown(e){
    let res = e.command.exec(e.editor, e.args || {});
    let curPosIndex = this.getCursorIndex();
    let nextSegment = this.segmentManager.findSegment(curPosIndex,0);
    this.setActiveSegment(nextSegment);
    return true;
  }

  /**
  * Decorator for the deletion command
  * @param {object} e  - The event object of the ace editor
  * @return {boolean}  - True, if the decorator has performed its action
  */

  delDecorator(e){
    let curPosIndex = this.getCursorIndex();
    let dim = this.segmentManager.getSegmentDim(this.getActiveSegment());

    if (this.isSelectionOutOfDim(dim)) {
      return true;
    }else if (curPosIndex >= dim.end) {
      return true;
    }
  }

  /**
  * Decorator for the backspace command
  * @param {object} e  - The event object of the ace editor
  * @return {boolean}  - True, if the decorator has performed its action
  */

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

  /**
  * Decorator for the paste command. In fact, this decorator only checks if we are allowed to paste content, i.e. the current selection is not out of bounds of the
  * active segment
  * @param {object} e  - The event object of the ace editor
  * @return {boolean}  - True, if the decorator has performed its action
  */

  pasteDecorator(e){
    let curPosIndex = this.getCursorIndex();
    let dim = this.segmentManager.getSegmentDim(this.getActiveSegment());

    if (this.isSelectionOutOfDim(dim)) {
      return true;
    }else{
      return false;
    }
  }

  /**
  * Determines if the current selection of the ace editor is out of the bounds of a given dimension of a segment
  * @param {object} dim  - The dimension of a segment
  * @param {number} dim.start  - The start position of the segment
  * @param {number} dim.end    - The end position of the segment
  * @return {boolean}          - True, if the curren selection is out of the bounds of the dimension. Otherwise, false
  */

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
      if (startIndex < start || endIndex > end) {
        return true;
      }
    }else{
      return false;
    }
  }

  /**
  * Decorator for navigation commands
  * @param {string} cmdName  - The name of the command
  * @param {object} e        - The event object of the ace editor
  * @return {boolean}        - True, if any navigation decorator has performed its action
  */

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

  /**
  * Decorator for deletion commands
  * @param {string} cmdName  - The name of the command
  * @param {object} e        - The event object of the ace editor
  * @return {boolean}        - True, if any deletion decorator has performed its action
  */

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

  /**
  * Decorator for insert command. Needed to avoid error prone behaviour for the code editor
  * @param {object} e        - The event object of the ace editor
  * @return {boolean}        - True, if the decorator has performed its action or the current selection is out of bounds.
  */

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

  /**
  * Handle other allowed commands
  * @param {string} cmdName  - The name of the command
  * @param {object} e        - The event object of the ace editor
  * @return {boolean}        - True, if a decorator has performed its action.
  */

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

  /**
  * The main command handler. Delegate the given event object of the ace editor to its corresponding decorator
  * @param {object} e        - The event object of the ace editor
  * @return {boolean}        - True, if a decorator has performed its action and the event should not be further executed. Otherwise, false.
  */

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
export default CommandDecorator;