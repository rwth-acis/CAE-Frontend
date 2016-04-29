export default class ContentProvider{
  getContent(fileName){
    let deferred = $.Deferred();

    let modelName = "frontendComponent-neues-Widget2";

    $.getJSON(
      `http://localhost:8080/CAE/github/${modelName}/file/?file=${fileName}`
    ).then(function(data){
      let content = new Buffer(data.content,"base64").toString("utf-8");
      deferred.resolve({traces:data.traceModel,text:content})
    });

    return deferred.promise();
  }

  getFiles(modelName,path=""){
    modelName = "frontendComponent-neues-Widget2";
    return $.getJSON(
      `http://localhost:8080/CAE/github/${modelName}/files?path=${path}`
    );
  }

  saveFile(fileName,{data}){
    let modelName = "frontendComponent-neues-Widget2";
    let encodedContent = new Buffer(data.code).toString('base64');
    let requestData = {
      filename : fileName,
      content : encodedContent
    };
    return $.ajax({
      type: 'POST',
      dataType: "json",
      contentType: "application/json;charset=utf-8",
      url: `http://localhost:8080/CAE/github/${modelName}/file/`,
      data: JSON.stringify(requestData)
    });
  }
}
