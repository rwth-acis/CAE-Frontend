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
    selectedModel = null;

var init = function() {
    var iwcCallback = function(intent) {
        console.log(intent);
    };
    client = new Las2peerWidgetLibrary("@@caehost/CAE/models", iwcCallback);
    getStoredModels();
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
        sourceDir: '@@host/frontendComponentPersistenceWidget/js'
    }).then(function(y) {
        console.info('PERSISTENCE: Yjs successfully initialized');

        $('#delete-model').on('click', function() {
            resetCurrentModel(y);
        });
        $('#store-model').on('click', function() {
            storeModel(y);
        });
        $('#load-model').on('click', function() {
            loadModel(y);
        });
    });

};

// deletes the current model (empties the current model of this space)
var resetCurrentModel = function(y) {
    if (y.share.data.get('model')) {
        y.share.data.set('model', null);
        y.share.canvas.set('ReloadWidgetOperation', 'delete');
        feedback("Done!");
    } else {
        feedback("No model!")
    }
};

// retrieves the JSON representation of this space
var storeModel = function(y) {
    if (y.share.data.get('model')) {
        var data = y.share.data.get('model');
        // add name, version and type to model
        
        //TODO ugly workaround for now
        var modelName = data.attributes.attributes['modelAttributes[name]'].value.value;
        data.attributes.label.value.value = modelName;


        var wireframeModel = y.share.data.get('wireframe');
        if(wireframeModel)
            data.wireframe = wireframeModel;

        if (loadedModel === null) {
            client.sendRequest("POST", "", JSON.stringify(data), "application/json", {},
                function(data, type) {
                    // save currently loaded model
                    loadedModel = modelName;
                    getStoredModels();
                    console.log("Model stored!");
                    feedback("Model with name " + modelName + " stored!");
                },
                function(error) {
                    console.log(error);
                    feedback(error);
                });
        } else {
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
    } else {
        feedback("No model!");
    }
};

// loads the model from a given JSON file and sets it as the space's model
var loadModel = function(y) {
    // first, clean the current model
    y.share.data.set('model', null);

    // now read in the file content
    modelName = $('#model-list option:selected').text();
    client.sendRequest("GET", modelName, "", "", {},
        function(data, type) {
            console.log("Model loaded!");
            y.share.data.set('model', data);
            y.share.canvas.set('ReloadWidgetOperation', 'import');
            feedback("Model loaded, please refresh browser!");
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
// needed to add attributes to the model
var generateRandomId = function() {
    var chars = "1234567890abcdef";
    var numOfChars = chars.length;
    var i, rand;
    var id = "";
    length = 24;
    for (i = 0; i < length; i++) {
        rand = Math.floor(Math.random() * numOfChars);
        id += chars[rand];
    }
    return id;
};

// generates an attribute according to the SyncMeta specification
var generateAttribute = function(name, value) {
    var attribute = {
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
feedback = function(msg) {
    $("#status").val(msg);
    if (msg === "Model updated!") {
        client.sendIntent("MODEL_UPDATED", "", false);
    }
    clearTimeout(feedbackTimeout);
    feedbackTimeout = setTimeout(function() {
        $("#status").val("");
    }, 10000);
};

var getStoredModels = function(){
    client.sendRequest("GET", "", "", "application/json", {},
    function(data, type) {
        var $list = $('#model-list');
        var list = $list.find('option').map(function(){
            return $(this).text();
        }).get().join();

        for(var i=0;i<data.length;i++){
            if(list.indexOf(data[i]) == -1){
                var $entry = $.parseHTML('<option>'+ data[i] +'</option>');
                $list.append($entry);
            }
        }
        feedback("Updated list of available models!");
    },
    function(error) {
        console.error("Not able to get list of stored models from the backend! Check if services are started.");
        feedback("Not able to get list of models from backend! Check if services are started.");
    });
}