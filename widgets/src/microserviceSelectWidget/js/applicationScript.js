var client;
var lastMicroserviceName = null;

$(function() {
    var iwcCallback = function(intent) {
      console.log(intent);
    };
    client = new Las2peerWidgetLibrary("@@caehost/CAE/models", iwcCallback, '*');

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
 * Calls the persistence service first for a list of services,
 * then retrieves all services and adds all microservices
 * to the microservice table.
 *
 */
var getServices = function() {
  client.sendRequest("GET", "", "", "application/json", {}, false,
  function(data, type) {
      $.each(data, function(index, value) {
        client.sendRequest("GET", value, "", "application/json", {}, false,
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
            var version = $(this).find("td").get(1).innerHTML;
            createNode(name, version);
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
