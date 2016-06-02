import RoleSpace from "./lib/RoleSpace";
import ContentProvider from "./lib/ContentProvider";

const roleSpace = new RoleSpace();
const contentProvider = new ContentProvider();
let timer = null;

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
        processFiles( files );
        nextTick(componentName);
    }).fail( () => {
      nextTick(componentName);
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
}
