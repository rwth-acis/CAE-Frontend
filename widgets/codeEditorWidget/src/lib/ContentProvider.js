import {EventEmitter} from 'events';
import config from "./config.js";

/**
 * Class providing an API to interact with the github proxy service
 */
class ContentProvider extends EventEmitter{

  constructor(){
    super();
  }

  addEventListener( listener ){
    this.on("event", listener );
  }

  removeEventListener( listener ){
    this.removeListener("event", listener );
  }

  push(repoName){
    repoName = repoName.replace(" ", "-");
    return $.ajax({
      type: 'PUT',
      contentType: "text/plain",
      url: `${config.GitHubProxyService.endPointBase}/${repoName}/push/`
    }).done( (data, status) =>{
      let message = "Commits successfully published";
      this.emit("event",message, data);
    }).fail( (data, status,error) =>{
      console.log(error);
      let  message = `Error while publishing: ${error}`;
      this.emit("event", message);
    });
  }

  /**
   * @typedef {Object} File
   * @property {String} fileName  - The name of the fileName
   * @property {String} content  - The content of the file
   */

  /**
   * Get the content of all files needed for the live preview of widgets. Therefore, a special endpoint of the github proxy service is called
   * @param {string} modelName  - The name of the model
   * @return {Promise.<File[]>}  - A promise that resolve with the needed files
   */

  getLivePreviewFiles(modelName){
    let deferred = $.Deferred();

    let repoName = modelName.replace(" ", "-");

    $.getJSON(
      `${config.GitHubProxyService.endPointBase}/${repoName}/livePreviewFiles/`
    ).then(function(data){
      let files = data.files;
      files = files.map( (file) => {
        file.content = new Buffer(file.content,"base64").toString("utf-8");
        return file;
      });
      deferred.resolve(files);
    });

    return deferred.promise();
  }

  /**
   * Get the file content and trace information for a file of a modelName
   * @param {String} modelName  - The name of the model
   * @param {String} fileName   - The file name
   */

  getContent(modelName,fileName){
    let deferred = $.Deferred();

    let repoName = modelName.replace(" ", "-");

    $.getJSON(
      `${config.GitHubProxyService.endPointBase}/${repoName}/file/?file=${fileName}`
    ).then(function(data){
      let content = new Buffer(data.content,"base64").toString("utf-8");
      deferred.resolve({traces:data.traceModel,text:content})
    });

    return deferred.promise();
  }

  /**
   * Get the file list of all traced files from the github proxy service
   * @param {String}    modelName - The name of the model
   * @param {String}    [path]    - An optional sub directory. Defines the folder whose traced files should be returned.
   *                              	If not given, the default empty path "" will be used. An empty path corresponds to the root folder
   */

  getFiles(modelName,path=""){
    let repoName = modelName.replace(" ", "-");
    return $.getJSON(
      `${config.GitHubProxyService.endPointBase}/${repoName}/files?path=${path}`
    );
  }

  getSegmentLocation(modelName,entityId){
    let repoName = modelName.replace(" ", "-");

    return $.getJSON(
      `${config.GitHubProxyService.endPointBase}/${repoName}/segment/${entityId}`
    );
  }

  saveFile(filename,repoName,{code,traces,changedSegment,user}, callback){
    repoName = repoName.replace(" ", "-");
    let encodedContent = new Buffer(code).toString('base64');
    let commitMessage = `${changedSegment} edited by ${user}`;
    let requestData = {
      content : encodedContent,
      traces,
      filename,
      commitMessage
    };
    //return $.Deferred();
    return $.ajax({
      type: 'POST',
      contentType: "application/json;charset=utf-8",
      url: `${config.GitHubProxyService.endPointBase}/${repoName}/file/`,
      data: JSON.stringify(requestData)
    }).done( (data, status) =>{
      let message = `Changes saved`
      this.emit("event",message, data);
    }).fail( (status) =>{
      console.log(status.status == 409, status.responseText)
      if(status.status == 409 && status.responseText.indexOf("Wrong generation id") > -1){
        let  message = `Error while saving: ${status.responseText}`;
        this.emit("event", message, {generationIdConflict:true});
      }else{
        let  message = `Error while saving: ${status.responseText}`;
        this.emit("event", message, status);
      }
    });
  }
}

export default ContentProvider;
