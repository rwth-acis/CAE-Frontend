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
    loadedMetadataDocList = null;

var init = function() {
  console.log("[Metadata Widget] INIT METADATA WIDGET");
  var iwcCallback = function(intent) {
    console.log(intent);
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
        console.info('PERSISTENCE: Yjs successfully initialized');

        // get loaded metadata doc list
        if (y.share.data.get('metadataDocList')) {
          console.log("[Metadata Widget] Shared metadata doc list found");
          // load model
          var data = y.share.data.get('metadataDocList');
          console.log(data);
          loadedSwaggerDoc = data;
        } else {
            console.log("[Metadata Widget] No shared metadata doc list, load metadata doc list");
            loadedSwaggerDoc = null;
            loadMetadataList(y);
        }
    });
};

// loads the metadata doc list from API or yjs
var loadMetadataList = function(y) {
  console.log("[Metadata Widget] Load all metadata docs for metadata widget");
  // first, clean the current metadata doc list
  y.share.data.set('metadataDocList', null);
  client.sendRequest("GET", "docs/" , "", "application/json", {},
    function(data, type) {
        data.forEach(function(value) {
            console.log("[Metadata Widget] Going through list of available metadata doc")
            console.log(value);
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
        });

        y.share.data.set('metadataDoc', data);
        y.share.canvas.set('ReloadWidgetOperation', 'import');
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