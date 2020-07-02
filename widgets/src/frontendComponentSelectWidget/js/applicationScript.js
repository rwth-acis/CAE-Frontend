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
 var lastName = null;

 $(function() {
     var iwcCallback = function(intent) {
       console.log(intent);
     };

     client = new Las2peerWidgetLibrary("@@caehost/project-management/projects", iwcCallback, '*');

     getServices()
 });

 function createNode(name) {
   lastName = name;
   var time = new Date().getTime();
   var data = JSON.stringify({selectedToolName: "Frontend Component", name: name});
   var intent = new IWC.Intent("FRONTEND_COMPONENT_SELECT_WIDGET", "Canvas", "ACTION_DATA", data, false);
   intent.extras = {"payload":{"data":{"data":data,"type":"ToolSelectOperation"}, "sender":null, "type":"NonOTOperation"}, "time":time}
   client.iwcClient.publish(intent);
 }


/**
 *
 * Calls the project-management service first for a list of components,
 * then retrieves all components and adds all frontend components
 * to the frontend component table.
 *
 */
var getServices = function() {
  const modelingInfo = JSON.parse(localStorage.getItem("modelingInfo"));
  const currentProjectId = modelingInfo.application.projectId;

  client.sendRequest("GET", currentProjectId + "/components", "", "application/json", {}, false, function(data, type) {
    const projectComponents = JSON.parse(data);
    const projectFrontendComponents = projectComponents.filter(component => component.type == "frontend");

    $.each(projectFrontendComponents, function(index, value) {
      // add table rows
      var name = value.name;
      var version = "TODO";

      $("#frontendComponentTable").append("<tr id='" + index + "'><td>" + name +
        "</td><td>" + version + "</td></tr>");
    });

    // make table rows "clickable"
    $("#frontendComponentTable").find("tr").click(function() {
      // get the versioned model id
      var index = $(this).attr("id");
      var versionedModelId = projectFrontendComponents[index].versionedModelId;
      createNode("" + versionedModelId);
    });

  }, function(error) {
    console.log(error);
    $("#frontendComponentTable").html(error);
  });
};
