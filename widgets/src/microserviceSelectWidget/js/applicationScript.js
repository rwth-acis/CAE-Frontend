var client;
var lastMicroserviceName = null;

$(function() {
    var iwcCallback = function(intent) {
      console.log(intent);
    };
    client = new Las2peerWidgetLibrary("@@caehost/project-management/projects", iwcCallback, '*');

    getServices()
});

function createNode(name, version) {
  lastMicroserviceName = name;
  var time = new Date().getTime();
  var data = JSON.stringify({selectedToolName: "Microservice", name: name, version: version});
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

      $("#microserviceTable").append("<tr><td>" + name +
        "</td><td>" + version + "</td></tr>");
      // make table rows "clickable"
      $("#microserviceTable").find("tr").click(function() {
        // get the name
        var name = $(this).find("td").get(0).innerHTML;
        createNode(name);
      });
    });

  }, function(error) {
    console.log(error);
    $("#microserviceTable").html(error);
  });
};
