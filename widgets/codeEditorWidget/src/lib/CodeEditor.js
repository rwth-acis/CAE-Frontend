import SegmentManager from "./SegmentManager";
import HtmlTree from "./HtmlTree";
import TraceHighlighter from "./TraceHighlighter";
import CommandDecorator from "./CommandDecorator";
import Workspace from "./workspace";
import ContentProvider from "./ContentProvider";
import Path from "path";
import {getParticipantColor} from "./Utils";
import SideBar from "./SideBar";
import FileList from "./FileList";

let Range = ace.require('ace/range').Range

/**
*  The main class of the editor. An abstraction of the ace editor that also supports unprotected & protected segments and synchronizes them with the source code
*/

export default class CodeEditor{

  /**
  *  Creates a new instance of the editor. It creates the needed data structures and binds all GUI elements to its
  *  needed callbacks.
  *  @param {string} editorId  - The id of an element in which the ace editor should be mounted
  */

  constructor(editorId){
    //create needed data structures
    this.contentProvider = new ContentProvider();
    this.workspace = new Workspace( this.contentProvider ,this);
    this.editor = this.createAceEditor(editorId);
    this.segmentManager = this.createSegmentManager();
    this.traceHighlighter = new TraceHighlighter(this.editor, this.segmentManager, this.workspace);
    this.commandDecorator = new CommandDecorator(this.editor, this.segmentManager, this.traceHighlighter);

    this.htmlTree = new HtmlTree();
    this.sideBar = new SideBar(this.htmlTree);
    this.fileList = new FileList(this);

    //binding functions
    this.workspaceHandler = this.workspaceHandler.bind(this);
    this.orderChangeListener = this.orderChangeListener.bind(this);
    this.resizeHandler = this.resizeHandler.bind(this);
    this.feedback = this.feedback.bind(this);

    this.contentProvider.addEventListener( this.feedback );

    this.segmentManager.addChangeListener( (e) => {
      this.traceHighlighter.updateSegments(e);
    } );

    this.segmentManager.addOrderChangeListener( this.orderChangeListener );

    this.bindGui();
  }

  /**
  *  The resize handler called when a window resize event is emitted. Updates the height of the div containing
  *  the mount point of the code editor and the height of the ace editor.
  */

  resizeHandler(){
    let guidanceTableHeight = $("#guidanceTablePanel").is(":visible") ? $("#guidanceTablePanel").height() : 0;
    let height = $(window).height()-$("header:eq(0)").height() - guidanceTableHeight - 20;
    $('.editor, #editor').height(height);
    this.sideBar.height(height);
    this.editor.resize();
  }

  orderChangeListener(data,indexes){
    let htmlElements = Object.keys(data)
    .filter( (key) => key.indexOf("$Main_Content$") > -1 )
    .map( (key) => {
      let res = data[key].toArray()
      .filter( id => id.indexOf("htmlElement") >-1 )
      .map( id => {
        return {
          id,
          parent:key,
          text: this.segmentManager.getModelName(id)
        }
      } );

      //always add a parent element
      res.unshift({
        id : key,
        parent : "#",
        text: "HTMLElemente",
        state:{
          opened : true
        }
      })
      return res;
    } );

    this.htmlTree.updateTree( htmlElements && htmlElements.length > 0 && htmlElements[0] || [] );
  }

  /**
  *  The drag and drop handler for the html tree/jstree. Reorders the affected segments in the segment manager and stores the changes.
  *
  *  @param {event}  e                 - The event object emitted by jstree after reordering
  *  @param {object} data              - A data object containing the reordered node and its old and new position after the reordering
  *  @param {number} data.old_position - The old position before the reordering
  *  @param {number} data.position     - The new position after the reordering
  *  @param {string} data.parent       - The id of the parent of the reordered node
  */

  reorderSegmentDNDHandler(e,data){
    let {old_position:from, position:to, parent} = data;
    let modelName = this.segmentManager.getModelName(data.node.id);
    this.segmentManager.reorderSegmentsByPosition(from,to,parent);
    this.workspace.saveFile(this.segmentManager.getTraceModel(), `Reordered ${modelName} from position ${from+1} to ${to+1}` );
  }

  /**
  *	Binds gui elements to their event callbacks
  */

  bindGui(){
    //hide sidebar
    this.hideSideBar();

    //bind ace edtior
    this.bindAceEditor();

    //bind jstree
    this.htmlTree.addChangeListener( (e,data) => {this.reorderSegmentDNDHandler(e,data);} );

    //bind publish button
    $("#publishButton").click( (e) => {

      this.hideGuidances();
      //hide publish button and show spinner loading animation
      $("#publishButton").hide();
      $("#publishSpinner").show();

      //always show the publish button after push request
      this.workspace.push().always( () =>{
        $("#publishButton").show();
        $("#publishSpinner").hide();
      });

      e.preventDefault();
    });


    //bind resize handler
    $(window).resize(this.resizeHandler);
    this.resizeHandler();

  }

