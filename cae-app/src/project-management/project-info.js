import {html, LitElement} from 'lit-element';
import '@polymer/paper-card/paper-card';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/iron-icon/iron-icon';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';
import Auth from "../auth";
import Static from "../static";

/**
 * PolymerElement for management of project components and users.
 * TODO: Update Documentation when functionality of this element is final.
 * This element allows to list the users of a project, to add users to a project,
 * to remove users from a project and to change their role in a project.
 */
class ProjectInfo extends LitElement {
  render() {
    return html`
      <style>
        :host {
          font-family: Roboto;
        }
        .main{
          width: 100%;
          margin-top: 1em;
          height: 600px;
          border-left: thin solid #e1e1e1;
          padding-top: 0.1em;
        }
        .dropdown-menu-project {
          width: 100%;
        }
        .separator {
           border-top: thin solid #e1e1e1;
        }
        .input {
          width: 100%;
          margin-right: 0.5em;
          border-radius: 3px;
          border: thin solid #e1e1e1;
          height: 2.5em;
          padding-left:5px;
        }
        /* Set outline to none, otherwise the border color changes when clicking on input field. */
        .input:focus {
          outline: none;
        }
        paper-button {
          color: rgb(240,248,255);
          background: rgb(30,144,255);
          height: 2.5em;
        }
        paper-button:hover {
          color: rgb(240,248,255);
          background: rgb(65,105,225);
        }
        paper-button[disabled] {
          background: #e1e1e1;
        }
        .button-danger {
          background: rgb(255,93,84);
        }
        .button-danger:hover {
          background: rgb(216,81,73);
        }
        .edit-icon {
          color: #c6c6c6;
        }
        .components {
          margin-left: 1em;
          margin-right: 1em;
        }
        paper-tabs {
          --paper-tabs-selection-bar-color: rgb(30,144,255);
        }
        .label {
          color: #586069;
          border: 1px solid #e1e1e1;
          margin-top: auto;
          margin-bottom: auto;
          padding: 0.1em 0.2em;
          border-radius: 3px;
        }
        .github-a {
          margin-top: auto;
          margin-bottom: auto;
          margin-left: 1em;
        }
        .github-img {
          width: 1.5em;
          height: 1.5em;
        }
        .reqbaz-img {
          width: 1.5em;
          height: 1.5em;
          background: #447500;
        }
      </style>
      <div class="main">
        ${this.selectedProject ?
      html`
            <!-- Title of project -->
            <div class="project-title" style="display: flex; margin-left: 1em; margin-right: 1em;">
              <h3>${this.selectedProject.name}</h3>
              <!-- Button for adding components to a project -->
              <paper-button @click="${this._onAddComponentClicked}" style="margin-left: auto; margin-top: auto; margin-bottom: auto">Add Component</paper-button>
            </div>
            
            <!-- Frontend and Microservice Components of the project -->
            <div class="components">
              <paper-tabs id="component-tabs" selected="0">
                <paper-tab @click="${() => this._onTabChanged(0)}">Frontend Components</paper-tab>
                <paper-tab @click="${() => this._onTabChanged(1)}">Microservice Components</paper-tab>
              </paper-tabs>
              ${this.currentlyShownComponents.map(component => html`
                <div style="display: flex">
                  <p>${component.name}</p>
                  <div style="margin-left: auto; margin-top: auto; margin-bottom:auto; height: 100%; display: flex">
                    <!-- Label for dependencies -->
                    ${component.type == "dependency" ? html`<span class="label">Dependency</span>` : html``}
                    <!-- Label for external dependencies -->
                    ${component.type == "external_dependency" ? html`<span class="label">External Dependency</span>` : html``}
                    <!-- Link to GitHub (or later maybe GitLab) -->
                    <a href="${component.github_url}" class="github-a">
                      <img src="https://raw.githubusercontent.com/primer/octicons/master/icons/mark-github.svg" class="github-img">
                    </a>
                  </div>
                </div>
                <div class="separator"></div>
              `)}
            </div>
            
            <!-- Application Component -->
            <div class="application-component" style="margin-left: 1em; margin-right: 1em">
              <h4>Application Component</h4>
              <div style="display: flex; padding-bottom: 0.5em">
                <a href="/cae-modeling">Open in Modeling Space</a>
                <a href="https://github.com" style="margin-left: auto; margin-top: auto; margin-bottom: auto">
                  <img src="https://raw.githubusercontent.com/primer/octicons/master/icons/mark-github.svg" class="github-img">
                </a>
              </div>
              <div class="separator"></div>
            </div>
            
            <!-- Requirements Bazaar -->
            <div class="requirements-bazaar" style="margin-left: 1em; margin-right: 1em">
              <h4>Requirements Bazaar</h4>
                ${this.isConnectedToReqBaz ? html`
                  <div style="display: flex">
                    <div>
                      <p>Connected to a Requirements Bazaar category. <a @click="${this._onDisconnectReqBazClicked}"
                          href="">Disconnect</a></p>
                    </div>
                    <a href="https://requirements-bazaar.org/projects/${this.selectedProject.reqBazProjectId}/categories/${this.selectedProject.reqBazCategoryId}"
                          style="margin-left:auto; margin-top: auto; margin-bottom: auto">
                      <img src="https://requirements-bazaar.org/images/reqbaz-logo.svg" class="reqbaz-img">
                    </a>
                  </div>
                ` : html`
                  <p>This CAE project is not connected to the Requirements Bazaar yet. Enter URL to category to connect to:</p>
                  <div style="display: flex">
                    <input id="input-reqbaz-url" class="input-reqbaz-url input"
                        @input="${(e) => this._onReqBazURLChanged(e.target.value)}"
                        placeholder="Paste URL to Category" style="margin-left: 0"></input>
                    <paper-button @click="${this._onConnectReqBazClicked}" ?disabled="${!this.urlMatchesReqBazFormat}" style="margin-left: auto">Connect</paper-button>
                  </div>
                  ${this.urlMatchesReqBazFormat ? html`` : html`<p>Entered URL does not match the required format.</p>`}
                `}
              <div class="separator"></div>
            </div>
            
            <custom-style>
        <style is="custom-style">
          .flex-horizontal-with-ratios {
            @apply --layout-horizontal;
          }
          .flex-project-users {
            @apply --layout-flex;
          }
          .flex-project-roles {
            @apply --layout-flex;
          }
        </style>
      </custom-style>
            <div class="flex-horizontal-with-ratios">
              <div class="flex-project-users">
                <!-- Users of the project -->
                <div class="user-list" style="margin-left: 1em; margin-right: 1em; overflow: auto; max-height: 25em">
                  <h4>Users</h4>
                  ${this.userList.map(user => html`
                    <div style="width: 100%; display: flex; align-items: center">
                      <p>${user.loginName}</p>
                      <p style="margin-right: 0.5em; margin-left: auto">${this.getRoleById(user.roleId).name}</p>
                      <iron-icon @click="${() => this._userEditButtonClicked(user)}" class="edit-icon" icon="create"></iron-icon>
                    </div>
                    <div class="separator"></div>
                  `)}
                </div>
            
                <!-- Add users to the project -->
                <div class="add-user" style="display: flex; margin-top: 0.5em; margin-left: 1em; margin-right: 1em; margin-bottom: 1em">
                  <input id="input-username" class="input-username input" placeholder="Enter Username" style="margin-left: 0"
                      @input="${(e) => this._onAddUserInputChanged(e.target.value)}"></input>
                  <paper-button id="button-add-user" @click="${this._onAddUserToProjectClicked}"
                      style="margin-left: auto">Add</paper-button>
                </div>
              </div>
              <div class="flex-project-roles" style="border-left: thin solid #e1e1e1;">
                <!-- Roles of the project -->
                <div style="margin-left: 1em; margin-right: 1em">
                  <h4>Roles</h4>
                  ${this.roleList.map(role => html`
                    <div style="width: 100%; display: flex; align-items: center">
                      <p>${role.name}</p>
                      <iron-icon @click="${() => this._roleEditButtonClicked(role)}" class="edit-icon"
                          icon="create" style="margin-left: auto"></iron-icon>
                    </div>
                    <div class="separator"></div>
                  `)}
                </div>
                
                <!-- Add roles to the project -->
                <div class="add-role" style="display: flex; margin-top: 0.5em; margin-left: 1em; margin-right: 1em; margin-bottom: 1em">
                  <input id="input-role" class="input-role input" placeholder="Enter Role Name" style="margin-left: 0"
                      @input="${(e) => this._onAddRoleInputChanged(e.target.value)}"></input>
                  <paper-button id="button-add-role" @click="${this._onAddRoleToProjectClicked}"
                      style="margin-left: auto">Add</paper-button>
                </div>
              </div>
            </div>
          ` :
      html`
            <div style="margin-left: 1em; margin-right: 1em; margin-top: 1em">
              <p>No project selected.</p>
            </div>
          `
    }
      </div>
      
      <!-- Dialog for editing a user in a project. -->
      <paper-dialog id="dialog-edit-user">
        <h2>Edit User: ${this.editingUser ? html`${this.editingUser.loginName}` : html``}</h2>
        
        <paper-dropdown-menu label="Select Role">
          <paper-listbox slot="dropdown-content" selected="1">
            <paper-item>Frontend Modeler</paper-item>
            <paper-item>Application Modeler</paper-item>
            <paper-item>Backend Modeler</paper-item>
            <paper-item>Software Engineer</paper-item>
          </paper-listbox>
        </paper-dropdown-menu>
        
        <div style="align-items: center">
          <paper-button class="button-danger" @click="${this._removeUserFromProjectClicked}">Remove From Project</paper-button>
        </div>
        
        <div>
          <paper-button @click="${this._closeEditUserDialogClicked}">Cancel</paper-button>
          <paper-button>Save</paper-button>
        </div>
      </paper-dialog>
      
      <!-- Dialog for editing a role in a project. -->
      <paper-dialog id="dialog-edit-role">
        <h2>Edit Role: ${this.editingRole ? html`${this.editingRole.name}` : html``}</h2>
        <div style="align-items: center">
          <paper-button class="button-danger" @click="${this._removeRoleFromProjectClicked}">Remove From Project</paper-button>
        </div>
        
        <div>
          <paper-button @click="${this._closeEditRoleDialogClicked}">Cancel</paper-button>
          <paper-button>Save</paper-button>
        </div>
      </paper-dialog>
      
      <!-- Dialog for adding components to a project. -->
      <paper-dialog id="dialog-add-component">
        <div>
          <h4>Create New Component:</h4>
          <div style="display: flex; align-items: center">
            <!-- Select Component Type -->
            <paper-dropdown-menu label="Select Type" style="min-width: 15em">
              <paper-listbox id="dialog-add-component-dropdown-type" slot="dropdown-content" selected="0">
                <paper-item>Frontend Component</paper-item>
                <paper-item>Microservice Component</paper-item>
              </paper-listbox>
            </paper-dropdown-menu>
            <!-- Enter Component Name -->
            <input id="dialog-add-component-input-name" class="input" style="margin-left: 1em" placeholder="Enter Component Name"></input>
            <!-- Button for creating component -->
            <paper-button @click="${this._onCreateComponentClicked}">Create</paper-button>
          </div>
          <div class="separator"></div>
        </div>
        <div>
          <h4>Include Dependency:</h4>
          <div style="display: flex; align-items: center">
            <!-- Search for Component -->
            <input class="input" placeholder="Search Component"></input>
            <!-- Select Component version -->
            <paper-dropdown-menu label="Select Version" style="min-width: 5em; margin-left: 0.5em">
              <paper-listbox slot="dropdown-content" selected="0">
                <paper-item>0.0.1</paper-item>
                <paper-item>0.0.2</paper-item>
                <paper-item>0.1.0</paper-item>
              </paper-listbox>
            </paper-dropdown-menu>
            <!-- Button for adding component -->
            <paper-button>Add</paper-button>
          </div>
          <div class="separator"></div>
        </div>
        <div>
          <h4>Include External Dependency:</h4>
          <div style="display: flex; align-items: center">
            <!-- Enter GitHub URL of external component -->
            <input class="input" placeholder="Enter GitHub URL"></input>
            <!-- Select Component version -->
            <paper-dropdown-menu label="Select Version" style="min-width: 5em; margin-left: 0.5em">
              <paper-listbox slot="dropdown-content" selected="0">
                <paper-item>0.0.1</paper-item>
                <paper-item>0.0.2</paper-item>
                <paper-item>0.1.0</paper-item>
              </paper-listbox>
            </paper-dropdown-menu>
            <!-- Button for adding component -->
            <paper-button>Add</paper-button>
          </div>
          <div class="separator"></div>
        </div>
        <div>
          <paper-button @click="${this._closeAddComponentDialogClicked}">Close</paper-button>
        </div>
      </paper-dialog>
      
      <!-- Generic Toast (see showToast method for more information) -->
      <paper-toast id="toast" text="Will be changed later."></paper-toast>
    `;
  }

