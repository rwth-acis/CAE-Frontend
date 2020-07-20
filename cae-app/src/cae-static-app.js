import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import 'las2peer-frontend-statusbar/las2peer-frontend-statusbar.js';
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';
import '@polymer/iron-pages/iron-pages.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-card/paper-card.js';
import './project-management/project-management.js';
import './cae-modeling.js';
import './notifications/notification-element.js';
import Auth from "./util/auth";
import Static from "./static";
import Common from "./util/common";

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
        .icon {
          color: #000000;
        }
        .icon:hover {
          color: #7c7c7c;
        }
      </style>
      
      <custom-style>
        <style is="custom-style">
          .badge-blue {
            --paper-badge-background: rgb(30,144,255);
          }
        </style>
      </custom-style>

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
          <a id="menu-frontend-modeling" style="margin-top: auto; margin-bottom: auto">Frontend Modeling</a>
          <div class="vl"></div>
          <a id="menu-microservice-modeling" style="margin-top: auto; margin-bottom: auto">Microservice Modeling</a>
          <div class="vl"></div>
          <a id="menu-application-modeling" style="margin-top: auto; margin-bottom: auto">Application Mashup</a>
          
          <iron-icon id="notifications-button" icon="mail" class="icon" style="margin-left:auto; margin-top:auto; margin-bottom: auto"></iron-icon>
          <paper-badge id="notifications-badge" for="notifications-button" class="badge-blue" hidden></paper-badge>
          <iron-icon id="settings-button" icon="settings" class="icon" style="margin-left: 0.5em; margin-top: auto; margin-bottom: auto"></iron-icon>
          <iron-icon id="expand-collapse-statusbar-button" icon="icons:expand-less" class="icon" style="margin-left: 0.5em; margin-right: 1.5em; margin-top: auto; margin-bottom: auto"></iron-icon>
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
        <cae-modeling id="cae-modeling" name="cae-modeling" route="{{subroute}}"></cae-modeling>
        <notification-element id="notification-element" name="notifications"></notification-element>
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
      
      <!-- Generic Toast (see showToast method for more information) -->
      <paper-toast id="toast" text="Will be changed later."></paper-toast>
    `;
  }

  static get properties() {
    return {
      view: {
        type: String
      },
      statusBarExpanded: {
        type: Boolean
      },
      menuItemClickListener: {
        type: Function
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
    const statusBar = this.getStatusBarElement();
    // in the following we use (event) => this.method(event) in order to be able to access
    // this.shadowRoot in the handleLogin and handleLogout methods
    statusBar.addEventListener('signed-in', (event) => this.handleLogin(event));
    statusBar.addEventListener('signed-out', (event) => this.handleLogout(event));

    this.statusBarExpanded = true;
    const expandCollapseButton = this.shadowRoot.getElementById("expand-collapse-statusbar-button");
    expandCollapseButton.addEventListener('click', _ => {
      if(this.statusBarExpanded) {
        this.collapseStatusBar();
      } else {
        this.expandStatusBar();
      }
      this.statusBarExpanded = !this.statusBarExpanded;
    });
    // hide second status bar if users not logged in
    if(!Auth.isAccessTokenAvailable()) {
      this.getCaeStatusbar().setAttribute("hidden", "");
    }

    const projectManagement = this.shadowRoot.getElementById("project-management");
    projectManagement.addEventListener('change-view', (event) => {
      this.set("route.path", event.detail.view);
    });
    // update-menu event gets fired from project-info when selecting/entering components
    projectManagement.addEventListener('update-menu', (event) => {
      // get type of the component that got selected/entered in project-info
      const componentType = event.detail.componentType;
      // reload cae room for component type
      // because as an example when opening a frontend component while a
      // frontend component is already opened, then the cae room needs to be updated
      this.reloadCaeRoom(componentType);

      this.updateMenu();
    });

    const settingsButton = this.shadowRoot.getElementById("settings-button");
    settingsButton.addEventListener('click', _ => this._onSettingsButtonClicked());

    const settingsButtonSave = this.shadowRoot.getElementById("settings-button-save");
    settingsButtonSave.addEventListener('click', _ => this._onSaveSettingsClicked());

    const notificationsButton = this.getNotificationsButton();
    notificationsButton.addEventListener('click', _ => this._onNotificationsButtonClicked());

    // add listener for reloading notifications
    this.getNotificationElement().addEventListener('reload-notifications', _ => this.loadUsersNotifications());
    // add listener for reloading users projects
    this.getNotificationElement().addEventListener('reload-users-projects', _ => projectManagement.getProjectExplorer().showProjects(false));

    // load notifications every x seconds (currently set to every 10 seconds)
    window.setInterval(() => {
      if(Auth.isAccessTokenAvailable()) {
        this.loadUsersNotifications();
      } else {
        this.handleLogout();
      }
    }, 10000);

    // check if information on modelingInfo is stored
    if(Common.getModelingInfo() == undefined) {
      this.storeEmptyModelingInfo();
    }

    this.updateMenu();
  }

  /**
   * Loads the modeling info from localStorage and
   * depending on that shows or hides the menu items for the components.
   */
  updateMenu() {
    const modelingInfo = Common.getModelingInfo();

    // set event listener for click event
    this.setMenuItemClickListener("frontend");
    this.setMenuItemClickListener("microservice");
    this.setMenuItemClickListener("application");

    // show or hide component in the menu (depending on if the component is opened or not)
    this.isComponentOpened("frontend") ? this.showMenuItem("frontend") : this.hideMenuItem("frontend");
    this.isComponentOpened("microservice") ? this.showMenuItem("microservice") : this.hideMenuItem("microservice");
    this.isComponentOpened("application") ? this.showMenuItem("application") : this.hideMenuItem("application");
  }

  /**
   * Stores a modelingInfo to localStorage where no component is
   * currently opened.
   */
  storeEmptyModelingInfo() {
    const modelingInfo = {
      "frontend": null,
      "microservice": null,
      "application": null
    };
    Common.storeModelingInfo(modelingInfo);
  }

  handleLogin(event) {
    Auth.setAuthDataToLocalStorage(event.detail.access_token);

    this.storeEmptyModelingInfo();
    this.updateMenu();

    // notify project management service about user login
    // if the user is not yet registered, then the project management service will do this
    this.loadCurrentUser().then(_ => {
      var url = localStorage.userinfo_endpoint + '?access_token=' + localStorage.access_token;
      fetch(url, {method: "GET"}).then(response => {
        if(response.ok) {
          return response.json();
        }
      }).then(data => {
        const userInfo = Common.getUserInfo();
        userInfo.sub = data.sub;
        Common.storeUserInfo(userInfo);
      });
    });

    // show statusbar again
    this.getCaeStatusbar().removeAttribute("hidden");

    // set project-management as current page
    // Reason: when the user logged out in modeling, then after login the user
    // should start with project management page again
    this.set("route.path", "/");

    // when removing this line, we get a problem because some
    // user services used by the las2peer-frontend-statusbar cannot be accessed
    //location.reload();

    // since location.reload() is not called anymore, it is necessary
    // to reload the project management manually, since otherwise the "Please login"
    // message does not disappear.
    this.shadowRoot.getElementById("project-management").requestUpdate();
  }

  handleLogout() {
    Auth.removeAuthDataFromLocalStorage();

    // hide cae statusbar
    this.getCaeStatusbar().setAttribute("hidden", "");

    // update project management, because then it shows the login hint
    this.shadowRoot.getElementById("project-management").requestUpdate();

    // remove userInfo from localStorage
    Common.removeUserInfoFromStorage();
  }

  loadCurrentUser() {
    return new Promise(function(resolve, reject) {
      fetch(Static.ProjectManagementServiceURL + "/users/me", {
        headers: Auth.getAuthHeader()
      })
        .then(response => response.json())
        .then(data => {
          // store to localStorage
          Common.storeUserInfo(data);
          resolve();
        });
    });
  }

  /**
   * Loads the notifications/invitations that the user received.
   */
  loadUsersNotifications() {
    console.log("Requesting notifications from server...");
    fetch(Static.ProjectManagementServiceURL + "/invitations", {
      method: "GET",
      headers: Auth.getAuthHeader()
    }).then(response => {
      if(response.ok) {
        return response.json();
      } else if(response.status == "401") {
        // user is not authorized
        // maybe the access token has expired
        Auth.removeAuthDataFromLocalStorage();
        location.reload();
      }
    }).then(data => {
      if(data) {
        const notificationsBadge = this.getNotificationsBadge();
        if(data.length > 0) {
          // show badge
          notificationsBadge.removeAttribute("hidden");
          // calling updatePosition, otherwise the position is not correct
          notificationsBadge.updatePosition();

          notificationsBadge.label = data.length;
        } else {
          // hide badge
          notificationsBadge.setAttribute("hidden", "");
        }

        // notify notification-element about the new notification data
        this.getNotificationElement().setInvitations(data);
      }
    });
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
            // update in localStorage
            const userInfo = Common.getUserInfo();
            userInfo.gitHubUsername = gitHubUsername;
            Common.storeUserInfo(userInfo);
          }
        });
      }
    }
  }

  /**
   * Expands the top status bar.
   */
  expandStatusBar() {
    const button = this.shadowRoot.getElementById("expand-collapse-statusbar-button");
    button.setAttribute("icon", "icons:expand-less");

    this.getStatusBarElement().removeAttribute("hidden");
  }

  /**
   * Collapses the top status bar.
   */
  collapseStatusBar() {
    const button = this.shadowRoot.getElementById("expand-collapse-statusbar-button");
    button.setAttribute("icon", "icons:expand-more");

    this.getStatusBarElement().setAttribute("hidden", "");
  }

  _onNotificationsButtonClicked() {
    this.set("route.path", "notifications");
  }

  getStatusBarElement() {
    return this.shadowRoot.querySelector("#statusBar");
  }

  getSettingsDialog() {
    return this.shadowRoot.getElementById("dialog-settings");
  }

  getSettingsGitHubUsernameInput() {
    return this.shadowRoot.getElementById("input-github-username");
  }

  getNotificationsButton() {
    return this.shadowRoot.getElementById("notifications-button");
  }

  getNotificationsBadge() {
    return this.shadowRoot.getElementById("notifications-badge");
  }

  getNotificationElement() {
    return this.shadowRoot.getElementById("notification-element");
  }

  /**
   * Hides the given menu item.
   * Hiding means changing the color and changing the click listener, so that
   * a click results in a toast message notifiying the user that no component of the
   * given type is opened.
   * @param menuItem
   */
  hideMenuItem(menuItem) {
    const menuElement = this.shadowRoot.getElementById("menu-" + menuItem + "-modeling");
    menuElement.style.setProperty("color", "#e6e6e6");
    menuElement.removeAttribute("href");
  }

  /**
   * Notifies the cae-modeling to reload the modeling element of the given type.
   * This "reloading" is needed to reload the widgets that are connected to a Yjs room.
   * Reloading then allows to change the Yjs room that the widgets are using.
   * @param type
   */
  reloadCaeRoom(type) {
    const modelingElement = this.shadowRoot.getElementById("cae-modeling");
    modelingElement.reloadModelingElement(type);
  }

  /**
   * Shows the given menu item.
   * Sets click listener and removes color.
   * @param menuItem
   */
  showMenuItem(menuItem) {
    const menuElement = this.shadowRoot.getElementById("menu-" + menuItem + "-modeling");
    menuElement.style.removeProperty("color");
  }

  setMenuItemClickListener(menuItem) {
    const menuElement = this.shadowRoot.getElementById("menu-" + menuItem + "-modeling");
    menuElement.addEventListener('click', _ => this.menuItemClick(menuItem));
  }

  /**
   * Depending on whether a component of the given type is opened or not,
   * it opens the corresponding modeling space or shows a toast message
   * that no component of the type is opened yet.
   * @param menuItemComponentType
   */
  menuItemClick(menuItemComponentType) {
    const modelingInfo = Common.getModelingInfo();
    if(this.isComponentOpened(menuItemComponentType)) {
      // update versionedModelId in localStorage
      const versionedModelId = modelingInfo[menuItemComponentType].versionedModelId;
      Common.setVersionedModelId(versionedModelId);

      // update GitHub repo name in localStorage
      const repoPrefix = menuItemComponentType == "frontend" ? "frontendComponent" : menuItemComponentType;
      Common.setGitHubRepoName(repoPrefix + "-" + versionedModelId);

      // click should open modeling space
      this.reloadCaeRoom(menuItemComponentType);
      this.set("route.path", "cae-modeling/" + menuItemComponentType + "-modeling");
    } else {
      // component is not opened
      // show toast message
      this.showToast("You need to open a component of the given type first.");
    }
  }

  /**
   * Checks if a component of the given type is opened, i.e. information
   * on it is stored in localStorage.
   * @param type
   * @returns {boolean}
   */
  isComponentOpened(type) {
    const modelingInfo = Common.getModelingInfo();
    if(type == "frontend") {
      return modelingInfo.frontend != null;
    } else if(type == "microservice") {
      return modelingInfo.microservice != null;
    } else if(type == "application") {
      return modelingInfo.application != null;
    }
  }

  /**
   * Since the cae-static-app page uses lots of toast messages,
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

  getCaeStatusbar() {
    return this.shadowRoot.getElementById("cae-statusbar");
  }
}

window.customElements.define('cae-static-app', CaeStaticApp);
