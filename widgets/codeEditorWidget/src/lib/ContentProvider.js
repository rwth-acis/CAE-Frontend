export default class ContentProvider{
    getContent(fileName){
        let deferred = $.Deferred();
        $.getJSON("traces/dummyTrace.php?"+fileName, function(data){
            $.ajax({url:"traces/dummySource.php?"+fileName,dataType:"text"}).then(function(text){
               deferred.resolve({traces:data,text:text}); 
            });
        }).fail(function(err){
            console.error(err);
        });
        
        return deferred.promise();
    }
    saveContent(content,type,fileName){
        return $.ajax({
            type: 'POST', // Use POST with X-HTTP-Method-Override or a straight PUT if appropriate.
            dataType: type, // Set datatype - affects Accept header
            url: "traces/receive.php?fileName="+fileName, // A valid URL
            headers: {"X-HTTP-Method-Override": "PUT"}, // X-HTTP-Method-Override set to PUT.
            data: content // Some data e.g. Valid JSON as a string
        });   
    }
}