  static get properties() {
    return {
      userList: {
        type: Array
      },
      roleList: {
        type: Array
      },
      selectedProject: {
        type: Object
      },
      editingUser: {
        type: Object
      },
      editingRole: {
        type: String
      },
      componentTabSelected: {
        type: Number
      },
      frontendComponents: {
        type: Array
      },
      microserviceComponents: {
        type: Array
      },
      currentlyShownComponents: {
        type: Array
      },
      isConnectedToReqBaz: {
        type: Boolean
      },
      /**
       * When the user enters an URL to the Requirements Bazaar,
       * this property is used to tell whether the entered
       * URL matches the required format.
       */
      urlMatchesReqBazFormat: {
        type: Boolean
      }
    }
  }

  constructor() {
    super();
    this.userList = [];
    this.roleList = [];
    this.frontendComponents = [];
    this.microserviceComponents = [];
    this.currentlyShownComponents = [];
    this.isConnectedToReqBaz = false;
    this.urlMatchesReqBazFormat = false;
    this.componentTabSelected = 0;
  }

  /**
   * Gets called when the CAE project is not yet
   * connected to the Requirements Bazaar and the user updates the
   * URL to the Requiremenets Bazaar category.
   * @param url The entered url.
   * @private
   */
  _onReqBazURLChanged(url) {
    // remove / at the end of the URL if needed
    if(url.slice(-1) == "/") {
      url = url.substr(0, url.length-1);
    }
    const regexp = new RegExp("^https:\/\/requirements-bazaar\.org\/projects\/(\\d+)\/categories\/(\\d+)$");
    this.urlMatchesReqBazFormat = regexp.test(url);
  }

