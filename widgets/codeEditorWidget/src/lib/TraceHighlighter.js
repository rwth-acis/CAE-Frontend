let Range = ace.require('ace/range').Range
let usrId = (Math.random()*1000).toString();
import {delayed} from "./Utils";

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
    }
    
    remoteCursorChangeHandler(name){
        try{
            console.log(name);
            if (name != usrId) {
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
    
    setCursor(cursorPosIndex,segment){
        this.workspace.setCursor(usrId,cursorPosIndex);
        //let segStart = this.segmentManager.getSegmentStartIndex(segment);
        //let relSegStart = Math.max( cursorPosIndex-segStart,0);
        //this.setCurrentPositionIndex( relSegStart );
    }
    
    getCursorIndex(){
        let aceDoc = this.editor.getSession().getDocument();
        return aceDoc.positionToIndex(this.editor.getCursorPosition(),0);
    }
    
    //setCurrentPositionIndex(index){
    //    this.cursorPosIndex = index;
    //}
    //
    //getCurrentPositionIndex(){
    //    return this.cursorPosIndex;
    //}
    
    setState(state,cursorPos){
        this.state = state;
        if (cursorPos && this.getActiveSegment() ) {
            this.setCursor(cursorPos,this.getActiveSegment());
        }
        this.render();
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
    
    render(){
        this.renderSegments();
    }
    
    renderActiveSegment(){  
        console.log("renderActiveSegments");
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
        let index = this.workspace.getCursor(usr);
        let aceDoc = this.editor.getSession().getDocument();
        let start = aceDoc.indexToPosition(index,0);
        if (typeof this.cursorMarkers[usr] != "undefined") {
            this.editor.getSession().removeMarker(this.cursorMarkers[usr]);
            delete this.cursorMarkers[usr];
        }
        this.cursorMarkers[usr]=this.editor.session.addMarker(new Range(start.row,start.column-1,start.row,start.column), "moveable", function(html,range,left,top,config){
            let div = `<div style="top:${top};left:${left+config.characterWidth};height:${config.lineHeight}" class="remoteCursor"></div>`;
            html.push(div);
        },true);
    }
    
    
    renderSegments(){
        console.log("renderSegments");
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