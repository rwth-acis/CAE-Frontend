import {EventEmitter} from 'events';
import config from "./config.js";

export default class ContentProvider extends EventEmitter{

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
      let  message = `Error while publishing: ${error}`;
      this.emit("event", message);
    });
  }

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
    return $.ajax({
      type: 'POST',
      contentType: "application/json;charset=utf-8",
      url: `${config.GitHubProxyService.endPointBase}/${repoName}/file/`,
      data: JSON.stringify(requestData)
    }).done( (data, status) =>{
      let message = `Changes saved`
      this.emit("event",message, data);
    }).fail( (data, status) =>{
      let  message = `Error while saving: ${status}`;
      this.emit("event", message);
    });
  }
}