  /**
   * Gets called when the Connect button for the Requirements Bazaar
   * gets clicked.
   * The button is only clickable if the entered url matches the required
   * format for a category on the Requirements Bazaar.
   * @private
   */
  _onConnectReqBazClicked() {
    let reqBazURL = this.shadowRoot.getElementById("input-reqbaz-url").value;

    // remove / at the end of the URL if needed
    if(reqBazURL.slice(-1) == "/") {
      reqBazURL = reqBazURL.substr(0, reqBazURL.length-1);
    }

    const reqBazProjectId = reqBazURL.split("/projects/")[1].split("/")[0];
    const reqBazCategoryId = reqBazURL.split("/categories/")[1];

    const caeProjectId = this.getProjectId();

    fetch(Static.ProjectManagementServiceURL + "/projects/" + caeProjectId + "/reqbaz", {
      method: "PUT",
      headers: Auth.getAuthHeader(),
      body: JSON.stringify({
        "projectId": Number.parseInt(reqBazProjectId),
        "categoryId": Number.parseInt(reqBazCategoryId)
      })
    }).then(response => {
      if(response.ok) {
        // successfully updated requirements bazaar category
        // also update locally
        this.selectedProject.reqBazProjectId = reqBazProjectId;
        this.selectedProject.reqBazCategoryId = reqBazCategoryId;

        this.isConnectedToReqBaz = true;
      } else {
        console.log(response);
      }
    });
  }

