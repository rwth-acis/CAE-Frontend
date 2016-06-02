import RoleSpace from "./lib/RoleSpace";
import ContentProvider from "./lib/ContentProvider";

const roleSpace = new RoleSpace();
const contentProvider = new ContentProvider();
const _fileDictionary = {};

let timer = null;
const _loadedScripts = {};

//initialize role space, then start the polling
roleSpace.init().then( () => {
  roleSpace.getComponentName()
    .then( (componentName) => pollFiles(componentName) );
});

function nextTick(componentName){
  if( timer ){
    clearTimeout(timer);
  }
  timer = setTimeout( () => {
    pollFiles(componentName);
  }, 1000);
}

function pollFiles(componentName){
  console.log("poll");
  contentProvider.getLivePreviewFiles( componentName )
    .done( ( files ) => {
        processFiles( files ).always( () => {
          nextTick(componentName);
        });
    }).fail( () => {
      nextTick(componentName);
    });
}

function getMultiScripts(arr) {
  let deferred = $.Deferred();
  let array = false;
  function loadSingle(){
      if(arr.length == 0){
        deferred.resolve();
      }else{
        let src = arr.shift();
        $.getScript(src,loadSingle);
      }
  }
  loadSingle();
  return deferred.promise();
}

function loadFiles(htmlDoc){
  return loadScripts(htmlDoc.filter("script[src]"));
}

function loadScripts(scripts){
  let inlineScripts=[];
  let dependencies = [];

  scripts.each( function(){
    let script = this;

    let src = $(script).attr("src");
    //check for applicationScript which should always be updated if it was changed
    if( src.indexOf("applicationScript.js") > -1 ){
      script = $("<script type='text/javascript'/>").text(_fileDictionary["js/applicationScript.js"]);
      inlineScripts.push(script);
    }
    //collect other scripts and dependencies
    else if( typeof _loadedScripts[src] === "undefined" ){
      dependencies.push(src);
      _loadedScripts[src] = 1;
    }
  })
  //first load collected scripts/dependencies before appending the inline script, e.g. applicationScript
  return getMultiScripts(dependencies).then( () =>{
    try{
      for(let script of inlineScripts){
        $("head").append(script);
      }
    }catch(error){
      console.error(error);
    }
  });

}

function processFiles(files){
  let htmlDoc = $("");
  try{

    for(let file of files){
      _fileDictionary[file.fileName] = file.content;
    }

    let widgetFile = _fileDictionary["widget.xml"];
    let widgetFileXml = $.parseXML( widgetFile );
    let widgetFileDoc = $( widgetFileXml );
    let contentText = widgetFileDoc.find("Content:first").text();

    htmlDoc = $(contentText);
    let mainContent =  htmlDoc.closest("div").eq(0).html();
    $("div#main-content").html( mainContent );
  }
  catch(error){
    console.log(error);
  }

  return loadFiles(htmlDoc);
}
