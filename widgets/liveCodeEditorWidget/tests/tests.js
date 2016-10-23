import CodeEditor from "../src/lib/CodeEditor.js";
import ContentProvider from "../src/lib/ContentProvider.js";
import TraceModel from "../src/lib/TraceModel.js";

// mockup for the content provider class
class ContentProviderMockUp extends ContentProvider{
  getFiles(modelName,path=""){
    return $.getJSON(
      "testFiles/fileList.json"
    );
  }
  getContent(modelName,fileName){
    let deferred = $.Deferred();
    $.getJSON(
      "testFiles/fileContent.json"
    ).then(function(data){
      let content = new Buffer(data.content,"base64").toString("utf-8");
      deferred.resolve({traces:data.traceModel,text:content})
    }).fail(()=>{
      deferred.reject();
    });

    return deferred.promise();
  }

  saveFile(){
    let deferred =$.Deferred();
    deferred.resolve();
    return deferred.promise();
  }
}

class CodeEditorMock extends CodeEditor{
  constructor(){
    super("editor1");
    this.workspace.contentProvider = new ContentProviderMockUp();
  }
}

QUnit.test( "TraceModel should successfully parses a file trace model",function(assert){
  let done = assert.async();
  let contentProvider = new ContentProviderMockUp();
  contentProvider.getContent().then( (model) =>{
    let traceModel = new TraceModel(model);
    traceModel.parseModel();
    assert.ok(true, "Done");
    done();
  });
});

let codeEditor = new CodeEditorMock();

QUnit.test( "Code Editor should load test file successfully...", function( assert ) {
  let done = assert.async();

  codeEditor.init().then( () => {
    codeEditor.open("_TESTNAME_",true).then( () => {

      let aceDocument = codeEditor.editor.getSession().getDocument();

      assert.ok(true, "Done");
      done();

      QUnit.test( "Content of ace editor should be equal to the content of the current trace model", function( assert ) {
        let traceModelContent = codeEditor.segmentManager.getTraceModel().getContent();
        let editorValue = codeEditor.editor.getSession().getValue();
        assert.ok( traceModelContent == editorValue, "Done" );
      });

      QUnit.test( "Top down reordering test", function( assert ) {
        let mainContentId = "2a1c7f1c76959d715a80cfd4:$Main_Content$";
        let segmentManager = codeEditor.segmentManager;
        let orderBefore = segmentManager.getOrderAbleSegments()[0];
        segmentManager.reorderSegmentsByPosition(1,0,mainContentId);
        let orderAfter = segmentManager.getOrderAbleSegments()[0];
        assert.ok( orderBefore[1].id == orderAfter[2].id && orderBefore[2].id == orderAfter[1].id, "Done" );
      });

      QUnit.test( "Bottom up reordering test", function( assert ) {
        let mainContentId = "2a1c7f1c76959d715a80cfd4:$Main_Content$";
        let segmentManager = codeEditor.segmentManager;
        let orderBefore = segmentManager.getOrderAbleSegments()[0];
        segmentManager.reorderSegmentsByPosition(0,1,mainContentId);
        let orderAfter = segmentManager.getOrderAbleSegments()[0];
        assert.ok( orderBefore[1].id == orderAfter[2].id && orderBefore[2].id == orderAfter[1].id, "Done" );
      });

      QUnit.test( "Changes in ace editor should be correctly propagated to the right position of the current active segment", function( assert ){
        let done = assert.async();
        let segmentManager = codeEditor.segmentManager;
        let traceHighlighter = codeEditor.traceHighlighter;
        let htmlSegmentId = segmentManager.getOrderAbleSegments()[0][1].id;
        let htmlSegments = segmentManager.getTraceModel().getFlattenIndexes(true).filter( (index) => {
          return index.id == htmlSegmentId;
        }).map( (index) => {
          return index.children;
        });
        htmlSegments = htmlSegments && htmlSegments[0] || [];
        for(let segment of htmlSegments){
          //take the first unprotected segment
          if(!segmentManager.isProtected(segment.id)){
            let {yText} = segmentManager.getSegmentByIdRaw(segment.id);
            traceHighlighter.setActiveSegment(segment.id);
            let {start,end} = segmentManager.getSegmentDim(segment.id);
            let offset = parseInt((end-start)/2);
            let position = aceDocument.indexToPosition(start+offset, 0);

            yText.observe( (e)=>{
              assert.ok(e[0].index == offset,"Offset is ok");
            });

            aceDocument.insert(position, "justAText");
            let traceModelContent = codeEditor.segmentManager.getTraceModel().getContent();
            let editorValue = codeEditor.editor.getSession().getValue();
            assert.ok( traceModelContent == editorValue, "Editor content equals trace model content" );
            done();
            break;
          }
        }


      });

    });


  });
});