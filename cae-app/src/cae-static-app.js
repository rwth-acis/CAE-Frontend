import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import 'las2peer-frontend-statusbar/las2peer-frontend-statusbar.js';
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';
import '@polymer/iron-pages/iron-pages.js';
import Auth from "./auth";

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
      <las2peer-frontend-statusbar
        id="statusBar"
        service="Community Application Editor"
        oidcpopupsigninurl="/callbacks/popup-signin-callback.html"
        oidcpopupsignouturl="/callbacks/popup-signout-callback.html"
        oidcsilentsigninturl="/callbacks/silent-callback.html"
        oidcclientid="f1412b21-0657-484a-9edb-39ed52e880ee"
        autoAppendWidget=true
      ></las2peer-frontend-statusbar>
      
      <app-location route="{{route}}"></app-location>
      <app-route route="{{route}}" pattern="/:page" data="{{routeData}}" tail="{{subroute}}"></app-route>
      <iron-pages selected="[[page]]" attr-for-selected="name" selected-attribute="visible" fallback-selection="404">
        <project-management name="project-management"></project-management>
        <cae-modeling name="cae-modeling" route="{{subroute}}"></cae-modeling>
      </iron-pages>
    `;
  }

  static get properties() {
    return {
      prop1: {
        type: String,
        value: 'cae-static-app'
      },
      page:{
        type: String,
        observer: '_pageChanged'
      }
    };
  }

  static get observers(){
    return ['_routerChanged(routeData.page)'];
  }

  _routerChanged(page){
    this.page = page || 'project-management';
  }

  /* this pagechanged triggers for simple onserver written in page properties written above */
  _pageChanged(currentPage, oldPage) {
    switch (currentPage) {
      case 'project-management':
        import('./project-management/project-management.js').then()
        break;
      case 'cae-modeling':
        import('./cae-modeling.js').then()
        break;
      default:
        this.page = 'project-management';
    }
  }

  ready() {
    super.ready();
    const statusBar = this.shadowRoot.querySelector("#statusBar");
    statusBar.addEventListener('signed-in', this.handleLogin);
    statusBar.addEventListener('signed-out', this.handleLogout);
  }

  handleLogin(event) {
    localStorage.setItem("access_token", event.detail.access_token);
    localStorage.setItem("userinfo_endpoint", "https://api.learning-layers.eu/o/oauth2/userinfo");

    // notify project management service about user login
    // if the user is not yet registered, then the project management service will do this
    // TODO: adjust url (should be configureable in docker run command)
    fetch("http://localhost:8080/project-management/users/me", {
      headers: Auth.getAuthHeader()
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
      });
    location.reload();
  }

  handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("userinfo_endpoint");
  }
}

window.customElements.define('cae-static-app', CaeStaticApp);
