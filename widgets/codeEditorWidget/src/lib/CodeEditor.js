import SegmentManager from "./SegmentManager";
import TraceHighlighter from "./TraceHighlighter";
import CommandDecorator from "./CommandDecorator";
import Workspace from "./workspace";
import ContentProvider from "./ContentProvider";

export default class CodeEditor{

  constructor(editorId){
    this.startTime = new Date().getTime();
    this.workspace = new Workspace(new ContentProvider());
    this.editor = this.createAceEditor(editorId);
    this.segmentManager = this.createSegmentManager(this.editor,this.workspace);
    this.traceHighlighter = new TraceHighlighter(this.editor, this.segmentManager, this.workspace);
    this.commandDecorator = new CommandDecorator(this.editor, this.segmentManager, this.traceHighlighter);

    this.segmentManager.addChangeListener(function(e,content){
      this.traceHighlighter.updateSegments(e);
    }.bind(this));

    this.bindAceEditor(this.editor);
  }

  bindAceEditor(editor){
    let traceHighlighter = this.traceHighlighter;
    editor.getSession().selection.on('changeCursor', function (e){
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
      workspace.saveFile(segmentManager,parent);
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

  workspaceHandler(ySegmentMap,ySegmentArray,traceModel,reordered,orders){
    this.setModalStatus(2);
    let deferred = $.Deferred();
    let editor = this.editor;
    this.segmentManager.bindSegments(traceModel,ySegmentMap,ySegmentArray,reordered,orders).then( function(){
      this.traceHighlighter.updateSegments();
      let diff = new Date().getTime() - this.startTime;
      console.log(diff);
      deferred.resolve();
      this.setModalStatus(3);
      this.hideModal();
    }.bind(this));
    return deferred.promise();
  }

  init(){
    this.workspace.init().then(()=>this.loadFiles());
  }

  loadFiles(filePath="./"){
    let deferred = $.Deferred();
    self = this;
    this.workspace.getFiles(filePath).then(function(data){
      let links = data.files.map( file =>
        $(`<a>${file.name}</a>`).click(function(){
          let path = file.name;
          if (file.type == "folder") {
            self.loadFiles(path);
          }else{
            self.load(path);
          }
        }).attr({
          "class" : "mdl-navigation__link",
          "href" : "javascript:void(0);"
        })
      );

      if (!self.workspace.isRootPath()) {
        links.unshift($(`<a>../</a>`).click(function(){self.loadFiles("../")}).attr({"href":"javascript:void(0);","class":"mdl-navigation__link"}));
      }

      $("#files").html( links );
    })

    deferred.resolve();
    return deferred;
  }

  load(fileName,reload=false){
    this.showModal();
    this.setModalStatus(0);

    if (!this.workspace.isRoomSynchronized()) {
      return this.workspace.init().then( () => {
        this.setModalStatus(1);
        return this.workspace.loadFile(fileName,reload)
      }).then(this.workspaceHandler.bind(this));
    }else{
      return this.workspace.loadFile(fileName,reload).then(this.workspaceHandler.bind(this));
    }
  }
}
