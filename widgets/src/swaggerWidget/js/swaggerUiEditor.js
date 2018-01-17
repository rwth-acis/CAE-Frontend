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
    iwcClient = null,
    currentComponentName = null,
    editor,
    swaggerStatus = null;

var iwcHandler = function(y, intent) {
    iwcHandled = true;

    let sender = intent.sender;
    
    if (sender === "MICROSERVICE_SELECT_WIDGET" || sender === "FRONTEND_COMPONENT_SELECT_WIDGET") {
        let data = intent.extras.payload.data.data;
        let jsonData = JSON.parse(data);
        
        if (jsonData) {
            let componentName = jsonData.name;
            currentComponentName = componentName;
            loadMetadata(y);
        }
    }
};

var init = function() {
  editor = SwaggerEditorBundle({
    dom_id: '#swagger-editor',
    layout: 'StandaloneLayout',
    presets: [
      SwaggerEditorStandalonePreset
    ]
  });
  
  var iwcCallback = function(intent) {
    console.log(intent);
  };
  client = new Las2peerWidgetLibrary("@@caehost/CAE", iwcCallback);

  spaceTitle = frameElement.baseURI.substring(frameElement.baseURI.lastIndexOf('/') + 1);
    if (spaceTitle.indexOf('#') != -1 || spaceTitle.indexOf('?') != -1) {
        spaceTitle = spaceTitle.replace(/[#|\\?]\S*/g, '');
    }
  
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
            text: "Text",
            swagger: 'Map',
        },
        sourceDir: '@@host/swaggerWidget/js'
    }).then(function(y) {
        console.info('[Swagger Editor Widget] Yjs successfully initialized');

        try {
            iwcClient = new iwc.Client("Canvas");
            iwcClient.connect( iwcHandler.bind(this, y) );
        } catch(e){
            console.log(e);
        }

        editor.specActions.updateSpec('{}');
        $('.ace_text-input').prop('disabled', true);
        loadMetadata(y);

        $('#load-doc').on('click', function() {
          loadMetadata(y);
        })

        swaggerStatus = y.share.swagger;
        swaggerStatus.observe(function() {
          loadMetadata(y);
        });
    });
};

