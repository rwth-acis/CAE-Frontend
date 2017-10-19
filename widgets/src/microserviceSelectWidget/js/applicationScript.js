var client;
var lastMicroserviceName = null;

$(function () {
  var spaceTitle = frameElement.baseURI.substring(frameElement.baseURI.lastIndexOf('/') + 1);
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
      text: "Text"
    },
    sourceDir: '@@host/microserviceSelectWidget/js'
  }).then(function (y) {
    syncmeta.init(y);
    syncmeta.onNodeAdd(function (event) {
      if (lastMicroserviceName != null) {
        window.setTimeout(function () {
          console.log(event)
          syncmeta.setAttributeValue(event.id, event.id + '[label]', lastMicroserviceName);
          lastMicroserviceName = null;
        }, 100)
      }
    });

    client = new Las2peerWidgetLibrary("@@caehost/CAE/models");

    getServices()
  });
});

function createNode(name) {
  lastMicroserviceName = name;
  client.sendMicroserviceSelected()
}

/**
 *
 * Calls the persistence service first for a list of services,
 * then retrieves all services and adds all microservices
 * to the microservice table.
 *
 */
var getServices = function () {
  client.sendRequest("GET", "", "", "application/json", {},
    function (data, type) {
      $.each(data, function (index, value) {
        client.sendRequest("GET", value, "", "application/json", {},
          function (data, type) {
            // add table rows
            var name = data.attributes.label.value.value;
            var type;
            var version;
            $.each(data.attributes.attributes, function (index, value) {
              if (value.name == "version") {
                version = value.value.value;
              }
              if (value.name == "type") {
                type = value.value.value;
              }
            });
            if (type == "microservice") {
              $("#microserviceTable").append("<tr><td>" + name +
                "</td><td>" + version + "</td></tr>");
              // make table rows "clickable"
              $("#microserviceTable").find("tr").click(function () {
                // get the name
                var name = $(this).find("td").get(0).innerHTML;
                createNode(name);
              });
            }
          }, function (error) {
            console.log(error);
            $("#microserviceTable").html(error);
          })
      });
    }, function (error) {
      console.log(error);
      $("#microserviceTable").html(error);
    })
};
