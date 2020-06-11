import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import 'las2peer-frontend-statusbar/las2peer-frontend-statusbar.js';
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';
import '@polymer/iron-pages/iron-pages.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-card/paper-card.js';
import './project-management/project-management.js';
import './cae-modeling.js';
import Auth from "./auth";
import Static from "./static";
import Common from "./common";

/**
 * CaeStaticApp is the main PolymerElement of the CAE.
 * It is used for displaying the las2peer frontend statusbar and
 * for either showing the project management or the modeling.
 * @customElement
 * @polymer
 */
class CaeStaticApp extends PolymerElement {
  static get template() {
    return html`
      <style>
        #cae-statusbar{
          display: inline-block;
          width: 100%;
          height: 2em;
          margin-top: 4px;
        }
        a {
          text-decoration: none;
          color: inherit;
        }
        .vl {
          border-left: 2px solid #e6e6e6;
          height: 1em;
          margin-top: auto;
          margin-bottom: auto;
          margin-left: 0.5em;
          margin-right: 0.5em;
        }
        .settings-icon {
          color: #c6c6c6;
        }
        .settings-icon:hover {
          color: #9d9d9d;
        }
      </style>

      <las2peer-frontend-statusbar
        id="statusBar"
        service="Community Application Editor"
        oidcpopupsigninurl="/callbacks/popup-signin-callback.html"
        oidcpopupsignouturl="/callbacks/popup-signout-callback.html"
        oidcsilentsigninturl="/callbacks/silent-callback.html"
        oidcclientid="f1412b21-0657-484a-9edb-39ed52e880ee"
        suppresswidgeterror="true"
        autoAppendWidget=true
      ></las2peer-frontend-statusbar>
      
      <paper-card id="cae-statusbar">
        <div style="width: 100%; height: 100%; display: flex">
          <a href="/project-management" style="margin-left: 2em; margin-top: auto; margin-bottom: auto">Project Management</a>
          <div class="vl"></div>
          <a href="/cae-modeling/frontend-modeling" style="margin-top: auto; margin-bottom: auto">Frontend Modeling</a>
          <div class="vl"></div>
          <a href="/cae-modeling/microservice-modeling" style="margin-top: auto; margin-bottom: auto">Microservice Modeling</a>
          <div class="vl"></div>
          <a href="/cae-modeling/application-modeling" style="margin-top: auto; margin-bottom: auto">Application Modeling</a>
          
          <iron-icon id="settings-button" icon="settings" class="settings-icon" style="margin-left: auto; margin-right: 2em; margin-top: auto; margin-bottom: auto"></iron-icon>
        </div>
      </paper-card>
      
      <!-- app-location binds to the url of the app -->
      <app-location route="{{route}}"></app-location>
      
      <!-- this app-route manages the top-level routes i.e. if the url ends with /x/y,
           then only x is managed by this app-route. In this case, x would also be the value of
           routeData.view.-->
      <app-route route="{{route}}" pattern="/:view" data="{{routeData}}" tail="{{subroute}}"></app-route>
      <iron-pages selected="[[view]]" attr-for-selected="name" fallback-selection="404">
        <project-management id="project-management" name="project-management"></project-management>
        <cae-modeling name="cae-modeling" route="{{subroute}}"></cae-modeling>
        <p name="404">Not found!</p>
      </iron-pages>
      
      <paper-dialog id="dialog-settings" modal>
        <h4>Settings</h4>
        <div>
        Here you can enter your GitHub name. This name will be used to grant access to GitHub projects.
        <paper-input id="input-github-username" placeholder="GitHub Username"></paper-input>
        </div>
        <div class="buttons">
          <paper-button dialog-dismiss>Cancel</paper-button>
          <paper-button id="settings-button-save" dialog-confirm autofocus>Save</paper-button>
        </div>
      </paper-dialog>
    `;
  }

  static get properties() {
    return {
      view: {
        type: String
      }
    };
  }

  static get observers(){
    return ['_viewChanged(routeData.view)'];
  }

  _viewChanged(view) {
    this.view = view || 'project-management';
    console.log("_viewChanged to view: " + this.view);
  }

  ready() {
    super.ready();
    const statusBar = this.shadowRoot.querySelector("#statusBar");
    // in the following we use (event) => this.method(event) in order to be able to access
    // this.shadowRoot in the handleLogin and handleLogout methods
    statusBar.addEventListener('signed-in', (event) => this.handleLogin(event));
    statusBar.addEventListener('signed-out', (event) => this.handleLogout(event));

    const projectManagement = this.shadowRoot.getElementById("project-management");
    projectManagement.addEventListener('change-view', (event) => {
      this.set("route.path", event.detail.view);
    });

    const settingsButton = this.shadowRoot.getElementById("settings-button");
    settingsButton.addEventListener('click', _ => this._onSettingsButtonClicked());

    const settingsButtonSave = this.shadowRoot.getElementById("settings-button-save");
    settingsButtonSave.addEventListener('click', _ => this._onSaveSettingsClicked());
  }

  handleLogin(event) {
    Auth.setAuthDataToLocalStorage(event.detail.access_token);

    // notify project management service about user login
    // if the user is not yet registered, then the project management service will do this
    this.loadCurrentUser();

    // when removing this line, we get a problem because some
    // user services used by the las2peer-frontend-statusbar cannot be accessed
    //location.reload();

    // since location.reload() is not called anymore, it is necessary
    // to reload the project management manually, since otherwise the "Please login"
    // message does not disappear.
    this.shadowRoot.getElementById("project-management").requestUpdate();
  }

  loadCurrentUser() {
    fetch(Static.ProjectManagementServiceURL + "/users/me", {
      headers: Auth.getAuthHeader()
    })
      .then(response => response.json())
      .then(data => {
        // store to localStorage
        Common.storeUserInfo(data);
      });
  }

  handleLogout() {
    Auth.removeAuthDataFromLocalStorage();
  }

  /**
   * Gets called when the settings button gets clicked.
   * @private
   */
  _onSettingsButtonClicked() {
    // open settings dialog
    this.getSettingsDialog().open();

    // put currently stored github username into input field
    const gitHubUsername = Common.getUsersGitHubUsername();
    this.getSettingsGitHubUsernameInput().value = gitHubUsername;
  }

  /**
   * Gets called when the user clicks on the save button in the
   * settings dialog.
   * @private
   */
  _onSaveSettingsClicked() {
    // get entered github username
    const gitHubUsername = this.getSettingsGitHubUsernameInput().value;

    if(gitHubUsername) {
      // check if it is different from the one stored in localStorage
      if(gitHubUsername != Common.getUsersGitHubUsername()) {
        // github username got changed
        // update it in database
        fetch(Static.ProjectManagementServiceURL + "/users", {
          method: "PUT",
          headers: Auth.getAuthHeader(),
          body: JSON.stringify({
            "gitHubUsername": gitHubUsername
          })
        }).then(response => {
          if(response.ok) {
            // reload user data (because then it gets updated in localStorage too)
            this.loadCurrentUser();
          }
        });
      }
    }
  }

  getSettingsDialog() {
    return this.shadowRoot.getElementById("dialog-settings");
  }

  getSettingsGitHubUsernameInput() {
    return this.shadowRoot.getElementById("input-github-username");
  }
}

window.customElements.define('cae-static-app', CaeStaticApp);
