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
    loadedSwaggerDoc = null;

var init = function() {
  var iwcCallback = function(intent) {
    console.log(intent);
  };
  client = new Las2peerWidgetLibrary("@@caehost/metadata/metadatadoc", iwcCallback);

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
        sourceDir: '@@host/swaggerWidget/js'
    }).then(function(y) {
        console.info('PERSISTENCE: Yjs successfully initialized');

          // retrieve current swagger doc from the space and store it

          if (y.share.data.get('metadataDoc')) {
            var data = y.share.data.get('metadataDoc');
              if (data.attributes.docString && data.attributes.docString.value) {
                loadedSwaggerType = data.attributes.docType.value;
                loadedSwaggerDoc = data.attributes.docString.value;
                $("#swaggerType").val(loadedSwaggerType);
                $("#swaggerScript").val(loadedSwaggerDoc);
                feedback("Swagger script loaded");
              }
          } else {
              loadedSwaggerDoc = null;
          }

        $('#store-doc').on('click', function() {
          storeDoc(y);
        })
    });
};

// retrieves the JSON representation of this space
var storeDoc = function(y) {

  var swaggerType = $("#swaggerType").val();
  var swaggerScript = $("#swaggerScript").val();
  // TODO validate swagger script

  if(y.share.data.get('metadataDoc')){
    var data = y.share.data.get('metadataDoc');
    // add type and script to metadataDoc
    data.attributes.type.value = swaggerType;
    data.attributes.docString.value = swaggerScript;
    y.share.data.set('metadataDoc',data)

    if(loadedModel === null){
      client.sendRequest("POST", "metadataDoc/", JSON.stringify(data), "application/json", {},
      function(data, type) {
        // save currently loaded model
        loadedModel = $("#name").val();
        console.log("Model stored, retrieving communication view..");
        feedback("Swagger doc stored!");
      },
      function(error) {
        console.log(error);
        feedback(error);
      });
      } else{
        client.sendRequest("PUT", "metadataDoc/" + loadedModel, JSON.stringify(data), "application/json", {},
        function(data, type) {
          console.log("Swagger doc updated!");
          feedback("Swagger doc updated!");
        },
        function(error) {
          console.log(error);
          feedback(error);
        });
      }
  } else {
    feedback("No swagger doc!");
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