  /**
  *	Binds the ace editor instance to the needed listener
  */

  bindAceEditor(){
    let traceHighlighter = this.traceHighlighter;

    this.editor.getSession().selection.on('changeCursor', (e)=>{
      traceHighlighter.updateCursor();
    });

    this.editor.on("change",this.segmentManager.editorChangeHandler.bind(this.segmentManager) );
    this.editor.on("mouseup",() => this.traceHighlighter.updateActiveSegment() );
    this.editor.commands.setDefaultHandler("exec", this.commandDecorator.commandHandler.bind(this.commandDecorator) );
  }

  /**
  *	Hide the sidebar on the right
  */

  hideSideBar(){
    $("#container").removeClass("sidebar-is-visible");
    $(".page-content").removeClass("sidebar-is-visible");
    this.sideBar.hide();
    this.editor.resize();
  }

  /**
  *	Show the sidebar on the right
  */

  showSideBar(){
    $("#container").addClass("sidebar-is-visible");
    $(".page-content").addClass("sidebar-is-visible");
    this.sideBar.show();
    this.editor.resize();
  }

  /**
  *	The feedback callback for the content provider. Shows snackbar notifications of the material design
  *	@param {string} message  - The message to display
  *	@param {object} data     - Additional data, e.g. guidances
  */

  feedback( message ,data){
    console.log(data);
    let snackBar = document.querySelector("#snackbar");
    if(data && data.guidances){
      let snackBarData = {
        message: "Please follow the guidances."
      }
      snackBar.MaterialSnackbar.showSnackbar(snackBarData);
      this.showGuidances(data.guidances);
    }else if(data && data.generationIdConflict){
      this.open(this.workspace.getCurrentFile(), true);
    }else{
      let snackbarData = {message};
      snackBar.MaterialSnackbar.showSnackbar(snackbarData);
    }
  }

  showGuidances(guidances){
    let self = this;
    let rows = guidances.map( guidance => $(`<tr><td>${guidance.message}</td></tr>`).dblclick( function(event){
      $("#guidanceTable tr").removeClass("clicked");
      console.log($(this));
      $(this).addClass("clicked");
    let aceDoc = self.editor.getSession().getDocument();
      for(let seg of guidance.segments){
      let id = seg.segmentId;
      let offset = self.segmentManager.getSegmentStartIndex(id);
      let start_ = aceDoc.indexToPosition(seg.start+offset,0);
      let end_ = aceDoc.indexToPosition(seg.end+offset,0);
      let className = "ace_highlight-guidance";
      let marker = self.editor.session.addMarker(new Range(start_.row, start_.column,end_.row, end_.column), className);
      self.goToSegment(id);
      setTimeout( () => {
        self.editor.session.removeMarker(marker);
      }, 1500);
    }
    }) );
    $("#guidanceTable").html(rows);
    $("#guidanceTablePanel").show();
    this.resizeHandler();
  }

  hideGuidances(){
    $("#guidanceTablePanel").hide();
    this.resizeHandler();
  }

  createSegmentManager(){
    let segmentManager = new SegmentManager(this.editor);
    let self = this;

    //add loading modal
    segmentManager.addLoadingListener(function(opts){
      let {status,total} = opts;
      self.setModalText(`Loading: ${status}/${total}`);
      if (status >= total) {
        self.hideModal();
      }
    });

    segmentManager.addSaveListener(function(segmentId){
      self.workspace.delayedSaveFile(segmentManager.getTraceModel(), segmentManager.getModelName(segmentId,true) );
    });

    return segmentManager;
  }

  createAceEditor(editorId){
    ace.config.set('basePath', 'http://eiche.informatik.rwth-aachen.de/editor/codeEditor/codeEditorWidget/bower_components/ace-builds/src-noconflict');
    let editor = ace.edit(editorId);
    editor.$blockScrolling = Infinity;
    editor.setOptions({enableBasicAutocompletion: false, enableLiveAutocompletion: false});

    //dirty way to disable the built-in undomanager completely
    //we need to build our on as we need to additionally store the affected segments
    editor.getSession().setUndoManager({execute:function(){},undo:function(){},redo:function(){}});
    //enable line wrapping
    editor.getSession().setUseWrapMode(true);
    //disable active line hightlighting and drag & drop
    editor.setOption("highlightActiveLine", false)
    editor.setOption("dragEnabled",false);

    //set up some editor gui settings
    editor.getSession().setMode("ace/mode/xml");
    editor.getSession().setFoldStyle('manual');
    editor.setTheme("ace/theme/chrome");
    editor.setFontSize(25);
    return editor;
  }

