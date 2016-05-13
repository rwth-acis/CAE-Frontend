import SegmentManager from "./SegmentManager";
import TraceHighlighter from "./TraceHighlighter";
import CommandDecorator from "./CommandDecorator";
import Workspace from "./workspace";
import ContentProvider from "./ContentProvider";
import Path from "path";
import {getParticipantColor} from "./Utils.js";

export default class CodeEditor{

  constructor(editorId){
    this.workspace = new Workspace(new ContentProvider(),this);
    this.editor = this.createAceEditor(editorId);
    this.segmentManager = this.createSegmentManager(this.editor,this.workspace);
    this.traceHighlighter = new TraceHighlighter(this.editor, this.segmentManager, this.workspace);
    this.commandDecorator = new CommandDecorator(this.editor, this.segmentManager, this.traceHighlighter);

    this.segmentManager.addChangeListener( (e,content) => {
      this.traceHighlighter.updateSegments(e);
    } );

    this.bindAceEditor(this.editor);
    this.bindGui();
    //binding functions
    this.workspaceHandler = this.workspaceHandler.bind(this);
  }

  bindGui(){
    $("#publishButton").click( (e) => {
      console.log("publish");
      this.workspace.push();
      e.preventDefault();
    });
  }

  bindAceEditor(editor){
    let traceHighlighter = this.traceHighlighter;

    editor.getSession().selection.on('changeCursor', (e)=>{
      console.log("changeCursor");
      traceHighlighter.updateCursor();
    });

    editor.on("change",this.segmentManager.editorChangeHandler.bind(this.segmentManager) );
    editor.on("mouseup",function(e){
      this.traceHighlighter.updateActiveSegment();
    }.bind(this))
    editor.commands.setDefaultHandler("exec", this.commandDecorator.commandHandler.bind(this.commandDecorator) );
  }

  createSegmentManager(editor,workspace){
    let segmentManager = new SegmentManager(editor);
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
      let parent = segmentManager.getModelName(segmentId);
      workspace.delayedSaveFile(segmentManager,parent);
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
        break;
      case ".xml" :
        aceMode = "xml";
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
