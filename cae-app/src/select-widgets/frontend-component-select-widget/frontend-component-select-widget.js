import {LitElement, html} from "lit-element";
import Static from "../../static";

/**
 * Widget used to select frontend components which should be added to the application mashup.
 * This LitElement is part of the Application View.
 */
export class FrontendComponentSelectWidget extends LitElement {
  render() {
    return html`

      <!-- Bootstrap stylesheet import -->
      <link href="https://netdna.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css" rel="stylesheet" id="bootstrap-css">
      
      <style>
        :host {
          font-family: Roboto;
        }
        #frontendComponentTable tr:hover {
          background-color: #ccc;
        }
        #main-content {
          width:100%;
        }
      </style>
      
      <!-- Container for actual page content -->
      <div id="main-content">
        <table class="table table-striped">
          <tbody id="frontendComponentTable">
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
      selectedToolName: "Frontend Component",
      name: name,
      defaultAttributeValues: {
        "93641f72fb49c4f74264a781": versionedModelId,
        "93641f72fb49c4f74264a782": "TODO",
      }
    });
    const intent = new IWC.Intent("FRONTEND_COMPONENT_SELECT_WIDGET", "Canvas", "ACTION_DATA", data, false);
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
      const projectFrontendComponents = projectComponents.filter(component => component.type == "frontend");

      let index = 0;
      for(const frontendComponent of projectFrontendComponents) {
        // add table rows
        const name = frontendComponent.name;
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
          const versionedModelId = projectFrontendComponents[i].versionedModelId;
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
    return this.shadowRoot.getElementById("frontendComponentTable");
  }
}

customElements.define('frontend-component-select-widget', FrontendComponentSelectWidget);
