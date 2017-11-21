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
    console.log("=======IWC HANDLER MAIN WIDGET");
    console.log(intent);

    let sender = intent.sender;
    
    if (sender === "MICROSERVICE_SELECT_WIDGET") {
        console.log("SELECT WIDGET");
        let data = intent.extras.payload.data.data;
        let jsonData = JSON.parse(data);
        
        console.log(jsonData);
        if (jsonData) {
            console.log("JSON DATA NON NULL");
            let componentName = jsonData.name;
            let version = jsonData.version;
            console.log("=====COMPONENT NAME");
            console.log(componentName);
            loadComponentMetadataList(y, componentName, version);
        }
    }
};

var createEdge = function(source, target) {
  client.sendConnectionSelected()
}

var isSameArray = function(arr1, arr2) {
    if (!arr1 || !arr2)
        return false;
        
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

var removeDuplicateRows = function($table){
    function getVisibleRowText($row){
        return $row.find('td:visible').text().toLowerCase();
    }

    $table.find('tr').each(function(index, row){
        var $row = $(row);
        $row.nextAll('tr').each(function(index, next){
            var $next = $(next);
            if(getVisibleRowText($next) == getVisibleRowText($row))
                $next.remove();
        })
    });
}

var isSameMap = function(map1, map2) {
    if (!map1 || !map2) {
        return false;
    }
    var testVal;
    // compare size, if different, not same
    if (map1.size !== map2.size) {
        return false;
    }
    for (var [key, val] of map1) {
        testVal = map2.get(key);
        if (testVal !== val || (testVal === undefined && !map2.has(key))) {
            return false;
        }
    }
    return true;
}

var processSchema = function(schemaName, schemas) {
    console.log("===PROCESS SCHEMA for " + schemaName);
    console.log("===AVAILABLE SCHEMAS DEFINITIONS");
    console.log(schemas);

    // extract keys, types, maps and sort
    var schemasKeys = [];
    var schemasTypes = [];
    var schemasMap = new Map();

    // get schema object
    if (schemas.hasOwnProperty(schemaName)) {
        var schemaObject = schemas[schemaName].properties;
        for (var property in schemaObject) {
            if (schemaObject.hasOwnProperty(property)) {
                schemasKeys.push(property);
                schemasTypes.push(schemaObject[property].type);
                schemasMap.set(property, schemaObject[property].type);
            }
        }
        // sort
        schemasKeys = schemasKeys.sort(sorter);
        schemasTypes = schemasTypes.sort(sorter);
    }

    console.log("KEYS, TYPES, MAPS");
    console.log(schemasKeys);
    console.log(schemasTypes);
    console.log(schemasMap);

    return [schemasKeys, schemasTypes, schemasMap];
    
};

var processOperationConsumes = function(parameters, schemas) {
    var consumes = [];
    var consumesString = [];
    var schemasKeys = null;
    var schemasTypes = null;
    var schemasMap = null;
    var isSchema = false;
    
    for (var index in parameters) {
        if (parameters.hasOwnProperty(index)) {
            var parameter = parameters[index];
            console.log("[Metadata] Processing parameter");
            console.log(parameter);
            // get name and type
            var parameterName =  parameter.name;
            var schemaName = "";

            if(parameter.type) {
                schemaName = parameter.type;
            } else if(parameter.schema) {
                isSchema = true;
                console.log("[Metadata Widget] Schema detected");
                console.log(parameter.schema);
                console.log(parameter.schema["$ref"]);
                schemaName = parameter.schema["$ref"].replace(/^.*[\\\/]/, '');

                if (schemas) {
                    var processedSchema = processSchema(schemaName, schemas);
                    schemasKeys = processedSchema[0];
                    schemasTypes = processedSchema[1];
                    schemasMap = processedSchema[2];
                }
            }
            consumes.push(schemaName);

            var parameterString = `${parameterName} - (${schemaName})`;
            consumesString.push(parameterString);
        }
    };

    return [consumes, consumesString, isSchema, schemasKeys, schemasTypes, schemasMap];
}

var processOperationProduces = function(responses, schemas) {
    var produces = [];
    var producesString = [];
    var schemasKeys = null;
    var schemasTypes = null;
    var schemasMap = null;
    var isSchema = false;

    for (var responseProperty in responses) {
        // look for schema
        if (responses[responseProperty].schema) {
            isSchema = true;
            console.log("[Metadata Widget] Schema detected");
            console.log(responses[responseProperty].schema);
            console.log(responses[responseProperty].schema["$ref"]);
            schemaName = responses[responseProperty].schema["$ref"].replace(/^.*[\\\/]/, '');
            produces.push(schemaName);
            producesString.push(`${responseProperty} - (${schemaName})`);

            // only process response 200 for schemas matching
            if (responseProperty === "200" && schemas) {
                var processedSchema = processSchema(schemaName, schemas);
                schemasKeys = processedSchema[0];
                schemasTypes = processedSchema[1];
                schemasMap = processedSchema[2];
            }
        } else {
            producesString.push(`${responseProperty}`);
        }
    }

    return [produces, producesString, isSchema, schemasKeys, schemasTypes, schemasMap];
}

var compareLevelEnum = {
    RED: "compare-red",
    ORANGE: "compare-orange",
    YELLOW: "compare-yellow",
    GREEN: "compare-green"
}

var addTableRowHandler = function(y) {
    $("#metadataTable").delegate('tr', 'click', function() {
        $("#componentMetadataMatchTable").html("");
        console.log("ROW CLICK FIND MATCHES");
        console.log($(this));

        // get component name, endpoint name, operation name
        var componentName = $(this).find(".doc_id").html();
        var endpointName = $(this).find(".doc_property").html();
        var operationType = $(this).find(".doc_operation").html();

        console.log("[Metadata Widget] Load all metadata docs for selected widget");
        client.sendRequest("GET", "docs/component/" + componentName , "", "application/json", {},
            function(value, type) {

                console.log("[Metadata Widget] Get path consumes and produces")
                console.log(value);
                var docObject = null;

                var timeDeployed = null;
                if (value.timeDeployed) 
                    timeDeployed = new Date(value.timeDeployed);
                var timeEdited = null;
                if (value.timeEdited)
                    timeEdited = new Date(value.timeEdited);

                // parse json string to object
                docObject = JSON.parse(value.docString);
                
                // check if deployed url exist and newer than edit time
                if (value.urlDeployed && timeDeployed && timeEdited && timeDeployed > timeEdited) {
                    var urlDeployed = value.urlDeployed;
                    var basePath = docObject.basePath;
                    var urlString = `${urlDeployed}${basePath}swagger.json`;
                    urlString = urlString.replace(/([^:]\/)\/+/g, "$1");
                    console.log("LOAD SWAGGER JSON FROM URL " + urlString);

                    // get swagger json from path instead
                    $.getJSON(urlString, function(data) {
                        console.log("DATA FETCHED");
                        console.log(data);
                        docObject = data;
                    });
                }

                console.log("[Metadata Widget] Parse docString to object");
                console.log(docObject);

                var docPaths = docObject.paths;

                if (docPaths.hasOwnProperty(endpointName)) {
                    console.log("[Metadata] Find object for endpoint " + endpointName);
                    var pathNode = docPaths[endpointName];
                    console.log(pathNode);
                    console.log("[Metadata] Find operation " + operationType);
                    if (pathNode.hasOwnProperty(operationType)) {
                        console.log("[Metadata] Find object for operation " + operationType);
                        var operationNode = pathNode[operationType];
                        console.log(operationNode);

                        // process parameters
                        var definitions = docObject.definitions;
                        var processedConsumes = processOperationConsumes(operationNode.parameters, definitions);
                        var operationConsumes = processedConsumes[0];

                        // process responses
                        var processedResponses = processOperationProduces(operationNode.responses, definitions);
                        var operationProduces = processedResponses[0];

                        // compare parameters for comparing data name only
                        var sortedOperationConsumes = operationConsumes.sort(sorter);
                        var sortedOperationProduces = operationProduces.sort(sorter);

                        // generate other parameters for deeper compare
                        var isSchemaProduce = processedResponses[2];
                        var schemasKeysProduce = processedResponses[3];
                        var schemasTypesProduce = processedResponses[4];
                        var schemasMapProduce = processedResponses[5];

                        var isSchemaConsume = processedConsumes[2];
                        var schemasKeysConsume = processedConsumes[3];
                        var schemasTypesConsume = processedConsumes[4];
                        var schemasMapConsume = processedConsumes[5];

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

                                    // parse json string to object
                                    componentDocObject = JSON.parse(componentValue.docString);

                                    var timeDeployed = null;
                                    if (componentValue.timeDeployed) 
                                        timeDeployed = new Date(componentValue.timeDeployed);
                                    var timeEdited = null;
                                    if (componentValue.timeEdited)
                                        timeEdited = new Date(componentValue.timeEdited);
                                    
                                    // check if deployed url exist and newer than edit time
                                    if (componentValue.urlDeployed && timeDeployed && timeEdited && timeDeployed > timeEdited) {
                                        var urlDeployed = componentValue.urlDeployed;
                                        var basePath = componentDocObject.basePath;
                                        var urlString = `${urlDeployed}${basePath}swagger.json`;
                                        urlString = urlString.replace(/([^:]\/)\/+/g, "$1");
                                        console.log("LOAD SWAGGER JSON FROM URL " + urlString);

                                        // get swagger json from path instead
                                        $.getJSON(urlString, function(data) {
                                            console.log("DATA FETCHED");
                                            console.log(data);
                                            componentDocObject = data;
                                        });
                                    }

                                    console.log("[Metadata Widget] Parse other component docString to object");
                                    console.log(componentDocObject);
                    
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

                                                // process parameters
                                                var componentDefinitions = componentDocObject.definitions;
                                                var processedOperationConsumes = processOperationConsumes(componentDocOperationDetail.parameters, componentDefinitions);
                                                var componentOperationConsumes = processedOperationConsumes[0];
                                                var componentOperationConsumesString = processedOperationConsumes[1];

                                                // process responses
                                                var processedOperationProduces = processOperationProduces(componentDocOperationDetail.responses, componentDefinitions);
                                                var componentOperationProduces = processedOperationProduces[0];
                                                var componentOperationProducesString = processedOperationProduces[1];
                                                
                                                var sortedComponentOperationConsumes = componentOperationConsumes.sort(sorter);
                                                var sortedComponentOperationProduces = componentOperationProduces.sort(sorter);
                                                
                                                // generate other parameters for deeper compare
                                                var componentIsSchemaProduce = processedOperationProduces[2];
                                                var componentSchemasKeysProduce = processedOperationProduces[3];
                                                var componentSchemasTypesProduce = processedOperationProduces[4];
                                                var componentSchemasMapProduce = processedOperationProduces[5];

                                                var componentIsSchemaConsume = processedOperationConsumes[2];
                                                var componentSchemasKeysConsume = processedOperationConsumes[3];
                                                var componentSchemasTypesConsume = processedOperationConsumes[4];
                                                var componentSchemasMapConsume = processedOperationConsumes[5];
                                                
                                                console.log("SORTED COMPONENT OPERATIONS");
                                                console.log(sortedComponentOperationConsumes);
                                                console.log(sortedComponentOperationProduces);

                                                console.log("SORTED OPERATIONS");
                                                console.log(sortedOperationConsumes);
                                                console.log(sortedOperationProduces);

                                                var compareLevel = compareLevelEnum.RED;

                                                // compare with operation consumes produces - lowest level compare
                                                if (isSameArray(sortedOperationConsumes, sortedComponentOperationProduces) || isSameArray(sortedComponentOperationConsumes, sortedOperationProduces)) {
                                                    console.log("Found matching components on red level");

                                                    // check other compare level if there's schema
                                                    if (isSchemaProduce || isSchemaConsume || componentIsSchemaConsume || componentIsSchemaProduce) {
                                                        // match schema on produce and consume
                                                        if ((isSchemaProduce && componentIsSchemaConsume) || (isSchemaConsume && componentIsSchemaProduce)) {
                                                            
                                                            // match same keys name
                                                            if (isSameArray(schemasKeysConsume, componentSchemasKeysProduce) || isSameArray(schemasKeysProduce, componentSchemasKeysConsume)) {
                                                                compareLevel = compareLevelEnum.YELLOW;

                                                                // check map for perfectly same
                                                                if (isSameMap(schemasMapConsume, componentSchemasMapProduce) || isSameMap(schemasMapProduce, componentSchemasMapConsume)) {
                                                                    compareLevel = compareLevelEnum.GREEN;
                                                                }
                                                            }

                                                            // match same keys name
                                                            if (isSameArray(schemasTypesConsume, componentSchemasTypesProduce) || isSameArray(schemasTypesProduce, componentSchemasTypesConsume)) {
                                                                compareLevel = compareLevelEnum.ORANGE;
                                                                
                                                                // check map for perfectly same
                                                                if (isSameMap(schemasMapConsume, componentSchemasMapProduce) || isSameMap(schemasMapProduce, componentSchemasMapConsume)) {
                                                                    compareLevel = compareLevelEnum.GREEN;
                                                                }
                                                            }
                                                        }
                                                    } else {
                                                        // no schema so just green pass
                                                        compareLevel = compareLevelEnum.GREEN;
                                                        compareText = "No schema";
                                                        compareLabel = "label-success";
                                                    }

                                                    var producesString = componentOperationProducesString.join(' , ');
                                                    var parametersString = componentOperationConsumesString.join(' , ');

                                                    $("#componentMetadataMatchTable").append("<tr>" +
                                                        "<td class='doc_id'>" + componentValue.componentId + "</td>" + 
                                                        "<td class='doc_property'>" + componentDocProperty + "</td>" +
                                                        "<td class='doc_operation'>" + componentDocOperation + "</td>" +
                                                        "<td class='doc_parameters'>" + parametersString  + "</td>" +
                                                        "<td class='doc_produces'>" + producesString  + "</td>" +
                                                        "<td class='doc_level col-md-2'>" + "<div class='compare-box " + compareLevel + "'></div></td>" +
                                                    "</tr>");
                                                }

                                            }
                                        }
                                    }
                                }
                            });

                            /*$("#metadataTable").delegate('tr', 'click', function() {
                                createEdge(componentName, $(this).find(".doc_id").html());
                            });*/
                        });
                    }
                };
            });
    });
}

