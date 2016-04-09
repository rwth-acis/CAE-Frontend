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
        editor.on("change",this.segmentManager.editorChangeHandler.bind(this.segmentManager) );
        editor.on("mouseup",function(e){
            this.traceHighlighter.updateActiveSegment();
            this.traceHighlighter.setState(0, this.commandDecorator.getCursorIndex());
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
        
        segmentManager.addChangeListener(function(e,content){
            workspace.saveFile("testFile",segmentManager);
        });
        
        return segmentManager;
    }
    
    createAceEditor(editorId){
        let editor = ace.edit(editorId);
        editor.$blockScrolling = Infinity;
        editor.setOptions({enableBasicAutocompletion: false, enableLiveAutocompletion: false});
    
        //dirty way to disable the built-in undomanager completely
        //we need to build our on as we need to additionally store the affected segments
        editor.getSession().setUndoManager({execute:function(){},undo:function(){},redo:function(){}});
        
        editor.setOption("dragEnabled",false);
        editor.getSession().setMode("ace/mode/html");
        editor.getSession().setFoldStyle('manual');
        editor.setTheme("ace/theme/chrome");
        editor.setFontSize(25);
        return editor;
    }
    
    setModalText(text){
        $("div#modal-body").text(text);
    }
    
    hideModal(){
        $(".modal-overlay").removeClass("modal-is-visible");
        $(".modal").removeClass("modal-is-visible");
    }
    
    workspaceHandler(ySegmentMap,ySegmentArray,traceModel,reordered,orders){
        this.setModalText(`Binding segments with yjs`);
        let deferred = $.Deferred();
        let editor = this.editor;
        this.segmentManager.bindSegments(traceModel,ySegmentMap,ySegmentArray,reordered,orders).then( function(){
            this.traceHighlighter.updateSegments();
            let diff = new Date().getTime() - this.startTime;
            console.log(diff);
            deferred.resolve();
        }.bind(this));
        return deferred.promise();
    }
    
    load(fileName,reload=false){    
        this.setModalText(`Synchronizing with yjs room`);
        
        if (!this.workspace.isRoomSynchronized()) {
            return this.workspace.init(fileName,reload).then(this.workspaceHandler.bind(this));
        }else{
            return this.workspace.loadFile(fileName,reload).then(this.workspaceHandler.bind(this));
        }
    }
}