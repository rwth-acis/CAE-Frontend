/*
 * Copyright (c) 2015 Advanced Community Information Systems (ACIS) Group, Chair
 * of Computer Science 5 (Databases & Information Systems), RWTH Aachen
 * University, Germany All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * Neither the name of the ACIS Group nor the names of its contributors may be
 * used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

 // global variables
var client,
    resourceSpace = new openapp.oo.Resource(openapp.param.space()),
    feedbackTimeout,
    loadedModel = null,
    loadedMetadataDocList = null,
    iwcClient = null;

var iwcHandler = function(y, intent) {

    $("#metadataMatchTable").hide();
    console.log("=======IWC HANDLER METADATA WIDGET");
    console.log(intent);
    console.log(y);

    let data = intent.extras.payload.data.data;
    let jsonData = JSON.parse(data);
    
    if (jsonData) {
        //load metadata details based on widget name
        let componentName = null;
        let componentId = jsonData.selectedEntityId;
        var model = y.share.data.get('model');
        console.log("====TRY FETCH MODEL=====");
        console.log(model);

        if (model.nodes.hasOwnProperty(componentId)) {
            componentName = model.nodes[componentId].label.value.value;
            console.log("=====COMPONENT NAME");
            console.log(componentName);

            if (componentName) {
                loadComponentMetadataList(y, componentName);
            }
        }
    }
};

var createEdge = function(source, target) {
  client.sendConnectionSelected()
}

var isSame = function(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (var i = 0, len = arr1.length; i < len; i++){
        if (arr1[i] !== arr2[i]){
            return false;
        }
    }
    return true;
}

var sorter = function(x, y) {
    var pre = ['string' , 'number' , 'bool']
    if(typeof x!== typeof y )return pre.indexOf(typeof y) - pre.indexOf(typeof x);
    if(x === y)return 0;
    else return (x > y)?1:-1;
}

var addTableRowHandler = function(y) {
    $("#metadataTable").delegate('tr', 'click', function() {
        console.log("ROW CLICK");
        // get component name, endpoint name, operation name
        var componentName = $(this).find(".doc_id").html();
        var endpointName = $(this).find(".doc_property").html();
        var operationType = $(this).find(".doc_operation").html();

        console.log("[Metadata Widget] Load all metadata docs for metadata widget");
        client.sendRequest("GET", "docs/component/" + componentName , "", "application/json", {},
            function(value, type) {

                console.log("[Metadata Widget] Get path consumes and produces")
                console.log(value);
                var docObject = null;

                if (value.docType === "json") {
                    // parse json string to object
                    docObject = JSON.parse(value.docString);
                    console.log("[Metadata Widget] Parse docString to object");
                    console.log(docObject);
                }

                var docPaths = docObject.paths;

                if (docPaths.hasOwnProperty(endpointName)) {
                    console.log("[Metadata] Find object for endpoint " + endpointName);
                    var pathNode = docPaths[endpointName];
                    console.log(pathNode);
                    console.log("[Metadata] Find operation " + operationType);
                    if (pathNode.hasOwnProperty(operationType)) {
                        console.log("[Metadata] Find object for operation " + operationType);
                        var operationNode = pathNode[operationType];
                        var operationConsumes = operationNode.consumes;
                        var operationProduces = operationNode.produces;

                        var sortedOperationConsumes = operationConsumes.sort(sorter);
                        var sortedOperationProduces = operationProduces.sort(sorter);

                        // get all metadata from api and find matching endpoint
                        client.sendRequest("GET", "docs/", "", "application/json", {}, function(data, type) {
                            
                            $("#metadataMatchTable").show();
                            
                            console.log("ALL DATA length");
                            console.log(data.length);
                            console.log(data);

                            // iterate through each component available except self
                            data.forEach(function(componentValue) {
                                if (componentValue.componentId !== componentName) {
                                    console.log("[Metadata Widget] Going through list of other components metadata doc")
                                    //console.log(componentValue);
                                    var componentDocObject = null;

                                    if (componentValue.docType === "json") {
                                        // parse json string to object
                                        componentDocObject = JSON.parse(componentValue.docString);
                                        console.log("[Metadata Widget] Parse other component docString to object");
                                        console.log(componentDocObject);
                                    }

                                    var componentDocPaths = componentDocObject.paths;

                                    // go through each paths and look for matching produces and consumes
                                    for (var componentDocProperty in componentDocPaths) {
                                        var componentDocPath = componentDocPaths[componentDocProperty];

                                        // iterate through operations
                                        for (var componentDocOperation in componentDocPath) {
                                            if (componentDocPath.hasOwnProperty(componentDocOperation)) {
                                                 // iterate per operations available
                                                console.log("[Metadata Widget] Get matching component operation detail, append row");
                                                var componentDocOperationDetail = componentDocPath[componentDocOperation];

                                                console.log("CHECK PRODUCES AND CONSUMES LIST");
                                                var componentOperationConsumes = componentDocOperationDetail.consumes;
                                                var componentOperationProduces = componentDocOperationDetail.produces;
                                                
                                                var sortedComponentOperationConsumes = componentOperationConsumes.sort(sorter);
                                                var sortedComponentOperationProduces = componentOperationProduces.sort(sorter);
                                                
                                                console.log("SORTED COMPONENT OPERATIONS");
                                                console.log(sortedComponentOperationConsumes);
                                                console.log(sortedComponentOperationProduces);

                                                console.log("SORTED OPERATIONS");
                                                console.log(sortedOperationConsumes);
                                                console.log(sortedOperationProduces);

                                                // compare with operation consumes produces
                                                if (isSame(sortedOperationConsumes, sortedComponentOperationProduces) && isSame(sortedComponentOperationConsumes, sortedOperationProduces)) {
                                                    console.log("Found matching components")
                                                    var parametersList = [];

                                                    // process parameters
                                                    var parameters = componentDocOperationDetail.parameters;
                                                    console.log("[Metadata Widget] Processing matching component parameters list");
                                                    console.log(parameters);
                                                    
                                                    for (var index in parameters) {
                                                        if (parameters.hasOwnProperty(index)) {
                                                            var parameter = parameters[index];
                                                            console.log("[Metadata Widget] Processing parameter");
                                                            console.log(parameter);
                                                            // get name and type
                                                            var parameterName =  parameter.name;
                                                            var parameterFormat = "";

                                                            if(parameter.type) {
                                                                parameterFormat = parameter.type;
                                                            } else if(parameter.schema) {
                                                                console.log("[Metadata Widget] Schema detected");
                                                                parameterFormat = parameter.schema["$ref"].replace(/^.*[\\\/]/, '');
                                                            }

                                                            var parameterString = parameterName + " - (" + parameterFormat + ")"
                                                            parametersList.push(parameterString);
                                                        }
                                                    };

                                                    // process produces
                                                    var producesString = componentDocOperationDetail.produces.join(' , ');
                                                    var parametersString = parametersList.join(' , ');

                                                    $("#componentMetadataMatchTable").append("<tr>" +
                                                        "<td class='doc_id'>" + componentValue.componentId + "</td>" + 
                                                        "<td class='doc_property'>" + componentDocProperty + "</td>" +
                                                        "<td class='doc_operation'>" + componentDocOperation + "</td>" +
                                                        "<td class='doc_parameters'>" + parametersString  + "</td>" +
                                                        "<td class='doc_produces'>" + producesString  + "</td>" +
                                                    "</tr>");
                                                }

                                            }
                                        }
                                    }
                                }
                            });

                            $("#metadataTable").delegate('tr', 'click', function() {
                                createEdge(componentName, $(this).find(".doc_id").html());
                            });
                        });
                    }
                };
            });
    });
}

var init = function() {
  $("#metadataMatchTable").hide();
  console.log("[Metadata Widget] INIT METADATA WIDGET");
  
  var iwcCallback = function(intent) {
    console.log("IWC CALLBACK METADATA WIDGET");
    console.log(intent);
    this.loadedMetadataDocList();
  };

  client = new Las2peerWidgetLibrary("@@caehost/CAE", iwcCallback);

  spaceTitle = frameElement.baseURI.substring(frameElement.baseURI.lastIndexOf('/') + 1);
    if (spaceTitle.indexOf('#') != -1 || spaceTitle.indexOf('?') != -1) {
        spaceTitle = spaceTitle.replace(/[#|\\?]\S*/g, '');
    };

    Y({
        db: {
            name: 'memory' // store the shared data in memory
        },
        connector: {
            name: 'websockets-client', // use the websockets connector
            room: spaceTitle,
            url: '@@yjsserver'
        },
        share: { // specify the shared content
            users: 'Map',
            undo: 'Array',
            redo: 'Array',
            join: 'Map',
            canvas: 'Map',
            nodes: 'Map',
            edges: 'Map',
            userList: 'Map',
            select: 'Map',
            views: 'Map',
            data: 'Map',
            text: "Text"
        },
        sourceDir: '@@host/metadataWidget/js'
    }).then(function(y) {

        try {
            console.log("BIND IWC CLIENT");
            iwcClient = new iwc.Client("METADATA");
            iwcClient.connect( iwcHandler.bind(this, y) );
        } catch(e){
            console.log("ERROR METADATA WIDGET");
            console.log(e);
        }

        // get loaded metadata doc list
        if (y.share.data.get('metadataDocList')) {
          console.log("[Metadata Widget] Shared metadata doc list found");
          // load model
          var data = y.share.data.get('metadataDocList');
          //console.log(data);
          loadedSwaggerDoc = data;
        } else {
            console.log("[Metadata Widget] No shared metadata doc list, load metadata doc list");
            loadedSwaggerDoc = null;
            loadMetadataList(y);
        }

        addTableRowHandler(y);
    });
};