  /**
   * Gets called when the Disconnect button for the Requirements Bazaar
   * gets clicked.
   * @private
   */
  _onDisconnectReqBazClicked() {
    const projectId = this.getProjectId();

    fetch(Static.ProjectManagementServiceURL + "/projects/" + projectId + "/reqbaz", {
      method: "DELETE",
      headers: Auth.getAuthHeader()
    }).then(response => {
      if(response.ok) {
        // successfully disconnected requirements bazaar category
        // also update locally
        this.selectedProject.reqBazProjectId = 0;
        this.selectedProject.reqBazCategoryId = 0;

        this.isConnectedToReqBaz = false;
      } else {
        console.log(response);
      }
    });
  }

  /**
   * Gets called when the user wants to close
   * the edit user dialog.
   * @private
   */
  _closeEditUserDialogClicked() {
    this.shadowRoot.getElementById("dialog-edit-user").close();
  }

  /**
   * Gets called when the user wants to close
   * the edit role dialog.
   * @private
   */
  _closeEditRoleDialogClicked() {
    this.shadowRoot.getElementById("dialog-edit-role").close();
  }

  /**
   * Gets called when the user want to close
   * the add component dialog.
   * @private
   */
  _closeAddComponentDialogClicked() {
    this.shadowRoot.getElementById("dialog-add-component").close();
  }

