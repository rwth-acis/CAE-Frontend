import {LitElement, html} from "lit-element";
import Static from "../static";
import Common from "../util/common";
import Auth from "../util/auth";

/**
 * Widget used to display requirements of a given category in the Requirements Bazaar.
 * Uses settings (project id and category id) from localStorage.
 */
export class RequirementsBazaarWidget extends LitElement {
  render() {
    return html`
      <style>
        .separator {
          border-top: thin solid #e1e1e1;
        }
        .actionButton {
          color: #1E90FF
        }
        .actionButton:hover {
          color: #3b5fcc;
        }
      </style>
      
      <div id="main" style="margin-left: 0.5em; margin-right: 0.5em">
        <h3 style="margin-top: 0.5em; margin-bottom: 0.5em">Requirements Bazaar</h3>
        <div id="requirements-list-container">
          <p style="margin-top: 0.5em">This widget is connected to <span id="project-link"></span>.</p>
          <div id="requirements-list" class="col s12">
        
          </div>
        </div>
        <div id="not-connected" style="display: none">
          <p style="margin-top: 0.5em">This component is not connected to any category in the Requirements Bazaar.</p>
        </div>
      </div>
    `;
  }

  static get properties() {
    return {
      client: { type: Object },
      selectedProjectId: { type: Number },
      selectedCategoryId: { type: Number },
      localStorageKey: { type: String },
      refreshRequirementsIntervalHandle: { type: Object },
      currentlyOpenedRequirementId: { type: Number }
    };
  }

  constructor() {
    super();
    this.localStorageKey = "requirements-bazaar-widget";

    const iwcCallback = function (intent) {
      console.log(intent);
    };
    this.client = new Las2peerWidgetLibrary(Static.ReqBazBackend, iwcCallback, '*');

    this.requestUpdate().then(_ => {
      this.loadConnectedProject();
      if (this.selectedProjectId != -1 && this.selectedCategoryId != -1) {
        this.onProjectConnected();
      } else {
        this.onProjectDisconnected();
      }
    });
  }

  /**
   * Loads the information about the Requirements Bazaar category which is
   * connected to the CAE. This information gets stored to localStorage
   * when the user selects a component in the project-management.
   */
  loadConnectedProject() {
    const storageEntryString = localStorage.getItem(this.localStorageKey);
    if (storageEntryString) {
      let storageEntry = JSON.parse(storageEntryString);
      storageEntry = storageEntry[localStorage.getItem("versionedModelId")];
      this.selectedProjectId = storageEntry.selectedProjectId;
      this.selectedCategoryId = storageEntry.selectedCategoryId;
    }
  }

  /**
   * Gets called when the Requirements Bazaar category stored in
   * localStorage could be loaded successfully.
   */
  onProjectConnected() {
    this.getRequirementsListContainerElement().style.removeProperty("display");
    this.getProjectLinkElement().innerHTML = `<a href="${Static.ReqBazFrontend}/projects/${this.selectedProjectId}/categories/${this.selectedCategoryId}" target="_blank">this category</a>`;
    this.refreshRequirements();
    this.refreshRequirementsIntervalHandle = setInterval(this.refreshRequirements.bind(this), 10000);
  }

  onProjectDisconnected() {
    this.getRequirementsListContainerElement().style.setProperty("display", "none");
    this.getProjectLinkElement().innerHTML = "";
    clearInterval(this.refreshRequirementsIntervalHandle);
    this.getNotConnectedElement().style.removeProperty("display");
  }

  /**
   * Reloads the requirements by sending a request to the
   * Requirements Bazaar API.
   */
  refreshRequirements() {
    console.log("refreshRequirements called");
    if (this.selectedProjectId && this.selectedCategoryId) {
      this.client.sendRequest("GET", "categories/" + encodeURIComponent(this.selectedCategoryId) + "/requirements",
        "", "application/json", Auth.getAuthHeader(), false,
        function (data, type) {
          this.renderRequirements(data);
        }.bind(this),
        function(error) {
          this.onProjectDisconnected();
        }.bind(this));
    }
  }

  renderRequirements(requirements) {
    console.log("render requirements called");
    const requirementsList = this.getRequirementsListElement();
    while(requirementsList.firstChild) requirementsList.removeChild(requirementsList.firstChild);
    requirements.forEach(function (requirement) {
      requirementsList.appendChild(this.renderRequirement(requirement));
    }.bind(this));
  }

