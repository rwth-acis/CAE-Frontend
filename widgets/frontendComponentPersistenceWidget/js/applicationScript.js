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
    loadedModel = null;
    
var init = function() {
  var iwcCallback = function(intent) {
    console.log(intent);
  };
  client = new Las2peerWidgetLibrary("http://localhost:8080/CAE/models", iwcCallback);
  
   // retrieve current model from the space and store it
  getData("my:ns:model").then(function(modelUris){
    if(modelUris.length > 0){
      $.get(modelUris[0]+"/:representation").done(function(data){
        loadedModel = data.attributes.label.value.value;
        // special case if model was only saved in the space (not loaded from db)
        if(loadedModel == "Model attributes"){
          loadedModel = null;
          feedback("Model was not loaded from database until now..");
        } else{
          $("#name").val(loadedModel);
        }
      });
    }
    else{
      loadedModel = null;
    }
  });

  $('#delete-model').on('click', function() {
    resetCurrentModel();
  })
  $('#store-model').on('click', function() {
    storeModel();
  })
  $('#load-model').on('click', function() {
    loadModel();
  })
}

// deletes the current model (empties the current model of this space)
var resetCurrentModel = function() {
  $("#name").val("");
  $("#version").val("");
  getData("my:ns:model").then(function(modelUris){
    if(modelUris.length > 0){
      _.map(modelUris,function(uri){
        openapp.resource.del(uri,function(){
          loadedModel = null;
          feedback("Model reset, please refresh browser!");
        });
      });
    } else {
      feedback("No model!");
    }
  });
};

// retrieves the JSON representation of this space
var storeModel = function() {
  if($("#name").val().length == 0 || $("#version").val().length == 0){
    feedback("Please choose frontend component name & version!");
    return;
  }
  if(isNaN($("#version").val())){
    feedback("Version has to be a number!");
    return;
  }
  getData("my:ns:model").then(function(modelUris){
      if(modelUris.length > 0){
        $.get(modelUris[0]+"/:representation").done(function(data){
          // add name, version and type to model
          data.attributes.label.value.value = $("#name").val();
          data.attributes.attributes[generateRandomId()] = generateAttribute("version", $("#version").val());
          data.attributes.attributes[generateRandomId()] = generateAttribute("type", "frontend-component");
          if(loadedModel === null){
            client.sendRequest("POST", "", JSON.stringify(data), "application/json", {},
            function(data, type) {
              // save currently loaded model
              loadedModel = $("#name").val();
              console.log("Model stored!");
              feedback("Model stored!");
            },
            function(error) {
              console.log(error);
              feedback(error);
            });
          }
          else{
            client.sendRequest("PUT", loadedModel, JSON.stringify(data), "application/json", {},
            function(data, type) {
              console.log("Model updated!");
              feedback("Model updated!");
            },
            function(error) {
              console.log(error);
              feedback(error);
            });            
          }
        });
      } else {
        feedback("No model!");
      }
  });
};

// loads the model from a given JSON file and sets it as the space's model
var loadModel = function() {
  if($("#name").val().length == 0){
    feedback("Please choose model name!");
    return;
  }
  // first, clean the current model
  getData("my:ns:model").then(function(modelUris){
    if(modelUris.length > 0){
      _.map(modelUris,function(uri){
        openapp.resource.del(uri);
      });
    }
    // now read in the file content
    modelName = $("#name").val();
    client.sendRequest("GET", modelName, "", "", {},
    function(data, type) {
      console.log("Model loaded!");
      resourceSpace.create({
        relation: openapp.ns.role + "data",
        type: "my:ns:model",
        representation: data,
        callback: function(){
          feedback("Model loaded, please refresh browser!");
        }
      });
    },
    function(error) {
      console.log(error);
      feedback(error);
    });

  });
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

// needed to add attributes to the model
var generateRandomId = function(){
  var chars = "1234567890abcdef";
  var numOfChars = chars.length;
  var i, rand;
  var id = "";
  length = 24;
  for(i = 0; i < length; i++){
      rand = Math.floor(Math.random() * numOfChars);
      id += chars[rand];
  }
  return id;
};

// generates an attribute according to the SyncMeta specification
var generateAttribute = function(name, value){
  var attribute = 
  {
    "name": name,
    "id": "modelAttributes[" + name + "]",
    "value": {
      "name": name,
      "id": "modelAttributes[" + name + "]",
      "value": value
    }
  };
  return attribute;
};

// displays a message in the status box on the screen for the time of "feedbackTimeout"
feedback = function(msg){
    $("#status").val(msg);
    clearTimeout(feedbackTimeout);
    feedbackTimeout = setTimeout(function(){
      $("#status").val("");
    },6000);
};
