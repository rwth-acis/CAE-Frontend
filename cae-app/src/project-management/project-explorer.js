import {html, LitElement} from 'lit-element';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-dialog/paper-dialog.js';
import Auth from "../auth";
import Static from "../static";

/**
 * PolymerElement for management of projects.
 * TODO: Update Documentation when functionality of this element is final.
 * This element allows listing the projects that the current user is part of.
 * It also allows creating new projects, searching for existing ones, joining projects
 * and enter the modeling in a project.
 */
class ProjectExplorer extends LitElement {
  render() {
    return html`
      <style>
        .main {
          width: 100%;
          margin-top: 1em;
        }
        paper-button {
          color: rgb(240,248,255);
          background: rgb(30,144,255);
          max-height: 50px;
        }
        .button-create-project {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        paper-button:hover {
          color: rgb(240,248,255);
          background: rgb(65,105,225);
        }
        paper-button[disabled] {
          background: #e1e1e1;
        }
        .explorer-top-menu {
          display: flex;
          align-items: center;
        }
        .input-search-project {
          border-radius: 3px;
          border: thin solid #e1e1e1;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          margin-left: auto;
          height: 2.5em;
          padding-left:5px;
        }
        /* Set outline to none, otherwise the border color changes when clicking on input field. */
        .input-search-project:focus {
          outline: none;
        }
        .project-item-card {
          display: flex;
          width: 100%;
          margin-top: 1em;
        }
        .project-item-card:hover {
          background: #eeeeee;
        }
        .project-item-card-content {
          width: 100%;
          height: 100%;
          align-items: center;
          display: flex;
        }
        .project-item-name {
          margin-left: 1em;
          margin-top: 1em;
          margin-bottom: 1em;
        }
        .project-item-user-list {
          margin: 1em 1em 1em 0.5em;
        }
        .green-dot {
          background-color: #c5e686;
          height: 0.8em;
          width: 0.8em;
          border-radius: 50%;
          display: inline-block;
          margin-left: auto;
        }
      </style>
      <div class="main">
        <div class="explorer-top-menu">
          <paper-button class="button-create-project" @click="${this._onCreateProjectButtonClicked}">Create Project</paper-button>
          <input class="input-search-project" @input="${(e) => this._onSearchInputChanged(e.target.value)}" 
              placeholder="Search Projects"></input>
        </div>
        ${this.listedProjects.map(project => html`
            <paper-card class="project-item-card" @click="${() => this._onProjectItemClicked(project.id)}">
              <div class="project-item-card-content">
                <p class="project-item-name">${project.name}</p>
                ${this.getListOfProjectOnlineUsers(project.id) ? html`<span class="green-dot"></span>` : html``}
                <p class="project-item-user-list">${this.getListOfProjectOnlineUsers(project.id)}</p>
              </div>
            </paper-card>
        `)}
      </div>
      
      <!-- Dialog for creating new projects. -->
      <paper-dialog id="dialog-create-project">
        <h2>Create a Project</h2>
        
        <paper-input id="input-project-name" @input="${(e) => this._onInputProjectNameChanged(e.target.value)}" 
            placeholder="Project Name"></paper-input>
        
        <div>
          <paper-button @click="${this._closeCreateProjectDialogClicked}">Cancel</paper-button>
          <paper-button id="dialog-button-create" @click="${this._createProject}">Create</paper-button>
        </div>
      </paper-dialog>
      
      <!-- Toasts -->
      <!-- Toast for successful creation of project -->
      <paper-toast id="toast-success" text="Project created!"></paper-toast>
      
      <!-- Toast for creation fail because of project with same name already existing -->
      <custom-style><style is="custom-style">
        #toast-already-existing {
          --paper-toast-background-color: red;
          --paper-toast-color: white;
        }
      </style></custom-style>
      <paper-toast id="toast-already-existing" text="A project with the given name already exists!"></paper-toast>
    `;
  }

  static get properties() {
    return {
      listedProjects: {
        type: Array
      }
    }
  }

  constructor() {
    super();
    this.listedProjects = [];
    this.loadUsersProjects();
  }

