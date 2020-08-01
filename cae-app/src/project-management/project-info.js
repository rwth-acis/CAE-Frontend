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
import Auth from "../util/auth";
import Static from "../static";
import Common from "../util/common";
import MetamodelUploader from "../util/metamodel-uploader";
import GitHubHelper from "../util/github-helper";

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
          height: 2.5em;
        }
        .paper-button-blue {
          color: rgb(240,248,255);
          background: rgb(30,144,255);
          height: 2.5em;
        }
        .paper-button-blue:hover {
          color: rgb(240,248,255);
          background: rgb(65,105,225);
        }
        paper-button[disabled] {
          background: #e1e1e1;
        }
        .button-danger {
          color: rgb(240,248,255);
          background: rgb(255,93,84);
        }
        .button-danger:hover {
          background: rgb(216,81,73);
        }
        .edit-icon {
          color: #000000;
        }
        .edit-icon:hover {
          color: #7c7c7c;
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
          margin-left: 0.5em;
        }
        .reqbaz-img {
          width: 1.5em;
          height: 1.5em;
          margin-left: 0.5em;
          background: #447500;
        }
        .reqbaz-img:hover {
          background: #65ab00;
        }
        .disabled {
          color: #e1e1e1;
        }
      </style>
      <div class="main">
        ${this.selectedProject ?
      html`
            <!-- Title of project -->
            <div class="project-title" style="display: flex; margin-left: 1em; margin-right: 1em;">
              <h3>${this.selectedProject.name}</h3>
              <!-- Button for adding components to a project -->
              ${this.editingAllowed ? html`
                <paper-button class="paper-button-blue" @click="${this._onAddComponentClicked}" style="margin-left: auto; margin-top: auto; margin-bottom: auto">Add Component</paper-button>
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
                  <div style="width: 100%">
                      <p>${this.getComponentName(component)}</p>
                  </div>
                  <div style="margin-left: auto; margin-top: auto; margin-bottom:auto; height: 100%; display: flex">
                    <!-- Labels for dependencies and external dependencies -->
                    ${component.dependencyId ? html`<span class="label" style="margin-right: 0.5em">Dependency</span>` : html``}
                    ${component.externalDependencyId ? html`<span class="label" style="margin-right: 0.5em; white-space: nowrap;">External Dependency</span>` : html``}
                    <!-- Link to open modeling space -->
                    ${component.externalDependencyId ? html`` : html`
                      <iron-icon title="Open modeling" @click="${() => this._onComponentClicked(component)}"
                        icon="icons:exit-to-app" class="edit-icon" style="margin-top: auto; margin-bottom: auto"></iron-icon>
                    `}
                    <!-- Link to Requirements Bazaar -->
                    ${this.hasRequirementsBazaarURL(component) ? html`
                      <a title="Open in Requirements Bazaar" style="text-decoration: none; margin-top: auto; margin-bottom: auto" 
                          target="_blank"
                          href=${this.getRequirementsBazaarURL(component)}>
                          <svg width="24px" height="24px" class="reqbaz-img">
                            <image xlink:href="https://requirements-bazaar.org/images/reqbaz-logo.svg" width="24px" height="24px"/>
                          </svg>
                      </a>
                    ` : html``}
                    <!-- Link to GitHub -->
                    <a title="View component on GitHub" href=${this.getComponentGitHubURL(component)} target="_blank" 
                        style="margin-top: auto; margin-bottom: auto">
                      <svg width="24px" height="24px" class="github-img">
                        <image xlink:href="https://raw.githubusercontent.com/primer/octicons/e9a9a84fb796d70c0803ab8d62eda5c03415e015/icons/mark-github-16.svg" width="24px" height="24px"/>
                      </svg>
                    </a>
                    ${this.editingAllowed ? html`
                      <iron-icon title="Delete from project" @click="${() => this._removeComponentFromProjectClicked(component)}" class="edit-icon"
                           icon="delete" style="margin-left: 0.5em; margin-top: auto; margin-bottom: auto"></iron-icon>
                    ` : html``}
                  </div>
                </div>
                <div class="separator"></div>
              `)}
            </div>
            
            <!-- Application Component -->
            <div class="application-component" style="display: flex; margin-left: 1em; margin-right: 1em; margin-top: 1em">
              <h4>Application</h4>
              <div style="margin-left: auto; margin-top:auto; margin-bottom: auto; display: flex">
                <!-- Open in modeling space -->
                <iron-icon title="Open modeling" @click="${this._onOpenApplicationModelingClicked}" icon="icons:exit-to-app" class="edit-icon"></iron-icon>
                <!-- Requirements Bazaar connection -->
                ${this.applicationComponent.reqBazCategoryId && this.applicationComponent.reqBazCategoryId != -1 ? html`
                  <a title="Open in Requirements Bazaar" style="text-decoration: none" target="_blank"
                      href="https://requirements-bazaar.org/projects/${this.applicationComponent.reqBazProjectId}/categories/${this.applicationComponent.reqBazCategoryId}">
                    <svg width="24px" height="24px" class="reqbaz-img">
                      <image xlink:href="https://requirements-bazaar.org/images/reqbaz-logo.svg" width="24px" height="24px"/>
                    </svg>
                  </a>
                ` : html``}
                <!-- GitHub connection -->
                <a title="View application on GitHub" style="text-decoration: none" href=${this.getComponentGitHubURL(this.applicationComponent)} target="_blank">
                  <img src="https://raw.githubusercontent.com/primer/octicons/e9a9a84fb796d70c0803ab8d62eda5c03415e015/icons/mark-github-16.svg" class="github-img">
                </a>
              </div>
            </div>
            <div class="separator" style="margin-left: 1em; margin-right: 1em"></div>
            
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
                      ${this.editingAllowed ? html`
                        <iron-icon @click="${() => this._userEditButtonClicked(user)}" class="edit-icon" icon="create"></iron-icon>
                      ` : html``}
                    </div>
                    <div class="separator"></div>
                  `)}
                </div>
            
                <!-- Add users to the project -->
                ${this.editingAllowed ? html`
                  <div class="add-user" style="display: flex; margin-top: 0.5em; margin-left: 1em; margin-right: 1em; margin-bottom: 1em">
                    <input id="input-username" class="input-username input" placeholder="Enter Username" style="margin-left: 0"
                        @input="${(e) => this._onInviteUserInputChanged(e.target.value)}"></input>
                    <paper-button disabled="true" class="paper-button-blue" id="button-invite-user" @click="${this._onInviteUserToProjectClicked}"
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
                      ${this.editingAllowed ? html`
                        <iron-icon @click="${() => this._roleEditButtonClicked(role)}" class="edit-icon"
                            icon="create" style="margin-left: auto"></iron-icon>
                      ` : html``}
                    </div>
                    <div class="separator"></div>
                  `)}
                </div>
                
                <!-- Add roles to the project -->
                ${this.editingAllowed ? html`               
                  <div class="add-role" style="display: flex; margin-top: 0.5em; margin-left: 1em; margin-right: 1em; margin-bottom: 1em">
                    <input id="input-role" class="input-role input" placeholder="Enter Role Name" style="margin-left: 0"
                        @input="${(e) => this._onAddRoleInputChanged(e.target.value)}"></input>
                    <paper-button disabled="true" class="paper-button-blue" id="button-add-role" @click="${this._onAddRoleToProjectClicked}"
                        style="margin-left: auto">Add</paper-button>
                  </div>
                ` : html``}
              </div>
            </div>
            <div style="margin-left: 1em; margin-right: 1em; margin-bottom: 0.5em">
              ${this.editingAllowed ? html`
              <div class="separator"></div>
              <h4>Danger Zone</h4>
              <div style="display: flex">
                <p>Delete this project. Please note that a project cannot be restored after deletion.</p>
                <paper-button @click=${this._onDeleteProjectClicked} class="button-danger" style="margin-top: auto; margin-bottom: auto; margin-left: auto">Delete</paper-button>
              </div>
              ` : html``}
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
      <paper-dialog id="dialog-edit-user" modal>
        <h2>Edit User: ${this.editingUser ? html`${this.editingUser.loginName}` : html``}</h2>
        
        <paper-dropdown-menu label="Select Role">
          <paper-listbox id="listbox-select-role" slot="dropdown-content" selected=${this.editingUser ? this.getRoleIndex(this.editingUser.roleId) : undefined}>
            ${this.selectedProject ? html`${this.selectedProject.roles.map(role => html`
              <paper-item>${role.name}</paper-item>
            `)}` : html``}
          </paper-listbox>
        </paper-dropdown-menu>
        
        <div style="align-items: center">
          <paper-button class="button-danger" @click="${this._removeUserFromProjectClicked}">Remove From Project</paper-button>
        </div>
        
        <div class="buttons">
          <paper-button dialog-dismiss>Cancel</paper-button>
          <paper-button @click=${this._onSaveUserClicked} dialog-confirm>Save</paper-button>
        </div>
      </paper-dialog>
      
      <!-- Dialog for editing a role in a project. -->
      <paper-dialog id="dialog-edit-role" modal>
        <h2>Edit Role: ${this.editingRole ? html`${this.editingRole.name}` : html``}</h2>
        <div style="align-items: center">
          <paper-button class="button-danger" @click="${this._removeRoleFromProjectClicked}">Remove From Project</paper-button>
        </div>
        
        <div class="buttons">
          <paper-button dialog-dismiss>Cancel</paper-button>
          <paper-button dialog-confirm>Save</paper-button>
        </div>
      </paper-dialog>
      
      <!-- Dialog for adding components to a project. -->
      <paper-dialog id="dialog-add-component" modal>
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
            <paper-button class="paper-button-blue" @click="${this._onCreateComponentClicked}">Create</paper-button>
          </div>
          <div class="separator"></div>
        </div>
        <div>
          <h4>Include Dependency:</h4>
          <div style="display: flex; align-items: center">
            <p style="max-width: 400px; margin-top: 0">You can search for existing components from other CAE projects 
            and include them to this project. Note: Components that are included as a dependency cannot be edited.
            </p>
            <paper-button class="paper-button-blue" style="margin-bottom: 1em; margin-left: auto" @click=${this._onSearchDependencyClicked}>Search components</paper-button>
          </div>
          <div class="separator"></div>
        </div>
        <div>
          <h4>Include External Dependency:</h4>
          <div style="display: flex; align-items: center">
            <p style="max-width: 400px; margin-top: 0">It is also possible to include external dependencies from 
            GitHub. Currently the CAE supports frontend Web widgets and 
            <a href=${Static.las2peerURL} target="_blank">las2peer</a> microservices.
            For more information on external dependencies please have a look at the <a href=${Static.ExternalDependenciesWiki} target="_blank">CAE wiki</a>.
            </p>
            <paper-button class="paper-button-blue" style="margin-bottom: 1em; margin-left: auto" @click=${this._onAddExternalDependencyClicked}>Ext. dependencies</paper-button>
          </div>
          <div class="separator"></div>
        </div>
        <div class="buttons">
          <paper-button dialog-dismiss>Close</paper-button>
        </div>
      </paper-dialog>
      
      <!-- Dialog for searching components to include them as a dependency -->
      <paper-dialog id="dialog-search-components" modal>
        <div>
          <h4>Include Dependency</h4>
          <paper-input id="dialog-search-components-input" placeholder="Search component"></paper-input>
          <div id="dialog-search-components-results" style="height: 250px; overflow-y: scroll">
          
          </div>
        </div>
        <div class="buttons">
          <paper-button dialog-dismiss>Close</paper-button>
          <paper-button>Include as dependency</paper-button>
        </div>
      </paper-dialog>
      
      <!-- Dialog for adding external dependencies -->
      <paper-dialog id="dialog-add-external-dependency" modal>
        <div>
          <h4>Include External Dependency</h4>
          <p style="max-width: 500px; margin-bottom: 0">Please choose a type and enter a GitHub URL which leads to a frontend Web widget or a
          <a href=${Static.las2peerURL} target="_blank">las2peer</a> microservice.
          For more information please have a look at the <a href=${Static.ExternalDependenciesWiki} target="_blank">CAE wiki</a>.</p>
          <paper-dropdown-menu label="Select Type" style="min-width: 15em">
            <paper-listbox id="dialog-add-external-dependency-dropdown-type" slot="dropdown-content" selected="0">
              <paper-item>Frontend Component</paper-item>
              <paper-item>las2peer service</paper-item>
            </paper-listbox>
          </paper-dropdown-menu>
          <div style="display: flex">
            <paper-input id="dialog-add-external-dependency-input" placeholder="Enter GitHub URL" style="flex: 1;"></paper-input>
            <iron-icon id="dialog-add-external-dependency-icon-check" style="margin-bottom: 10px; margin-top: auto; color: #dbdbdb" icon="check"></iron-icon>
          </div>
        </div>
        <div class="buttons">
          <paper-button dialog-dismiss>Close</paper-button>
          <paper-button>Include as external dependency</paper-button>
        </div>
      </paper-dialog>
      
      <!-- Dialog showing a loading bar -->
      <paper-dialog id="dialog-loading" modal>
        <paper-spinner-lite active></paper-spinner-lite>
      </paper-dialog>
      
      <!-- Dialog: Are you sure to delete the component? -->
      <paper-dialog id="dialog-delete-component" modal>
        <h4>Delete Component</h4>
        <div>
        Are you sure that you want to delete the component?
        </div>
        <div class="buttons">
          <paper-button dialog-dismiss>Cancel</paper-button>
          <paper-button @click=${this._removeComponentFromProject} dialog-confirm autofocus>Yes</paper-button>
        </div>
      </paper-dialog>
      
      <!-- Dialog: Are you sure to delete the dependency? -->
      <paper-dialog id="dialog-delete-dependency" modal>
        <h4>Delete Dependency</h4>
        <div>
        Are you sure that you want to delete the dependency?
        </div>
        <div class="buttons">
          <paper-button dialog-dismiss>Cancel</paper-button>
          <paper-button @click=${this._removeDependencyFromProject} dialog-confirm autofocus>Yes</paper-button>
        </div>
      </paper-dialog>
      
       <!-- Dialog: Are you sure to delete the external dependency? -->
      <paper-dialog id="dialog-delete-external-dependency" modal>
        <h4>Delete External Dependency</h4>
        <div>
        Are you sure that you want to delete the external dependency?
        </div>
        <div class="buttons">
          <paper-button dialog-dismiss>Cancel</paper-button>
          <paper-button @click=${this._removeExternalDependencyFromProject} dialog-confirm autofocus>Yes</paper-button>
        </div>
      </paper-dialog>
      
      <!-- Dialog: Are you sure to delete the project? -->
      <paper-dialog id="dialog-delete-project" modal>
        <h4>Delete Project</h4>
        <div>
        Are you sure that you want to delete the project?
        </div>
        <div class="buttons">
          <paper-button dialog-dismiss>Cancel</paper-button>
          <paper-button @click=${this._deleteProject} dialog-confirm autofocus>Yes</paper-button>
        </div>
      </paper-dialog>
      
      <!-- Generic Toast (see showToast method for more information) -->
      <paper-toast id="toast" text="Will be changed later."></paper-toast>
      
      <!-- Generic Warning-Toast (see showWarningToast method for more information) -->
      <custom-style><style is="custom-style">
        #warning-toast {
          --paper-toast-background-color: red;
          --paper-toast-color: white;
        }
      </style></custom-style>
      <paper-toast id="warning-toast" text="Will be changed later."></paper-toast>
    `;
  }

  static get properties() {
    return {
      userList: { type: Array },
      roleList: { type: Array },
      selectedProject: { type: Object },
      editingUser: { type: Object },
      editingRole: { type: String },
      componentTabSelected: { type: Number },
      frontendComponents: { type: Array },
      microserviceComponents: { type: Array },
      applicationComponent: { type: Object },
      currentlyShownComponents: { type: Array },
      /**
       * Tells if the logged in user is allowed to edit the currently selected project.
       */
      editingAllowed: { type: Boolean },
      /*
       * List of the projects where the current user is member of.
       */
      usersProjects: { type: Array },
      /**
       * Gets set before the "Are you sure that you want to delete...?" dialog
       * appears. Then this attribute gets used in the click event of the
       * dialogs "Yes" button.
        */
      componentToDelete: { type: Object },
      /**
       * The same as componentToDelete, but for dependencies of the project.
       */
      dependencyToDelete: { type: Object },
      externalDependencyToDelete: { type: Object },
      validURL: { type: Boolean },
      enteredURL: { type: String }
    }
  }

  constructor() {
    super();
    this.resetProjectInfo();

    this.requestUpdate().then(_ => {
      this.getAddExternalDependencyDialog().getElementsByTagName("paper-button")[1]
        .addEventListener("click", this.addExternalDependencyClicked.bind(this));
    });
  }

  resetProjectInfo() {
    this.selectedProject = undefined;
    this.userList = [];
    this.roleList = [];
    this.frontendComponents = [];
    this.microserviceComponents = [];
    this.currentlyShownComponents = [];
    this.componentTabSelected = 0;
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
    component = this.restrictAccess(component);

    // update information on currently opened component in localStorage
    this.updateCurrentlyOpenedComponent(component);

    // show spinner
    this.openLoadingDialog();

    // upload metamodel for the component
    MetamodelUploader.uploadMetamodelAndModelForComponent(component).then(_ => {
      const componentType = component.dependencyId ? component.component.type : component.type;
      this.updateMenu(componentType);

      this.closeLoadingDialog();
      if(componentType == "frontend") {
        this.changeView("cae-modeling/frontend-modeling");
      } else {
        this.changeView("cae-modeling/microservice-modeling");
      }
    }, _ => {
      this.closeLoadingDialog();
      this.showToast("Error while opening component!");
    });
  }

  /**
   * Checks if user is allowed to edit the given component.
   * If not, then it creates a "fake"-dependency component and returns it.
   * This then allows to view the component without the possibility for the user to edit it,
   * because this also happens for real dependency components.
   * @param component
   * @returns {*|{dependencyId: number, component: *}}
   */
  restrictAccess(component) {
    // check if user is member of the project
    // therefore, we can just check if user is allowed to edit the project
    // if the user is not allowed, then the user is no member of the project
    if(!this.editingAllowed) {
      // user is no member of the project; thus, the user should not be able to edit the component when it is opened
      // but the user should still be able to view the component in the modeling space
      // now we can make use of the way how dependency components are handled in the CAE, because when the user opens
      // a dependency component, then it is not editable. We therefore edit the given component and let it look like
      // a dependency component, then the component will be displayed but not editable
      // IMPORTANT: this trick needs to be done before updateCurrentlyOpenedComponent() is called, otherwise
      // it is not stored in localStorage, that the component should be handled as a dependency
      return component = {
        "component": component,
        "dependencyId": -1
      };
    }
    return component;
  }

  /**
   * Gets called when a new component gets opened.
   * Updates the modeling info stored in localStorage.
   * @param component Component that gets opened.
   * @param isDependency Whether the component that gets opened is a dependency of the project.
   */
  updateModelingInfoComponentOpened(component, isDependency) {
    const modelingInfo = Common.getModelingInfo();
    const content = {
      "versionedModelId": component.versionedModelId,
      "name": component.name,
      "projectId": this.getProjectId(),
      "isDependency": isDependency,
      "gitHubProjectId": this.selectedProject.gitHubProjectId,
      "gitHubProjectHtmlUrl": this.selectedProject.gitHubProjectHtmlUrl,
      "projectName": this.selectedProject.name
    };
    if(component.type == "frontend") {
      modelingInfo.frontend = content;
    } else if(component.type == "microservice") {
      modelingInfo.microservice = content;
    } else {
      modelingInfo.application = content;
    }
    Common.storeModelingInfo(modelingInfo);
  }

  /**
   * Stores the versioned model id of the given component
   * as the currently openend versioned model id in localStorage.
   * @param component Component that gets opened.
   */
  updateCurrentlyOpenedVersionedModelId(component) {
    Common.setVersionedModelId(component.versionedModelId);
  }

  /**
   * Stores the GitHub repo name of the given component
   * as the GitHub repo name of the currently opened component
   * in localStorage.
   * @param component Component that gets opened.
   */
  updateCurrentlyOpenedGitHubRepoName(component) {
    let repoPrefix;
    if(component.type == "frontend") {
      repoPrefix = "frontendComponent-";
    } else if(component.type == "microservice") {
      repoPrefix = "microservice-";
    } else {
      repoPrefix = "application-";
    }

    Common.setGitHubRepoName(repoPrefix + component.versionedModelId);
  }

  /**
   * Stores the information needed for the Requirements Bazaar widget to work.
   * Gets called when the information changes, i.e. when a new component gets opened.
   * @param component Component that gets opened.
   */
  updateCurrentlyOpenedReqBazConfig(component) {
    Common.storeRequirementsBazaarProject(component.versionedModelId, component.reqBazProjectId, component.reqBazCategoryId);
  }

  /**
   * Gets called when a new component gets opened and the information
   * on the currently opened component in localStorage should be updated.
   * @param component
   */
  updateCurrentlyOpenedComponent(component) {
    let isDependency = false;
    if(component.hasOwnProperty("dependencyId")) {
      // component is a dependency
      component = component.component;
      isDependency = true;
    }

    // update modeling info
    this.updateModelingInfoComponentOpened(component, isDependency);

    // set this versioned model as the currently opened one
    this.updateCurrentlyOpenedVersionedModelId(component);

    // set GitHub repo name in localStorage
    this.updateCurrentlyOpenedGitHubRepoName(component);

    // store information for requirements bazaar widget
    this.updateCurrentlyOpenedReqBazConfig(component);
  }

  /**
   * Gets called when the user wants to open the
   * application modeling page of a project.
   * @private
   */
  _onOpenApplicationModelingClicked() {
    const component = this.restrictAccess(this.applicationComponent);

    // update information on currently opened component in localStorage
    this.updateCurrentlyOpenedComponent(component);

    // show spinner
    this.openLoadingDialog();

    // upload metamodel for application component
    MetamodelUploader.uploadMetamodelAndModelForComponent(component).then(_ => {
      const componentType = component.dependencyId ? component.component.type : component.type;
      this.updateMenu(componentType);

      // close dialog
      this.closeLoadingDialog();
      // send event which notifies the cae-static-app to change the view
      this.changeView("cae-modeling/application-modeling");
    }, _ => {
      this.closeLoadingDialog();
      this.showToast("Error while opening component!");
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
   * When the user opens the first project and no application component
   * is opened yet, then the one from the newly opened project should be
   * opened automatically. This should be done in the background, i.e. silent.
   */
  uploadMetamodelAndModelForApplicationSilent() {
    console.log("Silent upload of (meta)model for application component started...");
    const component = this.restrictAccess(this.applicationComponent);

    // update information on currently opened component in localStorage
    // (even if the component does not really get opened, but only loaded)
    this.updateCurrentlyOpenedComponent(component);

    MetamodelUploader.uploadMetamodelAndModelForComponent(component).then(_ => {
      // success
      const componentType = component.dependencyId ? component.component.type : component.type;
      this.updateMenu(componentType);
    }, _ => {
      // failed
    });
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
   * Returns the dialog which gets used to search for dependencies to include them
   * in a project.
   * @returns {HTMLElement} Dialog
   */
  getSearchComponentsDialog() {
    return this.shadowRoot.getElementById("dialog-search-components");
  }

  /**
   * Returns the dialog which gets used to enter the URL for an external dependency which should be
   * added to the project.
   * @returns {HTMLElement} Dialog
   */
  getAddExternalDependencyDialog() {
    return this.shadowRoot.getElementById("dialog-add-external-dependency");
  }

  /**
   * Gets called by the parent element (ProjectManagement page)
   * when the user selects a project in the project explorer.
   * @param project Project that got selected in the explorer.
   * @private
   */
  _onProjectSelected(project) {
    this.selectedProject = project;

    // clear input fields for username and role
    const inputUsername = this.shadowRoot.getElementById("input-username");
    if(inputUsername) inputUsername.value = "";
    const inputRole = this.shadowRoot.getElementById("input-role");
    if(inputRole) inputRole.value = "";

    // set users of the project
    this.userList = project.users;

    // get roles from project
    this.roleList = project.roles;

    // check if user is allowed to edit the project
    this.editingAllowed = this.isUserAllowedToEditProject();

    // load components of the selected project
    this.loadComponents().then(_ => {
      // check if there is an application component opened yet
      // otherwise, the one of this project should be automatically
      // opened in the background
      // for the frontend and microservices this is not possible, since
      // there could be multiple ones and we do not know which of them
      // should be opened
      if(Common.getModelingInfo().application == null) {
        this.uploadMetamodelAndModelForApplicationSilent();
      }
    }, _ => {});
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
    return new Promise((resolveLoading, rejectLoading) => {
      const projectId = this.getProjectId();
      fetch(Static.ProjectManagementServiceURL + "/projects/" + projectId, {
        method: "GET"
      }).then(response => {
          if(response.ok) {
            return response.json();
          } else {
            rejectLoading();
          }
        }
      ).then(data => {
        const components = data.components;
        const dependencies = data.dependencies;
        const externalDependencies = data.externalDependencies;

        // clear current components
        this.applicationComponent = undefined;
        this.frontendComponents = [];
        this.microserviceComponents = [];

        // components is a JSONArray containing both frontend components and microservices
        for(let i in components) {
          const component = components[i];
          if (component.type == "frontend") {
            this.frontendComponents.push(component);
          } else if (component.type == "microservice") {
            this.microserviceComponents.push(component);
          } else if(component.type == "application") {
            this.applicationComponent = component;
          }
        }

        // dependencies is a JSONArray containing both frontend component and microservice DEPENDENCIES
        for(let i in dependencies) {
          const dependency = dependencies[i];
          if(dependency.component.type == "frontend") {
            this.frontendComponents.push(dependency);
          } else if(dependency.component.type == "microservice") {
            this.microserviceComponents.push(dependency);
          }
        }

        // external dependencies
        for(let i in externalDependencies) {
          const externalDependency = externalDependencies[i];
          if(externalDependency.type == "frontend") {
            this.frontendComponents.push(externalDependency);
          } else if(externalDependency.type == "microservice") {
            this.microserviceComponents.push(externalDependency);
          }
        }

        resolveLoading();

        // check which component tab is currently shown
        const componentTabs = this.shadowRoot.getElementById("component-tabs");
        if(this.componentTabSelected == 0) {
          this.currentlyShownComponents = this.frontendComponents;
          // since we show the frontend components, also the frontend tab should be shown
          if(componentTabs != null) {
            componentTabs.selected = 0;
          }
        } else {
          this.currentlyShownComponents = this.microserviceComponents;
          // since we show the microservice components, also the microservice tab should be shown
          if(componentTabs != null) {
            componentTabs.selected = 1;
          }
        }
      });
    });
  }

  /**
   * Gets called when the user wants to remove a component from the project.
   * @param component
   * @private
   */
  _removeComponentFromProjectClicked(component) {
    if(component.externalDependencyId) {
      this.externalDependencyToDelete = component;
      this.shadowRoot.getElementById("dialog-delete-external-dependency").open();
    } else if(component.dependencyId) {
      this.dependencyToDelete = component;
      this.shadowRoot.getElementById("dialog-delete-dependency").open();
    } else {
      this.componentToDelete = component;
      // first show dialog and ensure that the user really want to delete the component
      this.shadowRoot.getElementById("dialog-delete-component").open();
    }
  }

  /**
   * Gets called when the user clicks "Yes" in the "Are you sure that you want to delete the component?"
   * button in the delete dialog.
   * @private
   */
  _removeComponentFromProject() {
    fetch(Static.ProjectManagementServiceURL + "/projects/" + this.getProjectId() + "/components/" + this.componentToDelete.id, {
      method: "DELETE",
      headers: Auth.getAuthHeader(),
      body: JSON.stringify({
        "access_token": Auth.getAccessToken()
      })
    }).then(response => {
      if(response.ok) {
        this.showToast("Removed component from project!");

        // just reload components list
        this.loadComponents();

        // check if the component which got deleted is currently opened (in the menu)
        // because then the menu and the modelingInfo in localStorage need to be updated
        this.closeComponent(this.componentToDelete);
      }
    });
  }

  /**
   * Gets called when the user clicks "Yes" in the "Are you sure that you want to delete the dependency?"
   * button in the delete dialog.
   * @private
   */
  _removeDependencyFromProject() {
    fetch(Static.ProjectManagementServiceURL + "/projects/" + this.getProjectId() + "/dependencies/" + this.dependencyToDelete.component.id, {
      method: "DELETE",
      headers: Auth.getAuthHeader()
    }).then(response => {
      if(response.ok) {
        this.showToast("Removed dependency from project!");

        // just reload components list
        this.loadComponents();

        // check if the dependency which got deleted is currently opened (in the menu)
        // because then the menu and the modelingInfo in localStorage need to be updated
        this.closeComponent(this.dependencyToDelete.component);
      }
    });
  }

  _removeExternalDependencyFromProject() {
    fetch(Static.ProjectManagementServiceURL + "/projects/" + this.getProjectId() + "/extdependencies/" + this.externalDependencyToDelete.externalDependencyId, {
      method: "DELETE",
      headers: Auth.getAuthHeader()
    }).then(response => {
      if(response.ok) {
        this.showToast("Removed external dependency from project!");

        // just reload components list
        this.loadComponents();
      }
    });
  }

  closeComponent(component) {
    const modelingInfo = Common.getModelingInfo();
    if(component.type == "frontend") {
      if(modelingInfo.frontend != null) {
        if(modelingInfo.frontend.versionedModelId == component.versionedModelId) {
          modelingInfo.frontend = null;
          Common.storeModelingInfo(modelingInfo);
          this.updateMenu("frontend");
        }
      }
    }
    if(component.type == "microservice") {
      if(modelingInfo.microservice != null) {
        if(modelingInfo.microservice.versionedModelId == component.versionedModelId) {
          modelingInfo.microservice = null;
          Common.storeModelingInfo(modelingInfo);
          this.updateMenu("microservice");
        }
      }
    }
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
    this.shadowRoot.getElementById("dialog-edit-user").close();

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
    this.shadowRoot.getElementById("dialog-edit-role").close();

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
   * Returns the index of the role with the given id in the roles array of the currently selected project.
   * @param roleId Id of the role to search for.
   * @returns {number} Index of the role with the given id in the roles array of the currently selected project.
   */
  getRoleIndex(roleId) {
    let index = 0;
    for(const role of this.selectedProject.roles) {
      if(role.id == roleId) break;
      index++;
    }
    return index;
  }

  /**
   * Gets called when the "save" button in the edit user dialog gets clicked.
   * @private
   */
  _onSaveUserClicked() {
    // first, we check if something changed
    // currently, only the role can be edited in the "edit-user-dialog"
    // thus, we only check if the role has changed
    // get selected role from input
    const selected = this.shadowRoot.getElementById("listbox-select-role").selected;

    // get corresponding role
    let index = 0;
    let selectedRole;
    for(const role of this.selectedProject.roles) {
      if(index == selected) {
        selectedRole = role;
        break;
      }
      index++;
    }
    if(!selectedRole) return;

    if(selectedRole.id != this.editingUser.roleId) {
      // role of user has changed
      // update in database
      fetch(Static.ProjectManagementServiceURL + "/projects/"
        + this.getProjectId() + "/users/" + this.editingUser.id + "/role/" + selectedRole.id, {
        method: "PUT",
        headers: Auth.getAuthHeader()
      }).then(response => {
        if(response.ok) {
          // update users role locally
          const user = this.selectedProject.users.filter(u => u.id == this.editingUser.id)[0];
          user.roleId = selectedRole.id;
          this.requestUpdate();
          this.showToast("Updated user successfully!");
        }
      });
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

  _onSearchDependencyClicked() {
    // close "add component" dialog
    this.getAddComponentDialog().close();
    // open dialog for searching components
    this.getSearchComponentsDialog().open();

    const searchResultDiv = this.shadowRoot.getElementById("dialog-search-components-results");

    // clear searchResultDiv first
    while(searchResultDiv.firstChild) searchResultDiv.removeChild(searchResultDiv.firstChild);

    let selectedComponentHTML;
    let selectedComponent;


    // search for components
    fetch(Static.ProjectManagementServiceURL + "/components", {
      method: "GET"
    }).then(response => {
      if(response.ok) {
        response.json().then(data => {
          // filter out components with type "application"
          data = data.filter(component => component.type != "application");

          for(const component of data) {
            const componentOuterDiv = document.createElement("div");
            componentOuterDiv.style = "display: flex";
            componentOuterDiv.addEventListener("mouseover", function() {
              componentOuterDiv.style.background = "#eeeeee";
            });
            componentOuterDiv.addEventListener("mouseleave", function() {
              if(componentOuterDiv != selectedComponentHTML) {
                componentOuterDiv.style.removeProperty("background");
              }
            });
            componentOuterDiv.addEventListener("click", function() {
              if(selectedComponentHTML) selectedComponentHTML.style.removeProperty("background");
              selectedComponentHTML = componentOuterDiv;
              selectedComponent = component;
              componentOuterDiv.style.setProperty("background", "#eeeeee");
            });

            const p = document.createElement("p");
            p.innerText = component.name;
            componentOuterDiv.appendChild(p);

            searchResultDiv.appendChild(componentOuterDiv);

            const separator = document.createElement("div");
            separator.class = "separator";
            searchResultDiv.appendChild(separator);
          }
        });
      }
    });

    const searchInputField = this.shadowRoot.getElementById("dialog-search-components-input");
    searchInputField.addEventListener("input", function(e) {
      const searchValue = searchInputField.value;
      for(const child of searchResultDiv.children) {
        console.log(child);
        if(child.getElementsByTagName("p").length > 0) {
          if (child.getElementsByTagName("p")[0].innerText.toLowerCase().includes(searchValue.toLowerCase())) {
            child.style.setProperty("display", "flex");
          } else {
            child.style.setProperty("display", "none");
          }
        }
      }
    });

    this.getSearchComponentsDialog().getElementsByTagName("paper-button")[1].addEventListener("click", function() {
      if(selectedComponent) {
        // close dialog
        this.getSearchComponentsDialog().close();

        // add component as dependency to project
        fetch(Static.ProjectManagementServiceURL + "/projects/" + this.getProjectId() + "/dependencies/" + selectedComponent.id, {
          method: "POST",
          headers: Auth.getAuthHeader()
        }).then(response => {
          if(response.ok) {
            this.showToast("Added component as a dependency!");
            // just reload components list
            this.loadComponents();
          }
        });
      }
    }.bind(this));
  }

  _onAddExternalDependencyClicked() {
    // close "add component" dialog
    this.getAddComponentDialog().close();
    // open dialog for adding external dependencies
    this.getAddExternalDependencyDialog().open();

    const inputGitHubURL = this.shadowRoot.getElementById("dialog-add-external-dependency-input");
    const iconCheck = this.shadowRoot.getElementById("dialog-add-external-dependency-icon-check");
    this.validURL = false;
    inputGitHubURL.addEventListener("input", function (e) {
      this.enteredURL = inputGitHubURL.value;

      if(GitHubHelper.validGitHubRepoURL(this.enteredURL)) {
        iconCheck.style.color = "#0F9D58";
        this.validURL = true;
      } else {
        iconCheck.style.color = "#dbdbdb";
        this.validURL = false;
      }
    }.bind(this));
  }

  addExternalDependencyClicked() {
    if(this.validURL) {
      // close dialog
      this.getAddExternalDependencyDialog().close();

      let type;
      const selected = this.shadowRoot.getElementById("dialog-add-external-dependency-dropdown-type").selected;
      if(selected == 0) {
        type = "frontend";
      } else {
        type = "microservice";
      }

      // add as external dependency to project
      fetch(Static.ProjectManagementServiceURL + "/projects/" + this.getProjectId() + "/extdependencies", {
        method: "POST",
        headers: Auth.getAuthHeader(),
        body: JSON.stringify({
          gitHubURL: this.enteredURL,
          type: type
        })
      }).then(response => {
        if(response.ok) {
          this.showToast("Added external dependency to project!");
          // just reload components list
          this.loadComponents();

          // clear dialog input
          const inputGitHubURL = this.shadowRoot.getElementById("dialog-add-external-dependency-input");
          inputGitHubURL.value = "";
        } else {
          this.showWarningToast("Adding external dependency failed!");
        }
      });
    } else {
      this.showWarningToast("Entered URL is not valid!");
    }
  }

  /**
   * Gets called when the user clicks on the delete button at the bottom
   * in the project info.
   * @private
   */
  _onDeleteProjectClicked() {
    // show dialog to ensure that the user really wants to delete the project
    this.shadowRoot.getElementById("dialog-delete-project").open();
  }

  /**
   * Gets called when the user has confirmed that the project should really be deleted.
   * @private
   */
  _deleteProject() {
    fetch(Static.ProjectManagementServiceURL + "/projects/" + this.selectedProject.id, {
      method: "DELETE",
      headers: Auth.getAuthHeader(),
      body: JSON.stringify({
        "access_token": Auth.getAccessToken()
      })
    }).then(response => {
      if(response.status == 204) {
        // ok, project got deleted
        // update modelingInfo in localStorage and update menu
        const modelingInfo = Common.getModelingInfo();
        if(modelingInfo.frontend != null) {
          for(let i in this.frontendComponents) {
            const component = this.frontendComponents[i];
            if(component.versionedModelId == modelingInfo.frontend.versionedModelId) {
              modelingInfo.frontend = null;
              Common.storeModelingInfo(modelingInfo);
              this.updateMenu("frontend");
            }
          }
        }
        if(modelingInfo.microservice != null) {
          for(let i in this.microserviceComponents) {
            const component = this.microserviceComponents[i];
            if(component.versionedModelId == modelingInfo.microservice.versionedModelId) {
              modelingInfo.microservice = null;
              Common.storeModelingInfo(modelingInfo);
              this.updateMenu("microservice");
            }
          }
        }
        if(modelingInfo.application != null) {
          if(this.applicationComponent.versionedModelId == modelingInfo.application.versionedModelId) {
            modelingInfo.application = null;
            Common.storeModelingInfo(modelingInfo);
            this.updateMenu("application");
          }
        }


        // reset project info, so that the project-info element does not show any content anymore
        this.resetProjectInfo();

        // reload projects in explorer
        const event = new CustomEvent("reload-projects");
        this.dispatchEvent(event);
      } else {
        // error deleting project
        this.showToast("Error deleting project!");
      }
    });
  }

  getComponentGitHubURL(component) {
    if(component.externalDependencyId) return component.gitHubURL;
    if(component.dependencyId) component = component.component;
    let type = component.type;
    if(type == "frontend") type = "frontendComponent";
    return "https://github.com/" + Static.GitHubOrg + "/" + type + "-" + component.versionedModelId;
  }

  /**
   * Returns the name of the component. This is different for the different types of components.
   * Note: Also dependencies are "components" here.
   * @param component
   * @returns {*}
   */
  getComponentName(component) {
    if(component.dependencyId) return component.component.name;
    if(component.externalDependencyId) return component.gitHubURL.split(".com/")[1];
    return component.name;
  }

  hasRequirementsBazaarURL(component) {
    if(component.dependencyId) {
      return component.component.reqBazCategoryId && component.component.reqBazCategoryId != -1;
    } else {
      return component.reqBazCategoryId && component.reqBazCategoryId != -1;
    }
  }

  getRequirementsBazaarURL(component) {
    let reqBazProjectId;
    let reqBazCategoryId;
    if(component.dependencyId) {
      reqBazProjectId = component.component.reqBazProjectId;
      reqBazCategoryId = component.component.reqBazCategoryId;
    } else {
      reqBazProjectId = component.reqBazProjectId;
      reqBazCategoryId = component.reqBazCategoryId;
    }

    return "https://requirements-bazaar.org/projects/" + reqBazProjectId + "/categories/" + reqBazCategoryId;
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

  /**
   * Since the project-info page uses lots of toast messages,
   * it is helpful to have this method for displaying warning toast messages.
   * It allows to have one single paper-toast item in the html which
   * gets used for different message texts.
   * @param text Text to display in the toast.
   */
  showWarningToast(text) {
    const toastElement = this.shadowRoot.getElementById("warning-toast");
    toastElement.text = text;
    toastElement.show();
  }

  getProjectId() {
    return this.selectedProject.id;
  }
}

customElements.define('project-info', ProjectInfo);
