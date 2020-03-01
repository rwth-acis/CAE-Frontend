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
    feedbackTimeout,
    loadedModel = null,
    loadedMetadataDocList = null,
    iwcClient = null;

var iwcHandler = function(y, intent) {
    $("#metadataMatchTable").hide();
    
    let sender = intent.sender;
    
    if (sender === "MICROSERVICE_SELECT_WIDGET") {
        let data = intent.extras.payload.data.data;
        let jsonData = JSON.parse(data);
        
        if (jsonData) {
            let componentName = jsonData.name;
            let version = jsonData.version;
            loadComponentMetadataList(y, componentName, version);
        }
    }
};

var createEdge = function(source, target) {
  client.sendConnectionSelected()
}

// generic same arrays checker
var isSameArray = function(arr1, arr2) {
    var counter = 0;

    if (!arr1 || !arr2)
        return false;
    
    for (var i = 0, len = arr1.length; i < len; i++){
        if (counter === (arr2.length - 1))
            return true;

        if (arr1[i] !== arr2[i])
            return false;
        else
            counter ++;
    }
    return true;
}

// check if arr1 included in arr2
var compareArray = function(arr1, arr2) {
    var counter = 0;

    if (!arr1 || !arr2)
        return false;
    
    for (var i = 0, len = arr2.length; i < len; i++){
        if (counter >= (arr2.length - 1))
            return true;

        if (arr1.includes(arr2[i])) {
            counter+=1;
        }
    }
    return false;
}

// sort data types
var sorter = function(x, y) {
    var pre = ['string' , 'number' , 'bool']
    if(typeof x!== typeof y )return pre.indexOf(typeof y) - pre.indexOf(typeof x);
    if(x === y)return 0;
    else return (x > y)?1:-1;
}

// remove duplicate rows in compare table since sometimes the signal comes more than once
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

// check if all map2 contains in map1
var isSameMap = function(map1, map2) {

    var counter = 0;
    if (!map1 || !map2) {
        return false;
    }

    var mapMatches = false;
    
    map2.forEach((val, key) => {

        // -1 for id for now
        if (counter >= (map2.size-1)) {
            mapMatches = true;
        }
        // check if exists in map1
        if (map1.has(key)){
            if (map1.get(key) === val) {
                counter+=1;
            }
        }
    })

    return mapMatches;
}

