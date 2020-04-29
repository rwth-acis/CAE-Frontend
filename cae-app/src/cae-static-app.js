import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import 'las2peer-frontend-statusbar/las2peer-frontend-statusbar.js';
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';
import '@polymer/iron-pages/iron-pages.js';
import '@polymer/paper-button/paper-button.js';
import Common from './common.js';
import MetamodelUploader from './metamodel-uploader.js';

/**
 * @customElement
 * @polymer
 */
class CaeStaticApp extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
        paper-input {
          max-width: 300px;    
        }
        paper-button{
          color: rgb(240,248,255);
          background: rgb(30,144,255);
          max-height: 30px;
        }
        paper-button:hover{
          color: rgb(240,248,255);
          background: rgb(65,105,225);
        }
        #yjsroomcontainer {
          display: flex;
          margin: 5px;
          flex: 1;
          align-items: center;
        }
        .loader {
          border: 5px solid #f3f3f3; /* Light grey */
          border-top: 5px solid #3498db; /* Blue */
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 2s linear infinite;
          display:none;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>

      <las2peer-frontend-statusbar
        id="statusBar"
        service="Community Application Editor"
        oidcpopupsigninurl="/callbacks/popup-signin-callback.html"
        oidcpopupsignouturl="/callbacks/popup-signout-callback.html"
        oidcsilentsigninturl="/callbacks/silent-callback.html"
        oidcclientid="{OIDC_CLIENT_ID}"
        autoAppendWidget=true
      ></las2peer-frontend-statusbar>    

      <p id="currentRoom">Current Space: Test</p>
      <div id="yjsroomcontainer">
        <paper-input always-float-label label="Space"></paper-input>
        <paper-button on-click="_onChangeButtonClicked">Enter</paper-button>
        <div class="loader" id="roomEnterLoader"></div> 
      </div>

      <app-location route="{{route}}"></app-location>
      <app-route route="{{route}}" pattern="/:page" data="{{routeData}}" tail="{{subroute}}"></app-route>
      <ul>
        <li> <a href="/frontend-modeling">Frontend Modeling</a> </li>
        <li> <a href="/microservice-modeling">Microservice Modeling</a> </li>
        <li> <a href="/application-modeling">Application Modeling</a> </li>
      </ul>
      <iron-pages selected="[[page]]" attr-for-selected="name" selected-attribute="visible" fallback-selection="404">
        <frontend-modeling name="frontend-modeling"></frontend-modeling>
        <microservice-modeling name="microservice-modeling"></microservice-modeling>
        <application-modeling name="application-modeling"></application-modeling>
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
    this.page = page || 'cae-static-app';
  }

  /* this pagechanged triggers for simple onserver written in page properties written above */
  _pageChanged(currentPage, oldPage){
    switch(currentPage){
    case 'frontend-modeling':
      import('./frontend-modeling.js').then()
      break;
    case 'microservice-modeling':
      import('./microservice-modeling.js').then()
      break;
    case 'application-modeling':
      import('./application-modeling.js').then()
      break;
    default:
      this.page = 'cae-static-app';
    }
  }

  ready() {
    super.ready();
    const statusBar = this.shadowRoot.querySelector("#statusBar");
    statusBar.addEventListener('signed-in', this.handleLogin);
    statusBar.addEventListener('signed-out', this.handleLogout);
    this.displayCurrentRoomName();
  }

  _onChangeButtonClicked() {
    var caeRoomName = this.shadowRoot.querySelector('paper-input').value;
    Common.setYjsRoomName(caeRoomName);
    var loader = this.shadowRoot.querySelector("#roomEnterLoader");
    this.changeVisibility(loader, true);
    MetamodelUploader.uploadAll()
      .then(_ => new Promise((resolve, reject) => {
        // wait for data become active
        setTimeout(_ => resolve(), 2000);
      }))
      .then(_ => location.reload());
  }

  handleLogin(event) {
    localStorage.setItem("access_token", event.detail.access_token);
    localStorage.setItem("userinfo_endpoint", "https://api.learning-layers.eu/o/oauth2/userinfo");
    location.reload();
  }

  handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("userinfo_endpoint");
  }

  displayCurrentRoomName() {
    var spaceHTML = "";
    if (Common.getYjsRoomName()) {
      spaceHTML = `<span style="font-weight: bold;">Current Space:</span> ${Common.getYjsRoomName()}`;
    } else {
      spaceHTML = "Please enter a space!";
    }
    this.shadowRoot.querySelector('#currentRoom').innerHTML = spaceHTML;
  }

  changeVisibility(item, show) {
    if (show) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  } 
}

window.customElements.define('cae-static-app', CaeStaticApp);