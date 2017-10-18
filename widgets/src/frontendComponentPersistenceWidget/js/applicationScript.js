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
    modelType;

var init = function () {
    var iwcCallback = function (intent) {
        console.log(intent);
    };
    client = new Las2peerWidgetLibrary("@@caehost/CAE/models", iwcCallback);
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
            //syncmeta
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
            //Wireframe editor 
            action: 'Map'
        },
        sourceDir: '@@host/frontendComponentPersistenceWidget/js'
    }).then(function (y) {
        console.info('PERSISTENCE: Yjs successfully initialized');
        var data = y.share.data.get('model');
        if (data) {
            try {
                modelType = data.attributes.attributes['modelAttributes[type]'].value.value;
                var $modelTypeLabel = $('#modelType');
                $modelTypeLabel.empty();
                $modelTypeLabel.text('Persisted ' + modelType + ' models');
            }
            catch (e) {
                feedback('No model type defined in the model attributes');
            }
        }
        //check if the model is loaded from the database
        //we just check if the model attribute label is equal to the model attributes name
        getStoredModels(modelType).done(function (storedModels) {
            feedback("Updated list of available models!");
            var data = y.share.data.get('model');
            if (data) {
                try {
                    var modelName = data.attributes.attributes['modelAttributes[name]'].value.value;
                    if (storedModels.indexOf(modelName) != -1)
                        setLoadedModel(modelName, 'success');
                } catch (e) {
                    feedback('Found model in the space with no name.');
                }
            }
        });

        $('#reset-model').on('click', function () {
            resetCurrentModel(y);
        });
        $('#store-model').on('click', function () {
            storeModel(y);
        });
        $('#load-model').on('click', function () {
            loadModel(y);
        });
        $('#delete-model').click(function () {
            deleteModel();
        });
    });

};

// deletes the current model (empties the current model of this space)
var resetCurrentModel = function (y) {
    if (y.share.data.get('model')) {
        y.share.data.set('model', null);
        y.share.canvas.set('ReloadWidgetOperation', 'delete');

        //reset wireframing editor as well
        y.share.data.set('wireframe', null);
        y.share.action.set('reload', true);
        feedback("Done!");
    } else {
        feedback("No model!");
    }
};

// retrieves the JSON representation of this space
var storeModel = function (y) {
    if (!y.share.data.get('model')) {
        feedback("No model!");
        return;
    }
    addSpinner();
    getStoredModels(modelType).done(function (storedModels) {
        var data = y.share.data.get('model');
        // add name, version and type to model

        //TODO ugly workaround for now
        var modelName = data.attributes.attributes['modelAttributes[name]'].value.value;
        //Check if the model has a name
        if (modelName.length < 1) {
            feedback('Provide a name for the model');
            removeSpinner();
            return;
        }

        var wireframeModel = y.share.data.get('wireframe');
        if (wireframeModel)
            data.wireframe = wireframeModel;
        if (storedModels.indexOf(modelName) == -1) {
            client.sendRequest("POST", "", JSON.stringify(data), "application/json", {},
                function (data, type) {
                    // save currently loaded model
                    setLoadedModel(modelName, 'success');
                    console.log("Model stored!");
                    feedback("Model with name " + modelName + " stored!");
                    getStoredModels(modelType);
                    removeSpinner();
                },
                function (error) {
                    console.log(error);
                    feedback(error);
                    removeSpinner();

                });
        }
        else {
            client.sendRequest("PUT", modelName, JSON.stringify(data), "application/json", {},
                function (data, type) {
                    console.log("Model updated!");
                    feedback("Model updated!");
                    removeSpinner();
                },
                function (error) {
                    console.log(error);
                    feedback(error);
                    removeSpinner();
                });

        }
    });
};

// loads the model from a given JSON file and sets it as the space's model
var loadModel = function (y) {
    // first, clean the current model
    y.share.data.set('model', null);

    // now read in the file content
    var modelName = $('#model-list option:selected').text();
    addSpinner();
    client.sendRequest("GET", modelName, "", "", {},
        function (data, type) {
            console.log("Model loaded!");
            y.share.data.set('model', data);
            if (data.hasOwnProperty("wireframe")) {
                y.share.data.set('wireframe', data.wireframe);
                y.share.action.set('reload', true);
                /*
                $('.widget-title-bar', parent.document).map(function(){
                    var widgetTitle = $(this).find('span').text();
                    if(widgetTitle === 'CAE-WireframingEditor')
                        $('iframe', this.offsetParent)[0].contentWindow.location.reload();
                });*/
            }
            y.share.canvas.set('ReloadWidgetOperation', 'import');
            setLoadedModel(modelName);
            feedback("Model loaded!");
            removeSpinner();
        },
        function (error) {
            console.log(error);
            feedback(error);
            removeSpinner();
        });
};

function deleteModel() {
    addSpinner();
    var modelName = $('#model-list option:selected').text();
    client.sendRequest("DELETE", modelName, "", "", {},
        function (data, type) {
            setLoadedModel("", "default");
            getStoredModels(modelType).done(function (storedModels) {
                if (storedModels.indexOf(modelName) != -1)
                    feedback("Model is still in there! Someting went wrong");
                else feedback("Successfully deleted model!");
                removeSpinner();
            });

        },
        function (error) {
            console.log(error);
            feedback(error);
            removeSpinner();
        });
}

$(document).ready(function () {
    init();
});

/******************* Helper Functions ********************/
// needed to add attributes to the model
var generateRandomId = function () {
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
var generateAttribute = function (name, value) {
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
feedback = function (msg) {
    $("#status").val(msg);
    if (msg === "Model updated!") {
        client.sendIntent("MODEL_UPDATED", "", false);
    }
    clearTimeout(feedbackTimeout);
    feedbackTimeout = setTimeout(function () {
        $("#status").val("");
    }, 10000);
};

var getStoredModels = function (modelType) {
    var deferred = $.Deferred();
    var successFnc = function (data, type) {
        var $list = $('#model-list');
        $list.empty();

        for (var i = 0; i < data.length; i++) {
            var $entry = $.parseHTML('<option>' + data[i] + '</option>');
            $list.append($entry);
        }
        deferred.resolve(data);
    };
    var errorFnc = function (error) {
        console.error("Not able to get list of stored models from the backend! Check if services are started.");
        feedback("Not able to get list of models from backend! Check if services are started.");
    };

    if (modelType && modelType.length > 0)
        client.sendRequest("GET", "type/" + modelType, "", "application/json", {}, successFnc, errorFnc);
    else
        client.sendRequest("GET", "", "", "application/json", {}, successFnc, errorFnc);
    return deferred.promise();
}

var setLoadedModel = function (loaded, style) {
    if (!style)
        style = 'info';
    var $label = $.parseHTML('<span id="loaded-model" class="label label-' + style + '">' + loaded + '</span></h4>');
    var $info = $('#loaded-model-info');
    $info.empty();
    $info.text("Loaded Model:").append($label);
}

var addSpinner = function () {
    $('#status-container').prepend($.parseHTML('<div class="loader"></div>'));
}

var removeSpinner = function () {
    $('.loader').remove();
}