var processSchema = function(schemaName, schemas) {
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
            // get name and type
            var parameterName =  parameter.name;
            var schemaName = "";

            if(parameter.type) {
                schemaName = parameter.type;
            } else if(parameter.schema) {
                isSchema = true;
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
    GREEN: "compare-green",
    GRAY: "compare-gray",
}

var addTableRowHandler = function(y) {
    $("#metadataTable").delegate('tr', 'click', function() {
        $("#componentMetadataMatchTable").html("");

        // get component name, endpoint name, operation name
        var componentName = $(this).find(".doc_id").html();
        var endpointName = $(this).find(".doc_property").html();
        var operationType = $(this).find(".doc_operation").html();

        client.sendRequest("GET", "docs/component/" + componentName , "", "application/json", {}, false,
            function(value, type) {
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

                    // get swagger json from path instead
                    $.getJSON(urlString, function(data) {
                        docObject = data;
                    });
                }

                var docPaths = docObject.paths;

                if (docPaths.hasOwnProperty(endpointName)) {
                    var pathNode = docPaths[endpointName];
                    if (pathNode.hasOwnProperty(operationType)) {
                        var operationNode = pathNode[operationType];

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
                        client.sendRequest("GET", "docs/", "", "application/json", {}, false, function(data, type) {
                            
                            $("#metadataMatchTable").show();

                            // iterate through each component available except self
                            data.forEach(function(componentValue) {
                                if (componentValue.componentId !== componentName) {
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

                                        // get swagger json from path instead
                                        $.getJSON(urlString, function(data) {
                                            componentDocObject = data;
                                        });
                                    }

                                    if (componentDocObject) {
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

                                                    var compareLevel = compareLevelEnum.RED;
                                                    var produceMatch = false;
                                                    var consumeMatch = false;

                                                    var produceGreen = false;
                                                    var consumeGreen = false;

                                                    var produceNonSchema = false;
                                                    var consumeNonSchema = false;


                                                    // check produce first
                                                    if (isSchemaProduce && componentIsSchemaProduce) {
                                                        // match same keys name
                                                        if (compareArray(schemasKeysProduce, componentSchemasKeysProduce) || compareArray(componentSchemasKeysProduce, schemasKeysProduce)) {
                                                            produceMatch = true;
                                                            compareLevel = compareLevelEnum.RED;

                                                            // check map for perfectly same
                                                            if (isSameMap(schemasMapProduce, componentSchemasMapProduce) || isSameMap(componentSchemasMapProduce, schemasMapProduce)) {
                                                                produceGreen = true;
                                                            }
                                                        }

                                                        // match same keys types
                                                        if (compareArray(schemasTypesProduce, componentSchemasTypesProduce) || compareArray(componentSchemasTypesProduce, schemasTypesProduce)) {
                                                            produceMatch = true;
                                                            compareLevel = compareLevelEnum.ORANGE;
                                                            
                                                            // check map for perfectly same
                                                            if (isSameMap(schemasMapProduce, componentSchemasMapProduce) || isSameMap(componentSchemasMapProduce, schemasMapProduce)) {
                                                                produceGreen = true;
                                                            }
                                                        }
                                                    } else {
                                                        // non schema, auto pass
                                                        produceMatch = true;
                                                        produceNonSchema = true;
                                                    }
                                                        
                                                    // now check consume
                                                    if (isSchemaConsume && componentIsSchemaConsume) {
                                                            
                                                        // match same keys name
                                                        if (compareArray(schemasKeysConsume, componentSchemasKeysConsume) || compareArray(componentSchemasKeysConsume, schemasKeysConsume)) {
                                                            consumeMatch = true;
                                                            compareLevel = compareLevelEnum.RED;

                                                            // check map for perfectly same
                                                            if (isSameMap(schemasMapConsume, componentSchemasMapConsume) || isSameMap(componentSchemasMapConsume, schemasMapConsume)) {
                                                                consumeGreen = true;
                                                            }
                                                        }

                                                        // match same keys name
                                                        if (compareArray(schemasTypesConsume, componentSchemasTypesConsume) || compareArray(componentSchemasTypesConsume, schemasTypesConsume)) {
                                                            consumeMatch = true;
                                                            compareLevel = compareLevelEnum.ORANGE;
                                                            
                                                            // check map for perfectly same
                                                            if (isSameMap(schemasMapConsume, componentSchemasMapConsume) || isSameMap(componentSchemasMapConsume, schemasMapConsume)) {
                                                                consumeGreen = true;
                                                            }
                                                        }
                                                        
                                                    } else {
                                                        // no schema so just green pass
                                                        consumeMatch = true;
                                                        consumeNonSchema = true;
                                                    }

                                                    if ((produceGreen && consumeGreen) || (produceGreen && consumeNonSchema) || (produceNonSchema && consumeGreen))
                                                        compareLevel = compareLevelEnum.GREEN;

                                                    if (produceNonSchema && consumeNonSchema)
                                                        compareLevel = compareLevelEnum.GREEN;

                                                    if (produceMatch || consumeMatch) {
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
                            }
                        });

                        });
                    }
                };
            });
    });
}

var init = function() {

  $("#metadataMatchTable").hide();

  $('#metadataTable').on('click', '.clickable-row', function(event) {
    if($(this).hasClass('clicked')){
        $(this).removeClass('clicked'); 
    } else {
        $(this).addClass('clicked').siblings().removeClass('clicked');
    }
  });
  
  var iwcCallback = function(intent) {
    this.loadedMetadataDocList();
  };

  client = new Las2peerWidgetLibrary("@@caehost/CAE", iwcCallback);

    spaceTitle = frameElement.baseURI.substring(frameElement.baseURI.lastIndexOf('spaces/')).replace(/spaces|#\S*|\?\S*|\//g, '');

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
            iwcClient = new iwc.Client("Canvas");
            iwcClient.connect( iwcHandler.bind(this, y) );
        } catch(e){
            console.error(e);
        }

        // get loaded metadata doc list
        if (y.share.data.get('metadataDocList')) {
          // load model
          var data = y.share.data.get('metadataDocList');
          loadedSwaggerDoc = data;
        } else {
            loadedSwaggerDoc = null;
            loadMetadataList(y);
        }

        addTableRowHandler(y);
    });
};

var processData = function(value) {
    var docObject = null;

    if (value.docType === "json") {
        // parse json string to object
        var docObject = JSON.parse(value.docString);
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
                    var docOperationDetail = docPath[docOperation];

                    // process parameters
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

  // first, clean the current metadata doc list
  y.share.data.set('metadataDocList', null);
  $("#metadataComponent").html("None");
  $("#componentMetadataTable").html("");
  $("#componentMetadataMatchTable").html("");

  client.sendRequest("GET", "docs/" , "", "application/json", {}, false,
    function(data, type) {
        data.forEach(function(value) {
            processData(value);
        });
    },
    function(error) {
        feedback(error);
    });
};

// loads the metadata doc list from API or yjs
var loadComponentMetadataList = function(y, componentName, version) {

  var restGet = "docs/component/" + componentName;
  if (version)
    restGet = "docs/component/" + componentName + "/" + version;

  // first, clean the current metadata doc list
  y.share.data.set('metadataDocList', null);
  $("#metadataComponent").html(componentName);
  $("#componentMetadataTable").html("");
  $("#componentMetadataMatchTable").html("");

  client.sendRequest("GET", restGet, "", "application/json", {}, false,
    function(value, type) {
        processData(value);
    },
    function(error) {
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