  _userEditButtonClicked(user) {
    this.editingUser = user;
    this.shadowRoot.getElementById("dialog-edit-user").open()
  }

  _roleEditButtonClicked(role) {
    this.editingRole = role;
    this.shadowRoot.getElementById("dialog-edit-role").open();
  }

  _onAddComponentClicked() {
    this.getAddComponentDialog().open();
  }

  /**
   * Returns the dialog which gets used to add components to a project.
   * @returns {HTMLElement} Dialog
   */
  getAddComponentDialog() {
    return this.shadowRoot.getElementById("dialog-add-component");
  }

  /**
   * Gets called by the parent element (ProjectManagement page)
   * when the user selects a project in the project explorer.
   * @param project Project that got selected in the explorer.
   * @private
   */
  _onProjectSelected(project) {
    this.selectedProject = project;

    // set users of the project
    this.userList = project.users;

    // get roles from project
    this.roleList = project.roles;

    // check if the project is already connected to the requirements bazaar
    this.isConnectedToReqBaz = project.reqBazProjectId != 0;

    // disable buttons for adding users and roles
    // wait until the layout has updated, otherwise the button elements cannot be found because they are not shown yet
    this.requestUpdate().then(e => {
      this.shadowRoot.getElementById("button-add-user").disabled = true;
      this.shadowRoot.getElementById("button-add-role").disabled = true;
    });

    // load components of the selected project
    this.loadComponents();
  }

  /**
   * Loads the components of the currently selected project.
   */
  loadComponents() {
    this.frontendComponents = [];
    this.microserviceComponents = [];

    const projectId = this.getProjectId();
    fetch(Static.ProjectManagementServiceURL + "/projects/" + projectId + "/components", {
      method: "GET"
    }).then(response => {
        if(response.ok) {
          return response.json();
        }
      }
    ).then(data => {
      // data is a JSONArray containing both frontend and microservice components
      for(let i in data) {
        const component = data[i];
        if (component.type == "frontend") {
          this.frontendComponents.push(component);
        } else if (component.type == "microservice") {
          this.microserviceComponents.push(component);
        }
      }

      // check which component tab is currently shown
      if(this.componentTabSelected == 0) {
        this.currentlyShownComponents = this.frontendComponents;
        // since we show the frontend components, also the frontend tab should be shown
        this.shadowRoot.getElementById("component-tabs").selected = 0;
      } else {
        this.currentlyShownComponents = this.microserviceComponents;
        // since we show the microservice components, also the microservice tab should be shown
        this.shadowRoot.getElementById("component-tabs").selected = 1;
      }
    });
  }

