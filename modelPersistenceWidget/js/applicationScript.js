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

var client;
// some variables and small helper functions
var resourceSpace = new openapp.oo.Resource(openapp.param.space()),
    feedbackTimeout,
    feedback = function(msg){
        $("#feedback").text(msg);
        clearTimeout(feedbackTimeout);
        feedbackTimeout = setTimeout(function(){
          $("#feedback").text("");
        },2000);
    };

var init = function() {
  var iwcCallback = function(intent) {
    console.log(intent);
  };
  client = new Las2peerWidgetLibrary("http://localhost:8080/CAE/models", iwcCallback);

  $('#delete-model').on('click', function() {
    deleteModel();
  })
  $('#export-model').on('click', function() {
    exportModel();
  })
  $('#import-model').on('click', function() {
    importModel();
  })
}

// deletes the current model (empties the current model of this space)
var deleteModel = function() {
  getData("my:ns:model").then(function(modelUris){
    if(modelUris.length > 0){
      _.map(modelUris,function(uri){
        openapp.resource.del(uri,function(){
          feedback("Done!");
        });
      });
    } else {
      feedback("No Model!");
    }
  });
};

// retrieves the JSON representation of this space
var exportModel = function() {
  getData("my:ns:model").then(function(modelUris){
      if(modelUris.length > 0){
        $.get(modelUris[0]+"/:representation").done(function(data){
          data.attributes.label.value.value = $("#modelName").val();
          client.sendRequest("POST", "", JSON.stringify(data), "application/json", {},
          function(data, type) {
          var link = document.createElement('a');
          link.download = "export.json";
          link.href = 'data:,'+encodeURI(JSON.stringify(data,null,4));
          link.click();
            console.log("stored");
          },
          function(error) {
            console.log(error);
            feedback("Error saving model!");
          })
        });
      } else {
        feedback("No Model!");
      }
  });
};

// loads the model from a given JSON file and sets it as the space's model
var importModel = function() {
  // first, clean the current model
  getData("my:ns:model").then(function(modelUris){
    if(modelUris.length > 0){
      _.map(modelUris,function(uri){
        openapp.resource.del(uri);
      });
    }
    // now read in the file content
    getFileContent().then(function(data){
      resourceSpace.create({
        relation: openapp.ns.role + "data",
        type: "my:ns:model",
        representation: data,
        callback: function(){
          feedback("Done!");
        }
      });
    });
  });
};

$(document).ready(function() {
  init();
});

/******************* Helper Functions */////////////////////////////

// read in JSON file, will be deleted in future, just for testing purposes
var getFileContent = function(){
  var fileReader,
      files = $("#file-object")[0].files,
      file,
      deferred = $.Deferred();

  if (!files || files.length === 0) deferred.resolve([]);
  file = files[0];

  fileReader = new FileReader();
  fileReader.onload = function (e) {
    var data = e.target.result;
    try {
      data = JSON.parse(data);
    } catch (e){
      data = [];
    }
    deferred.resolve(data);
  };
  fileReader.readAsText(file);
  return deferred.promise();
};

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