var loadMetadata = function(y) {

    $("#name").html("");
    $("#status").html("");
    $("#extra-information").html("");

    // retrieve current model from the space and store it
    if (y.share.data.get('metadataDoc')) {
        // load model
        var data = y.share.data.get('metadataDoc');
        loadedSwaggerDoc = data;
    } else {
        loadedSwaggerDoc = null;
    }

    // use current component name if available
    if (currentComponentName) {
        loadedModel = currentComponentName;
    } else if (y.share.data.get('model')) {
        var data = y.share.data.get('model');
        loadedModel = data.attributes.label.value.value;
        // special case if model was only saved in the space (not loaded from db)
        if (loadedModel.toUpperCase() == "Model attributes".toUpperCase()) {
            loadedModel = null;
            feedback("Model was not loaded from database until now..");
        } else {
            $("#name").html(loadedModel);
        }
    } else {
        loadedModel = null;
    }

    if (loadedModel) {
        $("#name").html(loadedModel);
        $("#status").html('<span class="label label-info">Loading information</span>');
        // first, clean the current model
        y.share.data.set('metadataDoc', null);
        client.sendRequest("GET", "docs/component/" + loadedModel, "", "application/json", {},
            function(data, type) {
                var jsonDocString = JSON.parse(data.docString);
                var timeDeployed = null;
                if (data.timeDeployed) {
                    // parse
                    timeDeployed = new Date(data.timeDeployed * 1000);
                }
                var timeEdited = null;
                if (data.timeEdited) {
                    timeEdited = new Date(data.timeEdited * 1000);
                }

                // check if deployed url exist and newer than edit time
                if (data.urlDeployed && timeDeployed && timeEdited && timeDeployed > timeEdited) {
                    var urlDeployed = data.urlDeployed;
                    var basePath = jsonDocString.basePath + "/";
                    basePath.replace("//", "/");
                    var urlString = `${urlDeployed}${basePath}v${data.version}.0/swagger.json`;
                    urlString = urlString.replace(/([^:]\/)\/+/g, "$1");

                    // get swagger json from path instead
                    $.getJSON(urlString)
                    .success(function(data) {
                        // inject host element
                        var urlHost = new URL(urlDeployed);
                        data["host"] = urlHost.host;
                        editor.specActions.updateSpec(JSON.stringify(data));
                        y.share.data.set('metadataDoc', data);
                        $("#status").html('<span class="label label-success">Deployed</span>');

                        // add deployment time and duration since
                        var diff = new Date(timeDeployed - (new Date).getTime());
                        var delta = Math.abs(diff) / 1000;

                        // calculate (and subtract) whole days
                        var days = Math.floor(delta / 86400);
                        delta -= days * 86400;

                        // calculate (and subtract) whole hours
                        var hours = Math.floor(delta / 3600) % 24;
                        delta -= hours * 3600;

                        // calculate (and subtract) whole minutes
                        var minutes = Math.floor(delta / 60) % 60;
                        delta -= minutes * 60;

                        var timeText = "";
                        if (days != 0) {
                            timeText += days;
                            if (days > 1)
                                timeText += " days ";
                            else
                                timeText += " day ";
                        }

                        if (hours != 0) {
                            timeText += hours;
                            if (hours > 1)
                                timeText += " hours ";
                            else
                                timeText += " hour ";
                        }

                        if (minutes != 0) {
                            timeText += minutes;
                            if (minutes > 1)
                                timeText += " minutes ";
                            else
                                timeText += " minute ";
                        }

                        timeText += Math.floor(delta) + " seconds";

                        $("#extra-information").html(`<h4>Deployed since: <span class='extra-time'>${timeText}</span></h4>`)
                    })
                    .fail($("#status").html('<span class="label label-danger">Deployed service is not found</span>'));
                    
                } else {
                    if (jsonDocString)
                        editor.specActions.updateSpec(JSON.stringify(jsonDocString));
                    else
                        editor.specActions.updateSpec(`{
                            "swagger": "2.0",
                            "info": {
                                "version": "0.0.0",
                                "title": "No Swagger",
                            },
                            "paths": {}
                        }`);
                    y.share.data.set('metadataDoc', data);
                    $("#status").html('<span class="label label-warning">Not Deployed</span>');
                }
            },
            function(error) {
                editor.specActions.updateSpec(`{
                    "swagger": "2.0",
                    "info": {
                        "version": "0.0.0",
                        "title": "No Swagger",
                    },
                    "paths": {}
                }`);
            });  
    } else {
        editor.specActions.updateSpec(`{
            "swagger": "2.0",
            "info": {
                "version": "0.0.0",
                "title": "No Swagger",
            },
            "paths": {}
        }`);
        return;
    }

};

$(document).ready(function() {
  init();
});

/******************* Helper Functions ********************/

// function that retrieves the model of the current space
var getData = function(type){
  var spaceUri = openapp.param.space(),
      listOfDataUris = [],
      promises = [],
      mainDeferred = $.Deferred(),
      deferred = $.Deferred();

  openapp.resource.get(spaceUri,(function(deferred){

    return function(space){
      var resourceUri, resourceObj, values;
      for(resourceUri in space.data){
        if(space.data.hasOwnProperty(resourceUri)){
          resourceObj = space.data[resourceUri];
          if(resourceObj['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'] &&
              _.isArray(resourceObj['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'])){

            values = _.map(resourceObj['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'],function(e){
              return e.value;
            });

            if(_.contains(values,"http://purl.org/role/terms/Data") && _.contains(values,type)){
              listOfDataUris.push(resourceUri);
            }

          }
        }
      }
      deferred.resolve();
    };

  })(deferred));
  promises.push(deferred.promise());

  $.when.apply($,promises).then(function(){
    mainDeferred.resolve(listOfDataUris);
  });

  return mainDeferred.promise();
};

// displays a message in the status box on the screen for the time of "feedbackTimeout"
feedback = function(msg){
    $("#status").val(msg);
    clearTimeout(feedbackTimeout);
    feedbackTimeout = setTimeout(function(){
      $("#status").val("");
    },6000);
};