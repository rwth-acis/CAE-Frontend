import config from "./config.js";
export default class ContentProvider{
  getContent(fileName){
    let deferred = $.Deferred();

    let modelName = "frontendComponent-neues-Widget2";

    $.getJSON(
      `${config.GitHubProxyService.endPointBase}/${modelName}/file/?file=${fileName}`
    ).then(function(data){
      let content = new Buffer(data.content,"base64").toString("utf-8");
      deferred.resolve({traces:data.traceModel,text:content})
    });

    return deferred.promise();
  }

  getFiles(modelName,path=""){
    modelName = "frontendComponent-neues-Widget2";
    return $.getJSON(
      `${config.GitHubProxyService.endPointBase}/${modelName}/files?path=${path}`
    );
  }

  saveFile(filename,repoName,{code,traces,changedSegment,user}){
    repoName = repoName.replace(" ", "-");
    let encodedContent = new Buffer(code).toString('base64');
    let commitMessage = `[${changedSegment}] edited ${user}`;
    let requestData = {
      content : encodedContent,
      traces,
      filename,
      commitMessage
    };
    return $.ajax({
      type: 'POST',
      dataType: "json",
      contentType: "application/json;charset=utf-8",
      url: `${config.GitHubProxyService.endPointBase}/${repoName}/file/`,
      data: JSON.stringify(requestData)
    });
  }
}