  setModalStatus(status){
    let tasks = $("div#loading-body ul li");
    let task = tasks.eq(status);
    //last task is done
    if(task.length === 0){
      tasks.addClass("isDone");
    }else{
      task.removeClass("isDone");
      task.nextAll().removeClass("isDone");
      task.prevAll().addClass("isDone");
    }
  }

  setEditorTitle(title){
    $("#title").text(`${title}`);
  }

  setModalText(text){
    $("div#loading-body span#text").text(text);
  }

  showModal(){
    $(".editor").hide();
    $(".splash-card-wide").show();
    $("main").addClass("onTop");
  }

  hideModal(){
    $(".splash-card-wide").hide();
    $(".editor").show();
    $("main").removeClass("onTop");
  }

  workspaceHandler(traceModel,segmentValues, segmentOrder, reordered,orders){
    this.setModalStatus(2);
    this.printParticipants();

    let deferred = $.Deferred();
    let editor = this.editor;

    this.segmentManager.bindSegments(traceModel, segmentValues, segmentOrder, reordered,orders).then( () =>{
      this.traceHighlighter.setActiveSegment();
      this.traceHighlighter.updateSegments();
      this.setModalStatus(3);
      this.hideModal();
      deferred.resolve();
    });
    return deferred.promise();
  }

  /**
   *	Initialize the code editor instance. That is, the workspace is initialized and the files of the root dir are loaded
   */

  init(){
    this.workspace.init()
    .then( () => this.loadFiles() );
  }

  /**
   *	Prints the list of the participants of the current file
   */

  printParticipants(){
    let users = this.workspace.getParticipants().map( (user) => {
      let color = getParticipantColor(user.count) || {bg:"#ffffff",fg:"#000000"};
      return $(
        `<li class="mdl-list__item">
        <span  class="mdl-list__item-primary-content">
        <i style="background-color:${color.bg}" class="material-icons mdl-list__item-icon">person</i>${user.name}
        </span>
        </li>`)
      }
    );

    $("#participantList").html(users);
  }


  /**
  *	Load and displays the files of the repository of an optional path or the root folder
  *	@param {[string]} filePath - An optional parameter containing the absolute path of the dir that files should be loaded. If not given, the files of the root dir are loaded
  *	@return {Promise}          - A promise that is resolved after fetching the data
  */

  loadFiles(filePath=""){
    let deferred = $.Deferred();
    self = this;
    this.workspace.getFiles(filePath)
      .then( (files) => this.fileList.setFiles(files) )
      .always( () => {
        deferred.resolve();
      })

    return deferred;
  }

  /**
  *	Jumps to the location of the given segment id
  *	@param {string} segmentId  - The id of the segment you want to jump to
  */

  goToSegment(segmentId){
    let aceDoc = this.editor.getSession().getDocument();
    let {start, end} = this.segmentManager.getSegmentDim(segmentId,true);

    let position = aceDoc.indexToPosition(start,0);
    //add offset as indexToPosition start at row 0
    //the 2nd argument startRow of indexToPosition IS not an index offset
    position.row+=1;
    //bug of ace editor, we need to manually recalculate the height of the ace editor to scroll to the right
    //position
    this.editor.resize(true);
    this.editor.scrollToLine(position.row, true, true, function () {});
    this.editor.gotoLine(position.row, position.column, true);
  }

  /**
  *	Setup the code editor and the ace instance based on the given extension
  *	@param {string} extension  - The extension starting with a dot
  */

  setAceModeByExtension(extension){
    let aceMode = "text";
    switch(extension){
      case ".js" :
      aceMode = "javascript";
      this.hideSideBar();
      break;
      case ".xml" :
      aceMode = "xml";
      this.showSideBar();
      break;
      case ".java" :
      aceMode = "java";
      this.hideSideBar();
      break;
    }
    this.editor.getSession().setMode(`ace/mode/${aceMode}`);
  }

  /**
  *	Loads and open a new file. While loading a splash screen is displayed.
  *	@param {string} fileName   - The filename of the file
  *	@param {[boolean]} reload  - Indicates if the the file should be reloaded completely. If so, the yjs data structures of the file will also be reinitialized
  *	@return {Promise}          - A promise that is resolved when the loading is finished
  */

  open(fileName,reload=false){
    this.hideGuidances();
    this.showModal();
    this.setModalStatus(0);
    this.setAceModeByExtension( Path.extname(fileName) );
    this.setEditorTitle(Path.basename(fileName));
    if (!this.workspace.isRoomSynchronized()) {
      return this.workspace.init()
      .then( () => this.workspace.loadFile(fileName,reload) )
      .then( this.workspaceHandler );
    }else{
      return this.workspace.loadFile(fileName,reload)
      .then( this.workspaceHandler );
    }
  }
}
