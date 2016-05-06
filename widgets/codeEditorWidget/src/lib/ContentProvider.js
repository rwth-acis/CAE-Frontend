import config from "./config.js";
export default class ContentProvider{
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

  saveFile(filename,repoName,{code,traces,changedSegment,user}){
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
    });
  }
}
