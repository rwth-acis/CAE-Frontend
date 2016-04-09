import CodeEditor from "./lib/CodeEditor";

let codeEditor = new CodeEditor("editor");
codeEditor.load("testFile").then(function(){
    //some debug utils
    $("button#load").click(function(){
       let fileName = $("#filename").val();
       if (fileName && fileName.length > 0) {
            codeEditor.load(fileName,true);
       }
    });
});

