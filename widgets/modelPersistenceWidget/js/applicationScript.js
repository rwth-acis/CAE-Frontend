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
    feedbackTimeout;

var init = function() {
  var iwcCallback = function(intent) {
    console.log(intent);
  };
  client = new Las2peerWidgetLibrary("http://localhost:8080/CAE/models", iwcCallback);

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
  $("#model-name").val("");
  $("#additional1-name").val("");
  $("#additional2-name").val("");
  $("#additional3-name").val("");
  $("#additional1-value").val("");
  $("#additional2-value").val("");
  $("#additional3-value").val("");
  getData("my:ns:model").then(function(modelUris){
    if(modelUris.length > 0){
      _.map(modelUris,function(uri){
        openapp.resource.del(uri,function(){
          feedback("Model Reset, please refresh browser!");
        });
      });
    } else {
      feedback("No Model!");
    }
  });
};

// retrieves the JSON representation of this space
var storeModel = function() {
  if($("#model-name").val().length == 0){
    feedback("Please choose model name!");
    return;
  }
  getData("my:ns:model").then(function(modelUris){
      if(modelUris.length > 0){
        $.get(modelUris[0]+"/:representation").done(function(data){
          data.attributes.label.value.value = $("#model-name").val();
          // add three attributes (mainly for testing reasons), if name is blank, they will be ignored
          if($("#additional1-name").val().length != 0){
            data.attributes.attributes[generateRandomId()] = generateAttribute($("#additional1-name").val(), $("#additional1-value").val());
          }
          if($("#additional2-name").val().length != 0){
            data.attributes.attributes[generateRandomId()] = generateAttribute($("#additional2-name").val(), $("#additional2-value").val());
          }
          if($("#additional3-name").val().length != 0){
            data.attributes.attributes[generateRandomId()] = generateAttribute($("#additional3-name").val(), $("#additional3-value").val());
          }

          client.sendRequest("POST", "", JSON.stringify(data), "application/json", {},
          function(data, type) {
          console.log("Model stored!");
          feedback("Model stored!");
          },
          function(error) {
            console.log(error);
            feedback("Error saving model!");
          });
        });
      } else {
        feedback("No Model!");
      }
  });
};

// loads the model from a given JSON file and sets it as the space's model
var loadModel = function() {
  if($("#model-name").val().length == 0){
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
    modelName = $("#model-name").val();
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
      feedback("Error loading model!");
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

// displays a <p> element on the screen for the time of "feedbackTimeout"
feedback = function(msg){
    var oldValue = $("#model-name").val();
    $("#model-name").val(msg);
    clearTimeout(feedbackTimeout);
    feedbackTimeout = setTimeout(function(){
      $("#model-name").val(oldValue);
    },4000);
};
