import {LitElement, html} from "lit-element";
import Static from "../../static";

/**
 * Widget used to select microservices which should be added to the application mashup.
 * This LitElement is part of the Application View.
 */
export class MicroserviceSelectWidget extends LitElement {
  render() {
    return html`

      <!-- Bootstrap stylesheet import -->
      <link href="https://netdna.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css" rel="stylesheet" id="bootstrap-css">

      <style>
        :host {
          font-family: Roboto;
        }
        #microserviceTable tr:hover {
          background-color: #ccc;
        }

        #main-content {
          width:100%;
        }
      </style>
      <!-- Container for actual page content -->
      <div id="main-content">
        <table class="table table-striped">
          <tbody id="microserviceTable">
          </tbody>
        </table>
      </div>
    `;
  }

  static get properties() {
    return {
      client: {
        type: Object
      }
    };
  }

  constructor() {
    super();
    const iwcCallback = function(intent) {
      console.log(intent);
    };

    this.client = new Las2peerWidgetLibrary(Static.ProjectManagementServiceURL + "/projects", iwcCallback, '*');

    this.getServices();
  }

  createNode(name, versionedModelId) {
    const time = new Date().getTime();
    const data = JSON.stringify({
      selectedToolName: "Microservice",
      name: name,
      defaultAttributeValues: {
        "6a4e681cd6b9d6b21e765c46": versionedModelId,
        "6a4e681cd6b9d6b21e765c47": "TODO",
      }
    });
    const intent = new IWC.Intent("MICROSERVICE_SELECT_WIDGET", "Canvas", "ACTION_DATA", data, false);
    intent.extras = {"payload":{"data":{"data":data,"type":"ToolSelectOperation"}, "sender":null, "type":"NonOTOperation"}, "time":time};
    this.client.iwcClient.publish(intent);
  }

  /**
   *
   * Calls the project-management service first for a list of components,
   * then retrieves all components and adds all frontend components
   * to the frontend component table.
   *
   */
  getServices() {
    const modelingInfo = JSON.parse(localStorage.getItem("modelingInfo"));
    const currentProjectId = modelingInfo.application.projectId;

    this.client.sendRequest("GET", currentProjectId + "/components", "", "application/json", {}, false, function(data, type) {
      const projectComponents = JSON.parse(data);
      const projectMicroservices = projectComponents.filter(component => component.type == "microservice");

      let index = 0;
      for(const microservice of projectMicroservices) {
        // add table rows
        const name = microservice.name;
        const version = "TODO";

        const row = document.createElement("tr");
        row.id = "" + index;

        const tdName = document.createElement("td");
        tdName.innerText = name;

        const tdVersion = document.createElement("td");
        tdVersion.innerText = version;

        row.appendChild(tdName);
        row.appendChild(tdVersion);

        // make row "clickable"
        const i = index;
        row.addEventListener("click", function() {
          const versionedModelId = projectMicroservices[i].versionedModelId;
          this.createNode(name, "" + versionedModelId);
        }.bind(this));

        this.getTable().appendChild(row);

        index++;
      }
    }.bind(this), function(error) {
      console.log(error);
    });
  };

  getTable() {
    return this.shadowRoot.getElementById("microserviceTable");
  }
}

customElements.define('microservice-select-widget', MicroserviceSelectWidget);
