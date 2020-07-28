import {LitElement, html} from "lit-element";
import Static from "../static";

/**
 * Widget used to select frontend components or microservices which should be added to the application mashup.
 * This LitElement is part of the Application View.
 * Depending on whether the attribute/property "componentType" is set to "frontend" or "microservice",
 * it lists the frontend components or microservices of the project.
 */
export class ComponentSelectWidget extends LitElement {
  render() {
    return html`

      <!-- Bootstrap stylesheet import -->
      <link href="https://netdna.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css" rel="stylesheet" id="bootstrap-css">
      
      <style>
        :host {
          font-family: Roboto;
        }
        #componentTable tr:hover {
          background-color: #ccc;
        }
        #main-content {
          width:100%;
        }
      </style>
      
      <!-- Container for actual page content -->
      <div id="main-content">
        <table class="table table-striped">
          <tbody id="componentTable">
          </tbody>
        </table>
      </div>
    `;
  }

  static get properties() {
    return {
      client: {
        type: Object
      },
      componentType: {
        type: String
      }
    };
  }

  constructor() {
    super();

    this.requestUpdate().then(_ => {
      const iwcCallback = function(intent) {
        console.log(intent);
      };

      this.client = new Las2peerWidgetLibrary(Static.ProjectManagementServiceURL + "/projects", iwcCallback, '*');

      this.getServices();
    });
  }

  createNode(name, versionedModelId, selectedTag) {
    let data;
    if(this.componentType == "frontend") {
      data = JSON.stringify({
        selectedToolName: "Frontend Component",
        name: name,
        defaultAttributeValues: {
          "93641f72fb49c4f74264a781": versionedModelId,
          "93641f72fb49c4f74264a782": selectedTag,
        }
      });
    } else {
      data = JSON.stringify({
        selectedToolName: "Microservice",
        name: name,
        defaultAttributeValues: {
          "6a4e681cd6b9d6b21e765c46": versionedModelId,
          "6a4e681cd6b9d6b21e765c47": selectedTag,
        }
      });
    }

    const senderWidgetName = this.componentType == "frontend" ? "FRONTEND_COMPONENT_SELECT_WIDGET" : "MICROSERVICE_SELECT_WIDGET";
    this.publishToolSelectIntent(senderWidgetName, data);
  }

  createNodeExtDependency(name, gitHubURL, selectedTag, type) {
    const data = JSON.stringify({
      selectedToolName: "External Dependency",
      name: name,
      defaultAttributeValues: {
        "73641ffrfb50c4fab263a138": gitHubURL,
        "73641ffrfb50c4fab263a139": selectedTag,
        "73641ffrfb50c4fab263a140": type
      }
    });

    this.publishToolSelectIntent("MICROSERVICE_SELECT_WIDGET", data);
  }

  /**
   * Publishes an intent via IWC which tells the Canvas that a new tool should get selected, i.e. a Frontend Component,
   * Microservice or External Dependency.
   * @param senderWidgetName Name of the widget that sends the intent. Either the select widget for frontend components or the one for microservices.
   * @param data Data that should be send, i.e. information on the tool that should get selected.
   */
  publishToolSelectIntent(senderWidgetName, data) {
    const time = new Date().getTime();
    const intent = new IWC.Intent(senderWidgetName, "Canvas", "ACTION_DATA", data, false);
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

      const components = projectComponents.components;
      const dependencyComponents = projectComponents.dependencies.map(dependency => dependency.component);
      const externalDependencies = projectComponents.externalDependencies;

      // get components of the type which is currently shown in the select widget
      // this only works for components and dependencies, but not for external dependencies, because they do not
      // contain a type attribute
      const componentsByType = components.concat(dependencyComponents).filter(c => c.type == this.componentType);
      const externalDependenciesByType = externalDependencies.filter(d => d.type == this.componentType);

      // display components and dependencies
      for(const component of componentsByType) {
        // add table rows
        const name = component.name;
        const versionedModelId = component.versionedModelId;
        const versionTags = component.versions;

        const row = this.createTableRow(name, versionTags, this.createNode.bind(this), "" + versionedModelId);
        this.getTable().appendChild(row);
      }

      // display external dependencies
      // currently, external dependencies can only be microservices
      for(const extDependency of externalDependenciesByType) {
        const gitHubURL = extDependency.gitHubURL;
        const name = gitHubURL.split(".com/")[1];
        const versionTags = extDependency.versions;
        const type = extDependency.type;

        const row = this.createTableRow(name, versionTags, this.createNodeExtDependency.bind(this), gitHubURL, type);
        this.getTable().appendChild(row);
      }
    }.bind(this), function(error) {
      console.log(error);
    });
  };

  /**
   * Helper method to create table row HTML.
   * @param name Name of the component.
   * @param versionTags List containing the version tags which are selectable. Note: Tag "Latest" gets added by this method.
   * @return HTML element of the table row.
   */
  createTableRow(name, versionTags, createNodeFunction, createNodeParam, extDependencyType) {
    const row = document.createElement("tr");
    row.style = "display: flex";

    /*
     * NAME
     */
    const tdName = document.createElement("td");
    tdName.style = "flex: 1; display: flex";

    const pName = document.createElement("p");
    pName.innerText = name;
    pName.style = "margin-top: auto; margin-bottom: auto";

    tdName.appendChild(pName);

    /*
     * VERSION
     */
    const tdVersion = document.createElement("td");
    tdVersion.style = "padding: 0; margin-left: auto; margin-right: 0.5em";

    const paperDropdownMenu = document.createElement("paper-dropdown-menu");
    paperDropdownMenu.setAttribute("label", "Select Version");
    paperDropdownMenu.style = "width: 5em";

    const paperListbox = document.createElement("paper-listbox");
    paperListbox.setAttribute("slot", "dropdown-content");
    paperListbox.setAttribute("selected", "0");

    const latest = document.createElement("paper-item");
    const latestVersionValue = "Latest";
    latest.innerText = latestVersionValue;
    paperListbox.appendChild(latest);

    for (const versionTag of versionTags) {
      const item = document.createElement("paper-item");
      item.innerText = versionTag;
      paperListbox.appendChild(item);
    }

    paperDropdownMenu.appendChild(paperListbox);

    tdVersion.appendChild(paperDropdownMenu);

    row.appendChild(tdName);
    row.appendChild(tdVersion);

    // make row "clickable"
    row.addEventListener("click", function () {
      let selected = paperListbox.selected;
      let selectedTag;
      if (selected == 0) {
        // Version Tag "Latest" got selected
        selectedTag = latestVersionValue;
      } else {
        // the selected version tag is element of the versionTags array
        selected--;
        selectedTag = versionTags[selected];
      }
      createNodeFunction(name, createNodeParam, selectedTag, extDependencyType);
    }.bind(this));

    return row;
  }

  getTable() {
    return this.shadowRoot.getElementById("componentTable");
  }
}

customElements.define('component-select-widget', ComponentSelectWidget);