  /**
   * Loads the projects that the user is part from.
   */
  loadUsersProjects() {
    fetch(Static.ProjectManagementServiceURL + "/projects", {
      method: "GET",
      headers: Auth.getAuthHeader()
    }).then(response => {
      if(!response.ok) throw Error(response.status);
      return response.json();
    }).then(data => {
      this.listedProjects = data;
    }).catch(error => {
      if(error.message == "401") {
        // user is not authorized
        // maybe the access token has expired
        Auth.removeAuthDataFromLocalStorage();
        location.reload();
      } else {
        console.log(error);
      }
    });
  }

  getProjectById(id) {
    return this.listedProjects.find(x => x.id == id);
  }

  /**
   * Gets called by the "Create Project" button.
   * Opens the dialog for creating a project, which then
   * lets the user select a name for the project that should
   * be created.
   * @private
   */
  _onCreateProjectButtonClicked() {
    this.shadowRoot.getElementById("dialog-create-project").open();
    // disable create button until user entered a project name
    this.shadowRoot.getElementById("dialog-button-create").disabled = true;
  }

  /**
   * Gets called when the user changes the input of the project name input field
   * in the create project dialog.
   * @param projectName Input
   * @private
   */
  _onInputProjectNameChanged(projectName) {
    if(projectName) {
      this.shadowRoot.getElementById("dialog-button-create").disabled = false;
    } else {
      this.shadowRoot.getElementById("dialog-button-create").disabled = true;
    }
  }

  /**
   * Gets called when the search input gets updated by the user.
   * @param searchInput Input from the user entered in the input field for searching projects.
   * @private
   */
  _onSearchInputChanged(searchInput) {
    if(searchInput) {
      // clear projects that are currently shown
      this.listedProjects = [];
      // use API to search for projects
      fetch(Static.ProjectManagementServiceURL + "/projects/" + searchInput)
        .then(response => {
          if(!response.ok) throw Error(response.status);
          return response.json();
        }).then(data => {
          this.listedProjects = data;
        }).catch(error => {
          console.log(error);
        });
    } else {
      // no search input, so show projects where the user is part of again
      this.loadUsersProjects();
    }
  }

  /**
   * Get called when the user click on "create" in the
   * create project dialog.
   */
  _createProject() {
    const projectName = this.shadowRoot.getElementById("input-project-name").value;
    if(projectName) {
      fetch(Static.ProjectManagementServiceURL + "/projects", {
        method: "POST",
        headers: Auth.getAuthHeader(),
        body: JSON.stringify({
          "name": projectName
        })
      }).then(response => {
        // close dialog
        this._closeCreateProjectDialogClicked();

        if(response.status == 201) {
          // project got created successfully
          this.shadowRoot.getElementById("toast-success").show();

          // clear input field for project name in the dialog
          this.shadowRoot.getElementById("input-project-name").value = "";

          // since a new project exists, reload projects from server
          this.loadUsersProjects();
        } else if(response.status == 409) {
          // a project with the given name already exists
          this.shadowRoot.getElementById("toast-already-existing").show();
        } else if(response.status == 401) {
          Auth.removeAuthDataFromLocalStorage();
          location.reload();
        }
        // TODO: check what happens when access_token is missing in localStorage
      });
    }
  }

  /**
   * Gets called when the user clicks on the
   * "Close" button in the create project dialog.
   * @private
   */
  _closeCreateProjectDialogClicked() {
    this.shadowRoot.getElementById("dialog-create-project").close();

    // clear input field for project name in the dialog
    this.shadowRoot.getElementById("input-project-name").value = "";
  }

  /**
   * Gets called when the user clicks on a project in the project explorer.
   * Fires an event that notifies the parent element (ProjectManagement page)
   * that a project got selected.
   * From there it then gets send to the project user widget.
   * @param projectId Id of the project that got selected in the explorer.
   * @private
   */
  _onProjectItemClicked(projectId) {
    let event = new CustomEvent("project-selected-event", {
      detail: {
        message: "Selected project in project explorer.",
        project: this.getProjectById(projectId)
      }
    });
    this.dispatchEvent(event);
  }

  /**
   * TODO: check which users are really online in the project.
   * @param projectId
   */
  getListOfProjectOnlineUsers(projectId) {
    // only some test data for now
    if(projectId == 1) return "Alice Lastname, Bob Lastname and 2 more";
    if(projectId == 2) return "Chris Lastname";
    else return undefined;
  }
}

customElements.define('project-explorer', ProjectExplorer);