  /**
   * Gets called when the input of the username field gets changed.
   * @param username Current value of the input field.
   * @private
   */
  _onAddUserInputChanged(username) {
    if(username) {
      this.shadowRoot.getElementById("button-add-user").disabled = false;
    } else {
      this.shadowRoot.getElementById("button-add-user").disabled = true;
    }
  }

  /**
   * Gets called when the input of the role field gets changed.
   * @param role Current value of the input field.
   * @private
   */
  _onAddRoleInputChanged(role) {
    if(role) {
      this.shadowRoot.getElementById("button-add-role").disabled = false;
    } else {
      this.shadowRoot.getElementById("button-add-role").disabled = true;
    }
  }

  _onAddUserToProjectClicked() {
    // get entered username
    const loginName = this.shadowRoot.getElementById("input-username").value;
    const projectId = this.getProjectId();

    fetch(Static.ProjectManagementServiceURL + "/projects/" + projectId + "/users", {
      method: "POST",
      headers: Auth.getAuthHeader(),
      body: JSON.stringify({
        "loginName": loginName
      })
    }).then(response => {
      if(response.ok) {
        return response.json();
      } else {
        throw Error(response.status);
      }
    }).then(data => {
      // data is the user which got added to the project
      // show toast message
      this.showToast("Added user to project!");

      // show the new user in the users list of the project
      this.userList.push(data);
      this.requestUpdate();

      // NOTE: this.userList references to project.users (gets set in _onProjectSelected)
      // and project is part of the listedProjects array in the project explorer
      // Thus: the listedProjects automatically contains the newly added user

      // clear input text and deactivate button
      this.shadowRoot.getElementById("input-username").value = "";
      this.shadowRoot.getElementById("button-add-user").disabled = true;
    }).catch(error => {
      if(error.message == "404") {
        // user with given name could not be found
        this.showToast("Could not find user with given name.");
      } else if(error.message == "409") {
        // user is already member of the project
        this.showToast("User is already member of the project.");
      }
    });
  }

  _removeUserFromProjectClicked() {
    // close dialog
    this._closeEditUserDialogClicked();

    const projectId = this.getProjectId();
    const userToRemove = this.editingUser;

    fetch(Static.ProjectManagementServiceURL + "/projects/" + projectId + "/users/" + userToRemove.id, {
      method: "DELETE",
      headers: Auth.getAuthHeader()
    }).then(response => {
      if(response.ok) {
        this.showToast("Removed user from project!");

        // remove the user from the users list of the project
        this.userList.splice(this.userList.findIndex(user => {
          return user.id === userToRemove.id;
        }),1);
        this.requestUpdate();

        // NOTE: this.userList references to project.users (gets set in _onProjectSelected)
        // and project is part of the listedProjects array in the project explorer
        // Thus: the listedProjects automatically does not contain the removed user anymore
      }
    });
  }

  /**
   * Gets called when the user wants to add a role to the currently shown project.
   * Sends a request to the API and tries to add the role to the project.
   * @private
   */
  _onAddRoleToProjectClicked() {
    const projectId = this.getProjectId();
    const roleName = this.shadowRoot.getElementById("input-role").value;

    fetch(Static.ProjectManagementServiceURL + "/projects/" + projectId + "/roles", {
      method: "POST",
      headers: Auth.getAuthHeader(),
      body: JSON.stringify({
        "name": roleName
      })
    }).then(response => {
      if(response.ok) {
        return response.json();
      } else {
        throw Error(response.status);
      }
    }).then(data => {
      // data is the role which got added to the project
      // show toast message
      this.showToast("Added role to project!");

      // show the new role in the roles list of the project
      this.roleList.push(data);
      this.requestUpdate();

      // NOTE: this.roleList references to project.roles (gets set in _onProjectSelected)
      // and project is part of the listedProjects array in the project explorer
      // Thus: the listedProjects automatically contains the newly added role

      // clear input text and deactivate button
      this.shadowRoot.getElementById("input-role").value = "";
      this.shadowRoot.getElementById("button-add-role").disabled = true;
    }).catch(error => {
      if(error.message == "409") {
        // role with same name already exists
        this.showToast("Role with same name already exists in the project.");
      }
    });
  }