// loads the metadata doc list from API or yjs
var loadMetadataList = function(y) {

  console.log("[Metadata Widget] Load all metadata docs for metadata widget");
  // first, clean the current metadata doc list
  y.share.data.set('metadataDocList', null);
  $("#metadataComponent").html("None");
  $("#componentMetadataTable").html("");

  client.sendRequest("GET", "docs/" , "", "application/json", {},
    function(data, type) {
        data.forEach(function(value) {
            console.log("[Metadata Widget] Going through list of available metadata doc")
            //console.log(value);
            var docObject = null;

            if (value.docType === "json") {
                // parse json string to object
                docObject = JSON.parse(value.docString);
                console.log("[Metadata Widget] Parse docString to object");
                console.log(docObject);
            }

            var docPaths = docObject.paths;

            // iterate through the paths
            for (var docProperty in docPaths) {
                // make sure it actually has the property
                if (docPaths.hasOwnProperty(docProperty)) {

                    var docPath = docPaths[docProperty];
                    for (var docOperation in docPath) {
                        if (docPath.hasOwnProperty(docOperation)) {
                            // iterate per operations available
                            console.log("[Metadata Widget] Get operation detail, append row");
                            var docOperationDetail = docPath[docOperation];
                            var parametersList = [];

                            // process parameters
                            var parameters = docOperationDetail.parameters;
                            console.log("[Metadata Widget] Processing parameters list");
                            console.log(parameters);
                            
                            for (var index in parameters) {
                                if (parameters.hasOwnProperty(index)) {
                                    var parameter = parameters[index];
                                    console.log("[Metadata Widget] Processing parameter");
                                    console.log(parameter);
                                    // get name and type
                                    var parameterName =  parameter.name;
                                    var parameterFormat = "";

                                    if(parameter.type) {
                                        parameterFormat = parameter.type;
                                    } else if(parameter.schema) {
                                        console.log("[Metadata Widget] Schema detected");
                                        parameterFormat = parameter.schema["$ref"].replace(/^.*[\\\/]/, '');
                                    }

                                    var parameterString = parameterName + " - (" + parameterFormat + ")"
                                    parametersList.push(parameterString);
                                }
                            };

                            // process produces
                            var producesString = docOperationDetail.produces.join(' , ');
                            var parametersString = parametersList.join(' , ');

                            $("#componentMetadataTable").append("<tr>" +
                                "<td class='doc_id'>" + value.componentId + "</td>" + 
                                "<td class='doc_property'>" + docProperty + "</td>" +
                                "<td class='doc_operation'>" + docOperation + "</td>" +
                                "<td class='doc_parameters'>" + parametersString  + "</td>" +
                                "<td class='doc_produces'>" + producesString  + "</td>" +
                            "</tr>");
                        }
                    }
                    
                }
            };
        });

        y.share.data.set('metadataDoc', data);
        //y.share.canvas.set('ReloadWidgetOperation', 'import');
        feedback("Metadata doc loaded, please refresh browser!");
    },
    function(error) {
        console.log(error);
        feedback(error);
    });
};

