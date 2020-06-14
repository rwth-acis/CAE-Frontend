import {html, LitElement} from 'lit-element';
import '@polymer/paper-card/paper-card';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/iron-icon/iron-icon';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';
import '@polymer/paper-spinner/paper-spinner-lite.js';
import Auth from "../auth";
import Static from "../static";
import Common from "../common";
import MetamodelUploader from "../metamodel-uploader";

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
        .github-img {
          width: 1.5em;
          height: 1.5em;
          margin-left: 4px;
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
              ${this.editingEnabled? html`
                <paper-button @click="${this._onAddComponentClicked}" style="margin-left: auto; margin-top: auto; margin-bottom: auto">Add Component</paper-button>
              ` : html``}
              <!-- Show button for editing or saving -->
              ${this.editingAllowed? html`
                ${this.editingEnabled? html`
                  <iron-icon @click="${this._onEditProjectClicked}" class="edit-icon"
                      icon="done" style="margin-left: 0.5em; margin-top: auto; margin-bottom: auto"></iron-icon>
                ` : html `
                  <iron-icon @click="${this._onEditProjectClicked}" class="edit-icon"
                      icon="create" style="margin-left: auto; margin-top: auto; margin-bottom: auto"></iron-icon>
                `}
              ` : html``}
            </div>
            
            <!-- Frontend and Microservice Components of the project -->
            <div class="components">
              <paper-tabs id="component-tabs" selected="0">
                <paper-tab @click="${() => this._onTabChanged(0)}">Frontend Components</paper-tab>
                <paper-tab @click="${() => this._onTabChanged(1)}">Microservice Components</paper-tab>
              </paper-tabs>
              ${this.currentlyShownComponents.map(component => html`
                <div style="display: flex">
                  <div @click="${() => this._onComponentClicked(component)}" style="width: 100%">
                      <p>${component.name}</p>
                  </div>
                  <div style="margin-left: auto; margin-top: auto; margin-bottom:auto; height: 100%; display: flex">
                    <!-- Label for dependencies -->
                    ${component.type == "dependency" ? html`<span class="label">Dependency</span>` : html``}
                    <!-- Label for external dependencies -->
                    ${component.type == "external_dependency" ? html`<span class="label">External Dependency</span>` : html``}
                    <!-- Link to Requirements Bazaar -->
                    ${component.reqBazCategoryId ? html`
                      <a style="text-decoration: none"
                          href="https://requirements-bazaar.org/projects/${component.reqBazProjectId}/categories/${component.reqBazCategoryId}">
                        <img src="https://requirements-bazaar.org/images/reqbaz-logo.svg" class="reqbaz-img">
                      </a>
                    ` : html``}
                    <!-- Link to GitHub -->
                    <a href="${component.github_url}">
                      <img src="https://raw.githubusercontent.com/primer/octicons/e9a9a84fb796d70c0803ab8d62eda5c03415e015/icons/mark-github-16.svg" class="github-img">
                    </a>
                    ${this.editingEnabled? html`
                      <iron-icon @click="${() => this._removeComponentFromProjectClicked(component)}" class="edit-icon" icon="delete" style="margin-left: 0.5em"></iron-icon>
                    ` : html``}
                  </div>
                </div>
                <div class="separator"></div>
              `)}
            </div>
            
            <!-- Application Component -->
            <div class="application-component" style="margin-left: 1em; margin-right: 1em">
              <h4>Application Component</h4>
              <div style="display: flex; padding-bottom: 0.5em">
                <a @click="${this._onOpenApplicationModelingClicked}" href="">Open in Modeling Space</a>
                <div style="margin-left: auto; margin-top: auto; margin-bottom: auto; display: flex">
                  <!-- Requirements Bazaar connection -->
                  ${this.applicationComponent.reqBazCategoryId ? html`
                    <a style="text-decoration: none"
                        href="https://requirements-bazaar.org/projects/${this.applicationComponent.reqBazProjectId}/categories/${this.applicationComponent.reqBazCategoryId}">
                      <img src="https://requirements-bazaar.org/images/reqbaz-logo.svg" class="reqbaz-img">
                    </a>
                  ` : html``}
                  <!-- GitHub connection -->
                  <a style="text-decoration: none" href="https://github.com">
                    <img src="https://raw.githubusercontent.com/primer/octicons/e9a9a84fb796d70c0803ab8d62eda5c03415e015/icons/mark-github-16.svg" class="github-img">
                  </a>
                </div>
              </div>
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
                      ${this.editingEnabled? html`
                        <iron-icon @click="${() => this._userEditButtonClicked(user)}" class="edit-icon" icon="create"></iron-icon>
                      ` : html``}
                    </div>
                    <div class="separator"></div>
                  `)}
                </div>
            
                <!-- Add users to the project -->
                ${this.editingEnabled? html`
                  <div class="add-user" style="display: flex; margin-top: 0.5em; margin-left: 1em; margin-right: 1em; margin-bottom: 1em">
                    <input id="input-username" class="input-username input" placeholder="Enter Username" style="margin-left: 0"
                        @input="${(e) => this._onInviteUserInputChanged(e.target.value)}"></input>
                    <paper-button id="button-invite-user" @click="${this._onInviteUserToProjectClicked}"
                        style="margin-left: auto">Invite</paper-button>
                  </div>
                ` : html``}
              </div>
              <div class="flex-project-roles" style="border-left: thin solid #e1e1e1;">
                <!-- Roles of the project -->
                <div style="margin-left: 1em; margin-right: 1em">
                  <h4>Roles</h4>
                  ${this.roleList.map(role => html`
                    <div style="width: 100%; display: flex; align-items: center">
                      <p>${role.name}</p>
                      ${this.editingEnabled? html`
                        <iron-icon @click="${() => this._roleEditButtonClicked(role)}" class="edit-icon"
                            icon="create" style="margin-left: auto"></iron-icon>
                      ` : html``}
                    </div>
                    <div class="separator"></div>
                  `)}
                </div>
                
                <!-- Add roles to the project -->
                ${this.editingEnabled? html`               
                  <div class="add-role" style="display: flex; margin-top: 0.5em; margin-left: 1em; margin-right: 1em; margin-bottom: 1em">
                    <input id="input-role" class="input-role input" placeholder="Enter Role Name" style="margin-left: 0"
                        @input="${(e) => this._onAddRoleInputChanged(e.target.value)}"></input>
                    <paper-button id="button-add-role" @click="${this._onAddRoleToProjectClicked}"
                        style="margin-left: auto">Add</paper-button>
                  </div>
                ` : html``}
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
      
      <!-- Dialog showing a loading bar -->
      <paper-dialog id="dialog-loading" modal>
        <paper-spinner-lite active></paper-spinner-lite>
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
      applicationComponent: {
        type: Object
      },
      currentlyShownComponents: {
        type: Array
      },
      /*
       * Used to determine whether the edit-buttons etc. should be visible or not.
       * Note: Editing is only possible when editingAllowed is true.
       */
      editingEnabled: {
        type: Boolean
      },
      /**
       * Tells if the logged in user is allowed to edit the currently selected project.
       */
      editingAllowed: {
        type: Boolean
      },
      /*
       * List of the projects where the current user is member of.
       */
      usersProjects: {
        type: Array
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
    this.componentTabSelected = 0;
    this.editingEnabled = false;
    this.editingAllowed = false;
    this.usersProjects = [];
  }

  /**
   * Gets called when the user clicks on a component.
   * Opens the component in the modeling page.
   * Therefore, the metamodels are uploaded and then the
   * modeling page is opened.
   * @param component
   * @private
   */
  _onComponentClicked(component) {
    // update modeling info
    const modelingInfo = Common.getModelingInfo();
    const content = {
      "versionedModelId": component.versionedModelId
    };
    if(component.type == "frontend") {
      modelingInfo.frontend = content;
    } else {
      modelingInfo.microservice = content;
    }
    Common.storeModelingInfo(modelingInfo);
    this.updateMenu(component.type);

    // set this versioned model as the currently opened one
    Common.setVersionedModelId(this.applicationComponent.versionedModelId);

    // show spinner
    this.openLoadingDialog();

    // store information for requirements bazaar widget
    Common.storeRequirementsBazaarProject(component.reqBazProjectId, component.reqBazCategoryId);

    // upload metamodel for the component
    this.uploadMetamodelForComponent(component).then(_ => {
      this.closeLoadingDialog();
      if(component.type == "frontend") {
        this.changeView("cae-modeling/frontend-modeling");
      } else {
        this.changeView("cae-modeling/microservice-modeling");
      }
    });
  }

  /**
   * Gets called when the user wants to open the
   * application modeling page of a project.
   * @private
   */
  _onOpenApplicationModelingClicked() {
    // update modeling info
    const modelingInfo = Common.getModelingInfo();
    modelingInfo.application = {
      "versionedModelId": this.applicationComponent.versionedModelId
    };
    Common.storeModelingInfo(modelingInfo);
    this.updateMenu(this.applicationComponent.type);

    // set this versioned model as the currently opened one
    Common.setVersionedModelId(this.applicationComponent.versionedModelId);

    // show spinner
    this.openLoadingDialog();

    // store information for requirements bazaar widget
    Common.storeRequirementsBazaarProject(this.applicationComponent.reqBazProjectId, this.applicationComponent.reqBazCategoryId);

    // upload metamodel for application component
    this.uploadMetamodelForComponent(this.applicationComponent).then(_ => {
      // close dialog
      this.closeLoadingDialog();
      // send event which notifies the cae-static-app to change the view
      this.changeView("cae-modeling/application-modeling");
    });
  }

  /**
   * Sends an event which notifies the cae-static-app to change the view.
   * @param viewName View that should be shown.
   */
  changeView(viewName) {
    let event = new CustomEvent("change-view", {
      detail: {
        view: viewName
      }
    });
    this.dispatchEvent(event);
  }

  /**
   * Fires an event which should notify the cae-static-app to update the menu.
   */
  updateMenu(componentType) {
    let event = new CustomEvent("update-menu", {
      detail: {
        componentType: componentType
      }
    });
    this.dispatchEvent(event);
  }

  /**
   * Uploads the metamodel for the modeling of the given component.
   * @param component The component whose metamodel should be uploaded.
   * @returns {Promise<unknown>}
   */
  uploadMetamodelForComponent(component) {
    return MetamodelUploader.uploadForComponent(component)
      .then(_ => new Promise((resolve, reject) => {
        // wait for data become active
        setTimeout(_ => resolve(), 2000);
      }));
  }

  /**
   * Gets called when the "edit" or "save" button gets called.
   * @private
   */
  _onEditProjectClicked() {
    this.editingEnabled = !this.editingEnabled;

    // disable buttons for adding users and roles
    // wait until the layout has updated, otherwise the button elements cannot be found because they are not shown yet
    if (this.editingEnabled) {
      this.requestUpdate().then(e => {
        this.shadowRoot.getElementById("button-invite-user").disabled = true;
        this.shadowRoot.getElementById("button-add-role").disabled = true;
      });
    }
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

    // when opening a new project, editing should not be enabled
    this.editingEnabled = false;

    // check if user is allowed to edit the project
    this.editingAllowed = this.isUserAllowedToEditProject();

    // load components of the selected project
    this.loadComponents();
  }

  /**
   * Gets called by the project-management which forwards the event
   * originally sent from the project-explorer.
   * @param eventDetail Contains the list of projects by the current user.
   * @private
   */
  _onUserProjectListLoaded(eventDetail) {
    this.usersProjects = eventDetail.usersProjects;
  }

  /**
   * Checks if the user is allowed to edit the currently shown project.
   * Therefore, it checks if the user is member of the currently shown project.
   * @returns {boolean} Whether user is allowed to edit the currently shown project.
   */
  isUserAllowedToEditProject() {
    // check if the list of projects where the current user is part of, contains
    // a project with the id of the currently selected project
    for(let i in this.usersProjects) {
      const project = this.usersProjects[i];
      if(project.id == this.selectedProject.id) {
        // user is member of the currently shown project
        return true;
      }
    }
    // user is no member of the currently shown project
    return false;
  }

  /**
   * Loads the components of the currently selected project.
   */
  loadComponents() {
    this.applicationComponent = undefined;
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
        } else if(component.type == "application") {
          this.applicationComponent = component;
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
   * Gets called when the user wants to remove a component from the project.
   * @param component
   * @private
   */
  _removeComponentFromProjectClicked(component) {
    const projectId = this.getProjectId();
    const componentId = component.id;

    fetch(Static.ProjectManagementServiceURL + "/projects/" + projectId + "/components/" + componentId, {
      method: "DELETE",
      headers: Auth.getAuthHeader()
    }).then(response => {
      if(response.ok) {
        this.showToast("Removed component from project!");

        // just reload components list
        this.loadComponents();
      }
    });
  }

  /**
   * Gets called when the input of the username field gets changed.
   * @param username Current value of the input field.
   * @private
   */
  _onInviteUserInputChanged(username) {
    if(username) {
      this.shadowRoot.getElementById("button-invite-user").disabled = false;
    } else {
      this.shadowRoot.getElementById("button-invite-user").disabled = true;
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

  _onInviteUserToProjectClicked() {
    // get entered username
    const loginName = this.shadowRoot.getElementById("input-username").value;
    const projectId = this.getProjectId();

    // send invitation
    fetch(Static.ProjectManagementServiceURL + "/projects/" + projectId + "/invitations", {
      method: "POST",
      headers: Auth.getAuthHeader(),
      body: JSON.stringify({
        "loginName": loginName
      })
    }).then(response => {
      if(response.ok) {
        // show toast message
        this.showToast("Invited user to project!");

        // clear input text and deactivate button
        this.shadowRoot.getElementById("input-username").value = "";
        this.shadowRoot.getElementById("button-invite-user").disabled = true;
      } else {
        throw Error(response.status);
      }
    }).catch(error => {
      if(error.message == "404") {
        // user with given name could not be found
        this.showToast("Could not find user with given name.");
      } else if(error.message == "409") {
        // user is already member of the project or already invited to it
        this.showToast("User is already member of the project or already invited to it.");
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
    this.openLoadingDialog();
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
        "type": componentType,
        "access_token": Auth.getAccessToken()
      })
    }).then(response => {
      this.closeLoadingDialog();
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
   * Opens the dialog which shows a progress spinner.
   */
  openLoadingDialog() {
    this.shadowRoot.getElementById("dialog-loading").open();
  }

  /**
   * Closes the dialog which shows a progress spinner.
   */
  closeLoadingDialog() {
    this.shadowRoot.getElementById("dialog-loading").close();
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
