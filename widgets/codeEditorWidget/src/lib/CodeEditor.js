import SegmentManager from "./SegmentManager";
import HtmlTree from "./HtmlTree";
import TraceHighlighter from "./TraceHighlighter";
import CommandDecorator from "./CommandDecorator";
import Workspace from "./workspace";
import ContentProvider from "./ContentProvider";
import Path from "path";
import {getParticipantColor} from "./Utils";
import SideBar from "./SideBar";

/**
 *  The main class of the editor. An abstraction of the ace editor with respect to generated traces.
 */

export default class CodeEditor{

  /**
   *  Creates a new instance of the editor. It creates the needed data structures and binds all GUI elements to its
   *  needed callbacks.
   *  @param {string} editorId  - The id of an element in which the editor should be mounted
   */

  constructor(editorId){
    //create needed data structures
    this.workspace = new Workspace(new ContentProvider(),this);
    this.editor = this.createAceEditor(editorId);
    this.segmentManager = this.createSegmentManager();
    this.traceHighlighter = new TraceHighlighter(this.editor, this.segmentManager, this.workspace);
    this.commandDecorator = new CommandDecorator(this.editor, this.segmentManager, this.traceHighlighter);
    this.htmlTree = new HtmlTree();
    this.sideBar = new SideBar(this.htmlTree);

    //binding functions
    this.workspaceHandler = this.workspaceHandler.bind(this);
    this.orderChangeListener = this.orderChangeListener.bind(this);
    this.resizeHandler = this.resizeHandler.bind(this);

    this.segmentManager.addChangeListener( (e) => {
      this.traceHighlighter.updateSegments(e);
    } );

    this.segmentManager.addOrderChangeListener( this.orderChangeListener );

    this.bindGui();
  }

  resizeHandler(){
    let height = $(window).height()-$("header:eq(0)").height() - 20;
    $('.editor, #editor').height(height);
    this.sideBar.height(height);
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


  reorderSegments(e,data){
    let {old_position:from, position:to, parent} = data;
    let modelName = this.segmentManager.getModelName(data.node.id);
    this.segmentManager.reorderSegmentsByPosition(from,to,parent);
    this.workspace.saveFile(this.segmentManager.getTraceModel(), `Reordered ${modelName} from position ${from+1} to ${to+1}` );
  }

  bindGui(){
    //hide sidebar
    this.hideSideBar();

    //bind ace edtior
    this.bindAceEditor();

    //bind jstree
    this.htmlTree.addChangeListener( (e,data) => {this.reorderSegments(e,data);} );

    //bind publish button
    $("#publishButton").click( (e) => {
      this.workspace.push();
      e.preventDefault();
    });


    //bind resize handler
    $(window).resize(this.resizeHandler);
    this.resizeHandler();

  }

  bindAceEditor(){
    let traceHighlighter = this.traceHighlighter;

    this.editor.getSession().selection.on('changeCursor', (e)=>{
      traceHighlighter.updateCursor();
    });

    this.editor.on("change",this.segmentManager.editorChangeHandler.bind(this.segmentManager) );
    this.editor.on("mouseup",() => this.traceHighlighter.updateActiveSegment() );
    this.editor.commands.setDefaultHandler("exec", this.commandDecorator.commandHandler.bind(this.commandDecorator) );
  }

  hideSideBar(){
    $("#container").removeClass("sidebar-is-visible");
    $(".page-content").removeClass("sidebar-is-visible");
    this.sideBar.hide();
  }

  showSideBar(){
    $("#container").addClass("sidebar-is-visible");
    $(".page-content").addClass("sidebar-is-visible");
    this.sideBar.show();
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
      self.workspace.delayedSaveFile(segmentManager.getTraceModel(), segmentManager.getModelName(segmentId) );
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

  getJsTree(){
    return $("div#orderableSegments");
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
      deferred.resolve();
      this.setModalStatus(3);
      this.hideModal();
    });
    return deferred.promise();
  }

  init(){
    this.workspace.init()
    .then( () => this.loadFiles() );
  }

  printParticipants(){
    let users = this.workspace.getParticipants().map( (user) => {
      let color = getParticipantColor(user.count) || {bg:"#ffffff",fg:"#000000"};
      return $(
        `<li class="mdl-list__item">
        <span  class="mdl-list__item-primary-content">
        <i style="background-color:${color.bg}" class="material-icons mdl-list__item-icon">person</i>${user.name}
        </span>
        </li>`)
      } );

      $("#participantList").html(users);
    }

    createLink(file){
      let self = this;
      let fileName = Path.basename(file.path);
      return $(`<a>${fileName}</a>`).click(function(){
        if (file.type == "folder") {
          self.loadFiles(file.path);
        }else if(fileName == "widget.xml" || fileName=="applicationScript.js"){
          self.load(file.path);
        }else{
          alert("Cannot open files without traces");
        }
      }).attr({
        "class" : "mdl-navigation__link",
        "href" : "javascript:void(0);"
      })
    }

    loadFiles(filePath=""){
      let deferred = $.Deferred();
      self = this;
      this.workspace.getFiles(filePath).then(function(data){
        let links = data.files.map( self.createLink.bind(self) );

        if (!self.workspace.isRootPath()) {
          let path = self.workspace.resolvePath("../");
          links.unshift($(`<a>../</a>`).click(function(){self.loadFiles(path)}).attr({"href":"javascript:void(0);","class":"mdl-navigation__link"}));
        }

        $("#files").html( links );
      })

      deferred.resolve();
      return deferred;
    }

    goToSegment(segmentId){
      let {start, end} = this.segmentManager.getSegmentDim(segmentId,true);
      let aceDoc = this.editor.getSession().getDocument();
      let position = aceDoc.indexToPosition(start,0);
      this.editor.scrollToLine(position.row, true, true, function () {});
      this.editor.gotoLine(position.row, position.column, true);
    }

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
      }
      this.editor.getSession().setMode(`ace/mode/${aceMode}`);
    }

    load(fileName,reload=false){
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