  /**
   * Gets called when the user wants to remove the selected role from the project.
   * Sends a request to the API and tries to remove the role.
   * If the role is still assigned to at least one user in the project, then removing it
   * will not work, but a toast notifying the user about this will be shown.
   * @private
   */
  _removeRoleFromProjectClicked() {
    // close dialog
    this._closeEditRoleDialogClicked();

    const projectId = this.getProjectId();
    const roleToRemove = this.editingRole;

    fetch(Static.ProjectManagementServiceURL + "/projects/" + projectId + "/roles/" + roleToRemove.id, {
      method: "DELETE",
      headers: Auth.getAuthHeader()
    }).then(response => {
      if(response.ok) {
        this.showToast("Removed role from project!");

        // remove the role from the roles list of the project
        this.roleList.splice(this.roleList.findIndex(role => {
          return role.id === roleToRemove.id;
        }),1);
        this.requestUpdate();

        // NOTE: this.roleList references to project.roles (gets set in _onProjectSelected)
        // and project is part of the listedProjects array in the project explorer
        // Thus: the listedProjects automatically does not contain the removed role anymore
      } else if(response.status == 409) {
        // role is still assigned to at least one user and thus cannot be removed from project
        this.showToast("Cannot remove role since it is assigned to at least one user!");
      }
    });
  }

  _onTabChanged(tabIndex) {
    this.componentTabSelected = tabIndex;
    const projectId = this.getProjectId();
    if(tabIndex == 0) {
      this.currentlyShownComponents = this.frontendComponents;
    } else {
      this.currentlyShownComponents = this.microserviceComponents;
    }
  }

  /**
   * Searches for the role with the given id.
   * @param roleId Id of the role to search for.
   */
  getRoleById(roleId) {
    for(let i in this.roleList) {
      const role = this.roleList[i];
      if (role.id == roleId) return role;
    }
  }

  /**
   * Gets called when the user has the "Add Component" dialog opened and
   * want to create a new standard component (so no dependency).
   * @private
   */
  _onCreateComponentClicked() {
    const projectId = this.getProjectId();

    const componentName = this.shadowRoot.getElementById("dialog-add-component-input-name").value;
    const componentTypeSelected = this.shadowRoot.getElementById("dialog-add-component-dropdown-type").selected;

    let componentType;
    if(componentTypeSelected == 0) {
      componentType = "frontend";
    } else {
      componentType = "microservice";
    }

    fetch(Static.ProjectManagementServiceURL + "/projects/" + projectId + "/components", {
      method: "POST",
      headers: Auth.getAuthHeader(),
      body: JSON.stringify({
        "name": componentName,
        "type": componentType
      })
    }).then(response => {
      if(response.ok) {
        // successfully created new component
        // reload components
        this.loadComponents();

        // reset dialog input fields
        this.shadowRoot.getElementById("dialog-add-component-input-name").value = "";
        this.shadowRoot.getElementById("dialog-add-component-dropdown-type").selected = 0;

        // close dialog
        this.getAddComponentDialog().close();

        // show toast message
        this.showToast("Successfully created new component!");
      } else {

      }
    });
  }

  /**
   * Since the project-info page uses lots of toast messages,
   * it is helpful to have this method for displaying toast messages.
   * It allows to have one single paper-toast item in the html which
   * gets used for different message texts.
   * @param text Text to display in the toast.
   */
  showToast(text) {
    const toastElement = this.shadowRoot.getElementById("toast");
    toastElement.text = text;
    toastElement.show();
  }

  getProjectId() {
    return this.selectedProject.id;
  }
}

customElements.define('project-info', ProjectInfo);