var init = function() {

  $("#metadataMatchTable").hide();
  console.log("[Metadata Widget] INIT METADATA WIDGET");

  $('#metadataTable').on('click', '.clickable-row', function(event) {
    if($(this).hasClass('clicked')){
        $(this).removeClass('clicked'); 
    } else {
        $(this).addClass('clicked').siblings().removeClass('clicked');
    }
  });
  
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
            //iwcClient = new iwc.Client("METADATA");
            iwcClient = new iwc.Client("MAIN");
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

var processData = function(value) {
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

                    // process parameters
                    console.log("[Metadata Widget] Processing parameters list");

                    var processedParameters = processOperationConsumes(docOperationDetail.parameters, null);
                    var parametersList = processedParameters[1];

                    // process produces
                    var processedProduces = processOperationProduces(docOperationDetail.responses, null);
                    var producesList = processedProduces[1];

                    var producesString = producesList.join(' , ');
                    var parametersString = parametersList.join(' , ');

                    $("#componentMetadataTable").append("<tr class='clickable-row'>" +
                        "<td class='doc_id'>" + value.componentId + "</td>" + 
                        "<td class='doc_property'>" + docProperty + "</td>" +
                        "<td class='doc_operation'>" + docOperation + "</td>" +
                        "<td class='doc_parameters'>" + parametersString  + "</td>" +
                        "<td class='doc_produces'>" + producesString  + "</td>" +
                    "</tr>");
                }

                // remove duplicates from table
                removeDuplicateRows($('#componentMetadataTable'));
            }
            
        }
    };
}

// loads the metadata doc list from API or yjs
var loadMetadataList = function(y) {

  console.log("[Metadata Widget] Load all metadata docs for metadata widget");
  // first, clean the current metadata doc list
  y.share.data.set('metadataDocList', null);
  $("#metadataComponent").html("None");
  $("#componentMetadataTable").html("");
  $("#componentMetadataMatchTable").html("");

  client.sendRequest("GET", "docs/" , "", "application/json", {},
    function(data, type) {
        data.forEach(function(value) {
            processData(value);
        });
    },
    function(error) {
        console.log(error);
        feedback(error);
    });
};

// loads the metadata doc list from API or yjs
var loadComponentMetadataList = function(y, componentName, version) {

  var restGet = "docs/component/" + componentName;
  if (version)
    restGet = "docs/component/" + componentName + "/" + version;

  console.log("[Metadata Widget] Load all metadata docs for metadata widget");
  // first, clean the current metadata doc list
  y.share.data.set('metadataDocList', null);
  $("#metadataComponent").html(componentName);
  $("#componentMetadataTable").html("");
  $("#componentMetadataMatchTable").html("");

  client.sendRequest("GET", restGet, "", "application/json", {},
    function(value, type) {
        processData(value);
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