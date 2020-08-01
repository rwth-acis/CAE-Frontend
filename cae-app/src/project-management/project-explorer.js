import {html, LitElement} from 'lit-element';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-spinner/paper-spinner-lite.js';
import Auth from "../util/auth";
import Static from "../static";
import Common from "../util/common";

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
        .paper-button-blue {
          color: rgb(240,248,255);
          background: rgb(30,144,255);
          max-height: 50px;
        }
        .button-create-project {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .paper-button-blue:hover {
          color: rgb(240,248,255);
          background: rgb(65,105,225);
        }
        .paper-button-blue[disabled] {
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
        .github-a {
          margin-top: auto;
          margin-bottom: auto;
          margin-right: 1em;
        }
        .github-img {
          width: 1.5em;
          height: 1.5em;
        }
        paper-tabs {
          --paper-tabs-selection-bar-color: rgb(30,144,255);
        }
      </style>
      <div class="main">
        <div class="explorer-top-menu">
          <paper-button class="button-create-project paper-button-blue" @click="${this._onCreateProjectButtonClicked}">Create Project</paper-button>
          <input class="input-search-project" @input="${(e) => this._onSearchInputChanged(e.target.value)}" 
              placeholder="Search Projects"></input>
        </div>
        <div>
          <paper-tabs id="my-and-all-projects" selected="0">
            <paper-tab @click="${() => this._onTabChanged(0)}">My Projects</paper-tab>
            <paper-tab @click="${() => this._onTabChanged(1)}">All Projects</paper-tab>
          </paper-tabs>
        </div>
        <!-- show spinner if projects are loading -->
        ${this.projectsLoading ? html`
          <div style="width: 100%; display: flex">
            <paper-spinner-lite style="margin-top: 4em; margin-left: auto; margin-right: auto"active></paper-spinner-lite>
          </div>
        ` : html``}
        ${this.listedProjects.map(project => html`
            <paper-card class="project-item-card" @click="${() => this._onProjectItemClicked(project.id)}">
              <div class="project-item-card-content">
                <p class="project-item-name">${project.name}</p>
                <div style="margin-left: auto; display: flex">
                  ${this.getListOfProjectOnlineUsers(project.id) ? html`<span class="green-dot" style="margin-top: auto; margin-bottom: auto"></span>` : html``}
                  <p class="project-item-user-list">${this.getListOfProjectOnlineUsers(project.id)}</p>
                  <a href="${project.gitHubProjectHtmlUrl}" title="Open on GitHub Projects" target="_blank" class="github-a" style="margin-top: auto; margin-bottom: auto">
                    <!-- not using the svg from master branch, otherwise the file might be deleted and cannot be displayed anymore -->
                    <img src="https://raw.githubusercontent.com/primer/octicons/e9a9a84fb796d70c0803ab8d62eda5c03415e015/icons/mark-github-16.svg" class="github-img">
                  </a>
                </div>
              </div>
            </paper-card>
        `)}
      </div>
      
      <!-- Dialog for creating new projects. -->
      <paper-dialog id="dialog-create-project">
        <h2>Create a Project</h2>
        
        <paper-input id="input-project-name" @input="${(e) => this._onInputProjectNameChanged(e.target.value)}" 
            placeholder="Project Name"></paper-input>
        
        <div class="buttons">
          <paper-button @click="${this._closeCreateProjectDialogClicked}" dialog-dismiss>Cancel</paper-button>
          <paper-button id="dialog-button-create" @click="${this._createProject}" dialog-confirm>Create</paper-button>
        </div>
      </paper-dialog>
      
      <!-- Dialog showing a loading bar -->
      <paper-dialog id="dialog-loading" modal>
        <paper-spinner-lite active></paper-spinner-lite>
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
      /**
       * Contains all the projects that could be shown.
       * Depends on whether "My Projects" or "All Projects"
       * is selected by the user.
       */
      projects: {
        type: Array
      },
      projectsOnlineUser: {
        type: Map
      },
      /**
       * This contains the projects that are shown.
       * This is a subset of the projects property if search
       * is enabled.
       */
      listedProjects: {
        type: Array
      },
      tabSelected: {
        type: Number
      },
      projectsLoading: {
        type: Boolean
      }
    }
  }

  constructor() {
    super();

    this.projects = [];
    this.projectsOnlineUser = new Object();
    this.listedProjects = [];

    this.showProjects(false);
  }

  /**
   * Gets called when the user switches the current tab.
   * @param tabIndex 0 = My Projects, 1 = All Projects
   * @private
   */
  _onTabChanged(tabIndex) {
    this.tabSelected = tabIndex;
    if(tabIndex == 0) {
      // show users projects / projects where the user is a member of
      this.showProjects(false);
    } else {
      // show all projects
      this.showProjects(true);
    }
  }

  /**
   * Loads the projects that the user is part from.
   * @param allProjects If all projects should be shown or only the ones
   * where the current user is a member of.
   */
  showProjects(allProjects) {
    // set loading to true
    this.projectsLoading = true;

    // clear current project list
    this.projects = [];
    this.listedProjects = [];

    // only send authHeader when not all projects should be shown, but only the
    // one from the current user
    const headers = allProjects? undefined : Auth.getAuthHeader();

    fetch(Static.ProjectManagementServiceURL + "/projects", {
      method: "GET",
      headers: headers
    }).then(response => {
      if(!response.ok) throw Error(response.status);
      return response.json();
    }).then(data => {
      // set loading to false, then the spinner gets hidden
      this.projectsLoading = false;

      // store loaded projects
      this.projects = data;
      // set projects that should be shown (currently all)
      this.listedProjects = data;

      // notify project-management about users projects (only if allProjects is false)
      if(!allProjects) {
        let event = new CustomEvent("user-project-list-loaded-event", {
          detail: {
            message: "Finished loading users projects.",
            usersProjects: data
          }
        });
        this.dispatchEvent(event);
      }

      // load online users
      for(let i in this.projects) {
        this.loadListOfProjectOnlineUsers(this.projects[i].id);
      }
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
      this.listedProjects = this.listedProjects.filter(project => {
        return project.name.toLowerCase().includes(searchInput.toLowerCase());
      });
    } else {
      // no search input, show all projects that were loaded
      this.listedProjects = this.projects;
    }
  }

  /**
   * Get called when the user click on "create" in the
   * create project dialog.
   */
  _createProject() {
    const projectName = this.shadowRoot.getElementById("input-project-name").value;

    // close dialog (then also the button is not clickable and user cannot create project twice or more often)
    // important: get projectName before closing dialog, because when closing the dialog the input field gets cleared
    this._closeCreateProjectDialogClicked();

    // show loading dialog
    this.shadowRoot.getElementById("dialog-loading").open();

    if(projectName) {
      fetch(Static.ProjectManagementServiceURL + "/projects", {
        method: "POST",
        headers: Auth.getAuthHeader(),
        body: JSON.stringify({
          "name": projectName,
          "access_token": Auth.getAccessToken()
        })
      }).then(response => {
        // close loading dialog
        this.shadowRoot.getElementById("dialog-loading").close();

        if(response.status == 201) {
          // project got created successfully
          this.shadowRoot.getElementById("toast-success").show();

          // clear input field for project name in the dialog
          this.shadowRoot.getElementById("input-project-name").value = "";

          // since a new project exists, reload projects from server
          this.showProjects(false);
          // switch to tab "My Projects"
          this.tabSelected = 0;
          this.shadowRoot.getElementById("my-and-all-projects").selected = 0;
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
   * Creates a string which contains a list of the users that are online in the
   * project with the given id.
   * @param projectId
   * @returns {string} String containing a list of online users in the given project.
   */
  getListOfProjectOnlineUsers(projectId) {
    let s = "";
    for(let i in this.projectsOnlineUser[projectId]) {
      s += this.projectsOnlineUser[projectId][i] + ",";
    }
    if(s) {
      s = s.substr(0,s.length-1);
    }
    return s;
  }

  /**
   * Load users that are online in the given project.
   * @param projectId
   */
  loadListOfProjectOnlineUsers(projectId) {
    // to get list of online users, we need to enter the yjs rooms of every component by the project
    // get components by projectId
    const components = this.getProjectById(projectId).components;

    // clear list
    let list = [];
    this.projectsOnlineUser[projectId] = list;

    for(let i in components) {
      const component = components[i];
      // get currently active users in yjs room
      new Promise((resolve) => Y({
        db: {
          name: "memory" // store the shared data in memory
        },
        connector: {
          name: "websockets-client", // use the websockets connector
          room: Common.getYjsRoomNameForVersionedModel(component.versionedModelId, false),
          options: { resource: Static.YjsResourcePath},
          url: Static.YjsAddress
        },
        share: { // specify the shared content
          userList: 'Map', // used to get full name of users
          join: 'Map' // used to get currently online users
        },
        type:["Map"],
        sourceDir: "/node_modules"
      }).then(function(y) {
        //y.share.data.set('metamodel', vls);
        //console.log(component.name);
        const userList = y.share.userList;

        // Start observing for join events.
        // After that we will join the Yjs room with the username "invisible_user".
        // When we join the Yjs room, then all the other users send a join event back to us.
        // Thus, we wait for join events which tell us which users are online.
        // We use "invisible_user" as username, because this is the only username where SyncMeta's
        // activity list widget does not show the join/leave events for.
        y.share.join.observe(event  => {
          if(userList.get(event.name)) {
            const userFullName = userList.get(event.name)["http://purl.org/dc/terms/title"];
            if(y.share.userList.get(event.name)) {
              if(!list.includes(userFullName)) {
                list.push(userFullName);
              }
            }
          }
        });
        // now join the Yjs room
        y.share.join.set("invisible_user", false);

        setTimeout(function() {
          y.close();
          resolve();
        }, 5000);
      })).then(_ => {
        this.requestUpdate();
      });
    }
  }
}

customElements.define('project-explorer', ProjectExplorer);
