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

  /**
   * Requests a merge / push command to the github proxy server.
   * @param {string} repoName - The name of the repository
   * @return {Promise}        - A promise that is resolved when the request was successfully executed and rejects if it failed.
   */

  push(repoName){
    repoName = repoName.split(" ").join("-");
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
   * @typedef {object} ContentProvider~File
   * @property {string} fileName  - The name of the file
   * @property {string} content  - The content of the file
   */

  /**
   * Get the content of all files needed for the live preview of widgets. Therefore, a special endpoint of the github proxy service is called
   * @param {string} modelName  - The name of the model
   * @return {promise.<ContentProvider~File[]>}  - A promise that resolve with the needed files
   */

  getLivePreviewFiles(modelName){
    let deferred = $.Deferred();
    let repoName = modelName.split(" ").join("-");
    $.getJSON(
      `${config.GitHubProxyService.endPointBase}/${repoName}/livePreviewFiles/`
    ).then(function(data){
      let files = data.files;
      files = files.map( (file) => {
        file.content = new Buffer(file.content,"base64").toString("utf-8");
        return file;
      });
      deferred.resolve(files);
    }).fail( deferred.reject );

    return deferred.promise();
  }

  /**
   * Get the file content and trace information for a file of a modelName
   * @param {string} modelName  - The name of the model
   * @param {string} fileName   - The file name
   */

  getContent(modelName,fileName){
    let deferred = $.Deferred();
    let repoName = modelName.split(" ").join("-");
    $.getJSON(
      `${config.GitHubProxyService.endPointBase}/${repoName}/file/?file=${fileName}`
    ).then(function(data){
      let content = new Buffer(data.content,"base64").toString("utf-8");
      deferred.resolve({traces:data.traceModel,text:content})
    }).fail(()=>{
      deferred.reject();
    });

    return deferred.promise();
  }

  /**
   * Get the file list of all traced files from the github proxy service
   * @param {string}    modelName - The name of the model
   * @param {string}    [path=""]    - An optional sub directory. Defines the folder whose traced files should be returned.
   *                              	If not given, the default empty path "" will be used. An empty path corresponds to the root folder
   */

  getFiles(modelName,path=""){
    let repoName = modelName.split(" ").join("-");
    return $.getJSON(
      `${config.GitHubProxyService.endPointBase}/${repoName}/files?path=${path}`
    );
  }

  /**
   * Get the location of a model entity by its id from a model using an endpoint of the github proxy service
   * @param {string}  modelName - The name of the model
   * @param {string}  entityId  - The id of the model element
   * @return {promise}          - Resolved when the request is finished
   */

  getSegmentLocation(modelName,entityId){
    let repoName = modelName.split(" ").join("-");

    return $.getJSON(
      `${config.GitHubProxyService.endPointBase}/${repoName}/segment/${entityId}`
    );
  }

  /**
   * Save the content and trace information of a single file to the github proxy service and commit its changes.
   * @param {string} fileName             - The file name
   * @param {string} repoName             - The name of the repository
   * @param {object} data                 - A data object containing more information
   * @param {string} data.content         - The content of the file
   * @param {object} data.traces          - The traces of the file
   * @param {string} data.changedSegment  - The name of the changed segment used in the commit message
   * @param {string} data.user            - The user name of the author
   */

  saveFile(filename,repoName,{code,traces,changedSegment,user} ){

    repoName = repoName.split(" ").join("-");
    let encodedContent = new Buffer(code).toString('base64');
    let commitMessage = `${changedSegment} edited by ${user}`;
    let requestData = {
      content : encodedContent,
      traces,
      filename,
      commitMessage
    };
    return $.ajax({
      type: 'PUT',
      contentType: "application/json;charset=utf-8",
      url: `${config.GitHubProxyService.endPointBase}/${repoName}/file/`,
      data: JSON.stringify(requestData)
    }).done( (data, status) =>{
      let message = `Changes saved`
      this.emit("event",message, data);
    }).fail( (status) =>{
      if(status.status == 409 && status.responseText.indexOf("Wrong generation id") > -1){
        let  message = `Error while saving: ${status.responseText}`;
        this.emit("event", message, {generationIdConflict:true});
      }else if(status.responseText){
        let  message = `Error while saving: ${status.responseText}`;
        this.emit("event", message, status);
      }else{
        let  message = `Error while saving`;
        this.emit("event", message, status);
      }
    });
  }
}

export default ContentProvider;