  renderRequirement(requirement) {
    const requirementHTML = document.createElement("div");
    requirementHTML.style.setProperty("margin-bottom", "6px");

    const separator = document.createElement("div");
    separator.setAttribute("class", "separator");
    requirementHTML.appendChild(separator);

    /*
     * Name of requirement.
     */
    const requirementName = document.createElement("p");
    requirementName.style.setProperty("font-weight", "bold");
    requirementName.style.setProperty("margin-bottom", "0");
    requirementName.innerText = requirement.name;
    requirementHTML.appendChild(requirementName);

    /*
     * Created by
     */
    const createdBy = document.createElement("p");
    createdBy.style.setProperty("margin-top", "2px");
    createdBy.style.setProperty("margin-bottom", "0");
    createdBy.style.setProperty("color", "#838383");
    createdBy.innerText = "Created by " + requirement.creator.userName;
    requirementHTML.appendChild(createdBy);

    /*
     * Requirement description
     */
    const requirementDescription = document.createElement("p");
    requirementDescription.style.setProperty("margin-top", "2px");
    requirementDescription.style.setProperty("margin-bottom", "4px");
    requirementDescription.innerText = requirement.description;
    requirementHTML.appendChild(requirementDescription);

    /*
     * Button "View"
     */
    const viewButton = document.createElement("a");
    viewButton.setAttribute("class", "actionButton");
    viewButton.innerText = "View";
    viewButton.addEventListener("click", function() {
      const url = Static.ReqBazFrontend + "/projects/" + this.selectedProjectId + "/categories/" + this.selectedCategoryId + "/requirements/" + requirement.id;
      window.open(url);
    }.bind(this));

    /*
     * Button "Done/Reopen"
     */
    const actionButton = document.createElement("a");
    actionButton.setAttribute("class", "actionButton");
    if(this.isAnonymous()) {
      actionButton.setAttribute("disabled", "true");
    }
    actionButton.setAttribute("data-requirement-id", requirement.id);

    const requirementId = requirement.id;
    let method;
    if (Object.keys(requirement).includes("realized")) {
      actionButton.innerText = "Reopen";
      method = "DELETE";
    } else {
      actionButton.innerText = "Done";
      method = "POST";
    }

    // click listener for "done"/"reopen" button
    actionButton.addEventListener("click", function() {
      this.client.sendRequest(method, "requirements/" + encodeURIComponent(requirementId) + "/realized",
        "", "application/json", Auth.getAuthHeader(), false,
        function (data, type) {
          this.refreshRequirements();
        }.bind(this),
        console.error)
    }.bind(this));

    actionButton.style.setProperty("margin-left", "0.5em");


    /*
     * Div for buttons
     */
    const divButtons = document.createElement("div");
    divButtons.style.setProperty("display", "flex");
    divButtons.appendChild(viewButton);
    divButtons.appendChild(actionButton);

    requirementHTML.appendChild(divButtons);

    return requirementHTML;

    /*return `<li data-requirement-id="${requirement.id}" ${this.currentlyOpenedRequirementId == requirement.id ? 'class="active"' : ''}>
      <div class="collapsible-header" style="font-weight: bold">${requirement.name}</div>
      <div class="collapsible-body" style="padding-left: 0; padding-right: 0;">
        <p style="margin-left: 24px;margin-right: 24px; margin-bottom: 24px">${requirement.description}</p>
        <div class="" style="margin-bottom: 0; border-top: 1px solid rgba(160,160,160,0.2); padding-top: 16px;">
            <a class="waves-effect waves-teal btn-flat teal-text done" target="_blank" 
            href="${Static.ReqBazFrontend}/projects/${this.selectedProjectId}/categories/${this.selectedCategoryId}/requirements/${requirement.id}" >View</a>
    ${actionButton}
    </div>
    </div>
    </li>`;*/
  }

  isAnonymous() {
    return !Auth.isAccessTokenAvailable();
  }

  clearIntervals() {
    clearInterval(this.refreshRequirementsIntervalHandle);
  }

  getNotConnectedElement() {
    return this.shadowRoot.getElementById("not-connected");
  }

  getProjectLinkElement() {
    return this.shadowRoot.getElementById("project-link");
  }

  getRequirementsListElement() {
    return this.shadowRoot.getElementById("requirements-list");
  }

  getRequirementsListContainerElement() {
    return this.shadowRoot.getElementById("requirements-list-container");
  }
}

customElements.define('requirements-bazaar-widget', RequirementsBazaarWidget);
