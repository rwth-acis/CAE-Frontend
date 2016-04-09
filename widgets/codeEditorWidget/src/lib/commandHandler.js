export default{
    
    //todo: reactivate them
    "redo":function(curSegmentId){
        let curSegment = this.segmentManager.getSegmentById(curSegmentId);
        let redo = this.getLastRedo();
        if (redo) {
            if (redo.action === "swap") {
                this.disableTraceUpdates();
                this.swapTracesUpDown(redo.target,redo.source,redo.blockId);
                this.enableTraceUpdates();
            }else{
                this.setActiveSegment(redo.segment);
                this.editor.getSession().getDocument().applyDelta(redo);
            }
            if (curSegment) {
                this.setActiveSegment(curSegment[2]);
            }
        }
    },
    "undo": function(curSegmentId){
        let curSegment = this.segmentManager.getSegmentById(curSegmentId);
        let undo = this.getLastUndo();
        if (undo) {
            this.fromUndo=true;
            this.setActiveSegment(undo.segment);
            if (undo.action === "swap") {
                this.disableTraceUpdates();
                this.swapTracesUpDown(undo.target,undo.source,undo.blockId);
                this.enableTraceUpdates();
                this.addRedo({action:"swap",target:undo.source,source:undo.target,blockId:undo.blockId});
            }else{
                this.editor.getSession().getDocument().revertDelta(undo);
                this.addRedo(undo);
            }
            this.fromUndo=false;
            if (curSegment) {
                this.setActiveSegment(curSegment[2]);
            }

        }
    }
}