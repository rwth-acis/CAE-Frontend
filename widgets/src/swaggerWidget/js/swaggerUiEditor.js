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
    editor;

var iwcHandler = function(y, intent) {

    //if (!iwcHandled) {
        iwcHandled = true;
        console.log("=======[SWAGGER] IWC HANDLER MAIN WIDGET");
        console.log(intent);

        let sender = intent.sender;
        
        if (sender === "MICROSERVICE_SELECT_WIDGET" || sender === "FRONTEND_COMPONENT_SELECT_WIDGET") {
            console.log("SELECT WIDGET");
            let data = intent.extras.payload.data.data;
            let jsonData = JSON.parse(data);
            
            console.log(jsonData);
            if (jsonData) {
                console.log("JSON DATA NON NULL");
                let componentName = jsonData.name;
                console.log("=====COMPONENT NAME");
                console.log(componentName);
                currentComponentName = componentName;
                loadMetadata(y);
            }
        }
    //}
};

var init = function() {
  console.log("[Swagger Editor Widget] INIT SWAGGER UI EDITOR VIEW");
  
  console.log("Build system");

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
  console.log("CAE HOST " + "@@caehost/CAE");
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
            text: "Text"
        },
        sourceDir: '@@host/swaggerWidget/js'
        //sourceDir: 'http://localhost:8001/microservicePersistenceWidget/js'
    }).then(function(y) {
        console.info('[Swagger Editor Widget] Yjs successfully initialized');

        try {
            console.log("[Swagger] BIND IWC CLIENT");
            //iwcClient = new iwc.Client("METADATA");
            iwcClient = new iwc.Client("MAIN");
            iwcClient.connect( iwcHandler.bind(this, y) );
        } catch(e){
            console.log("ERROR METADATA WIDGET");
            console.log(e);
        }

        editor.specActions.updateSpec('{}');
        $('.ace_text-input').prop('disabled', true);

        console.log("Load swagger UI Editor js");

        // retrieve current model from the space and store it
        if (y.share.data.get('metadataDoc')) {
          console.log("[Swagger Editor Widget] Shared metadata doc found");
          // load model
          var data = y.share.data.get('metadataDoc');
          console.log(data);
          loadedSwaggerDoc = data;
        } else {
            console.log("[Swagger Editor Widget] No shared metadata, load metadata");
            loadedSwaggerDoc = null;
        }

        console.log("Load swagger ui");
        console.log(loadedSwaggerDoc.docString);
        loadMetadata(y);

        $('#load-doc').on('click', function() {
          console.log("UPDATE SPEC");
          loadMetadata(y);
        })
        
    });
};

var loadMetadata = function(y) {
  console.log("[Swagger Editor] Load metadata");

  // use current component name if available
  if (currentComponentName) {
    loadedModel = currentComponentName;
  } else if (y.share.data.get('model')) {
      console.log('[Swagger Widget] Saved model exists');
      var data = y.share.data.get('model');
      loadedModel = data.attributes.label.value.value;
      // special case if model was only saved in the space (not loaded from db)
      if (loadedModel.toUpperCase() == "Model attributes".toUpperCase()) {
          loadedModel = null;
          feedback("Model was not loaded from database until now..");
      } else {
          console.log("[Swagger Editor] Model Exists " + loadedModel);
          $("#name").html(loadedModel);
      }
  } else {
      loadedModel = null;
  }
  
  if (loadedModel) {
    console.log("[Swagger Widget] Load metadata for model " + loadedModel);
    // first, clean the current model
    y.share.data.set('metadataDoc', null);
    client.sendRequest("GET", "docs/component/" + loadedModel, "", "application/json", {},
        function(data, type) {
            console.log("[Swagger UI Editor Widget] Metadata doc loaded!");
            console.log(data);
            var jsonDocString = JSON.parse(data.docString);
            var timeDeployed = null;
            if (data.timeDeployed) 
                timeDeployed = new Date(data.timeDeployed);
            var timeEdited = null;
            if (data.timeEdited)
                timeEdited = new Date(data.timeEdited);

            // check if deployed url exist and newer than edit time
            if (data.urlDeployed && timeDeployed && timeEdited && timeDeployed > timeEdited) {
                var urlDeployed = data.urlDeployed;
                var basePath = jsonDocString.basePath;
                var urlString = `${urlDeployed}${basePath}swagger.json`;
                urlString = urlString.replace(/([^:]\/)\/+/g, "$1");
                console.log("LOAD SWAGGER JSON FROM URL " + urlString);

                // get swagger json from path instead
                $.getJSON(urlString, function(data) {
                    console.log("DATA FETCHED");
                    console.log(data);
                    //var yamlObject = json2yaml(jsonDocString);
                    //editor.specActions.updateSpec(yamlObject);
                    editor.specActions.updateSpec(JSON.stringify(data));
                    y.share.data.set('metadataDoc', data);
                    $("#status").html("Deployed");
                });
                
            } else {
                //var yamlObject = json2yaml(jsonDocString);
                //editor.specActions.updateSpec(yamlObject);
                editor.specActions.updateSpec(JSON.stringify(jsonDocString));
                y.share.data.set('metadataDoc', data);
                $("#status").html("Not deployed");
            }
        },
        function(error) {
            console.log(error);
        });  
  } else {
      console.log('[Swagger UI Editor Widget] No shared model');
      editor.specActions.updateSpec('{}');
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