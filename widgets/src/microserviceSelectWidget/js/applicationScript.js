var client;
var lastMicroserviceName = null;

$(function() {
    var iwcCallback = function(intent) {
      console.log(intent);
    };
    client = new Las2peerWidgetLibrary("@@caehost/project-management/projects", iwcCallback, '*');

    getServices()
});

function createNode(name, versionedModelId) {
  lastMicroserviceName = name;
  var time = new Date().getTime();
  var data = JSON.stringify({
    selectedToolName: "Microservice",
    name: name,
    defaultAttributeValues: {
      "6a4e681cd6b9d6b21e765c46": versionedModelId,
      "6a4e681cd6b9d6b21e765c47": "TODO",
    }
  });
  var intent = new IWC.Intent("MICROSERVICE_SELECT_WIDGET", "Canvas", "ACTION_DATA", data, false);
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
    const projectMicroservices = projectComponents.filter(component => component.type == "microservice");

    $.each(projectMicroservices, function(index, value) {
      // add table rows
      var name = value.name;
      var version = "TODO";

      $("#microserviceTable").append("<tr id='" + index + "'><td>" + name +
        "</td><td>" + version + "</td></tr>");
    });

    // make table rows "clickable"
    $("#microserviceTable").find("tr").click(function() {
      // get the versioned model id
      var index = $(this).attr("id");
      var versionedModelId = projectMicroservices[index].versionedModelId;
      var name = projectMicroservices[index].name;
      createNode(name, "" + versionedModelId);
    });

  }, function(error) {
    console.log(error);
    $("#microserviceTable").html(error);
  });
};