// loads the metadata doc list from API or yjs
var loadComponentMetadataList = function(y, componentName) {

  console.log("[Metadata Widget] Load all metadata docs for metadata widget");
  // first, clean the current metadata doc list
  y.share.data.set('metadataDocList', null);
  $("#metadataComponent").html(componentName);
  $("#componentMetadataTable").html("");

  client.sendRequest("GET", "docs/component/" + componentName , "", "application/json", {},
    function(value, type) {

        console.log("[Metadata Widget] Going through list of available metadata doc")
        //console.log(value);
        var docObject = null;

        if (value.docType === "json") {
            // parse json string to object
            var docObject = JSON.parse(value.docString);
            console.log("[Metadata Widget] Parse docString to object");
            console.log(docObject);
        }

        var docPaths = docObject.paths;

        // iterate through the paths
        for (var docProperty in docPaths) {
            // make sure it actually has the property
            if (docPaths.hasOwnProperty(docProperty)) {

                var docPath = docPaths[docProperty];
                for (var docOperation in docPath) {
                    if (docPath.hasOwnProperty(docOperation)) {
                        // iterate per operations available
                        console.log("[Metadata Widget] Get operation detail, append row");
                        var docOperationDetail = docPath[docOperation];
                        var parametersList = [];

                        // process parameters
                        var parameters = docOperationDetail.parameters;
                        console.log("[Metadata Widget] Processing parameters list");
                        console.log(parameters);
                        
                        for (var index in parameters) {
                            if (parameters.hasOwnProperty(index)) {
                                var parameter = parameters[index];
                                console.log("[Metadata Widget] Processing parameter");
                                console.log(parameter);
                                // get name and type
                                var parameterName =  parameter.name;
                                var parameterFormat = "";

                                if(parameter.type) {
                                    parameterFormat = parameter.type;
                                } else if(parameter.schema) {
                                    console.log("[Metadata Widget] Schema detected");
                                    console.log(parameter.schema);
                                    console.log(parameter.schema["$ref"]);
                                    parameterFormat = parameter.schema["$ref"].replace(/^.*[\\\/]/, '');
                                }

                                var parameterString = parameterName + " - (" + parameterFormat + ")"
                                parametersList.push(parameterString);
                            }
                        };

                        // process produces
                        var producesString = docOperationDetail.produces.join(' , ');
                        var parametersString = parametersList.join(' , ');

                        $("#componentMetadataTable").append("<tr>" +
                            "<td>" + value.componentId + "</td>" + 
                            "<td>" + docProperty + "</td>" +
                            "<td>" + docOperation + "</td>" +
                            "<td>" + parametersString  + "</td>" +
                            "<td>" + producesString  + "</td>" +
                            "<td>" + "<input id='" + value.id + value.componentId + "checkBox' type='checkbox'>" + "</td>" + 
                        "</tr>");
                    }
                }
                
            }
        };

        y.share.data.set('metadataDoc', value);
        //y.share.canvas.set('ReloadWidgetOperation', 'import');
        feedback("Metadata doc loaded, please refresh browser!");
    },
    function(error) {
        console.log(error);
        feedback(error);
    });
};

$(document).ready(function() {
  init();
});

/******************* Helper Functions ********************/

// displays a message in the status box on the screen for the time of "feedbackTimeout"
feedback = function(msg){
    $("#status").val(msg);
    clearTimeout(feedbackTimeout);
    feedbackTimeout = setTimeout(function(){
      $("#status").val("");
    },6000);
};