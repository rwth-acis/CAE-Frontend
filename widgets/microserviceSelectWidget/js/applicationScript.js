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
// needed to store the last selected microservice (temporary)
// until the iwc callback can be executed (which needs this name)
var lastMicroserviceName;

var init = function() {

  var iwcCallback = function(intent) {
    // catch node creation message to add label to node
    if(intent.extras.payload.data != null && intent.extras.payload.data.type != null 
        && intent.extras.payload.data.type == "insert" && intent.extras.payload.data.value != null 
        && intent.extras.payload.data.name != null && intent.extras.payload.data.name.indexOf("node:") !=-1){
      // TODO: Parse twice...something is not right with the original format it seems..
      var value = $.parseJSON($.parseJSON(intent.extras.payload.data.value));
      if(value.type == "Microservice"){
        var nodeId = intent.extras.payload.data.name.substring(intent.extras.payload.data.name.indexOf("node:")+5);
        client.sendMicroserviceName(lastMicroserviceName, nodeId);
      }
    }
  };

  client = new Las2peerWidgetLibrary("http://localhost:8080/CAE/models", iwcCallback);
}


/**
 * 
 * Calls the persistence service first for a list of services,
 * then retrieves all services and adds all microservices
 * to the microservice table.
 * 
 */
var getServices = function() {
  client.sendRequest("GET", "", "", "application/json", {},
  function(data, type) {
      $.each(data, function(index, value) {
        client.sendRequest("GET", value, "", "application/json", {},
        function(data, type) {
          // add table rows
          var name = data.attributes.label.value.value;
          var type;
          var version;
          $.each(data.attributes.attributes, function(index, value) {
            if(value.name == "version"){
              version = value.value.value;
            }
            if(value.name == "type"){
              type = value.value.value;
            }
          });
          if(type == "microservice"){
          $("#microserviceTable").append("<tr><td>" + name + 
            "</td><td>" + version + "</td></tr>");
          // make table rows "clickable"
          $("#microserviceTable").find("tr").click(function() {
            // get the name
            var name = $(this).find("td").get(0).innerHTML;
            sendMicroserviceNode();
            lastMicroserviceName = name; // used in IWC response
          });
          }
        }, function(error) {
          console.log(error);
          $("#microserviceTable").html(error);
        })
      });
  }, function(error) {
    console.log(error);
    $("#microserviceTable").html(error);
  })
};


/**
 * 
 * Calls the client function that sends a
 * "microservice was selected" signal to SyncMeta.
 * 
 */
var sendMicroserviceNode = function() {
  client.sendMicroserviceSelected();
}


$(document).ready(function() {
  init();
  getServices();
});
