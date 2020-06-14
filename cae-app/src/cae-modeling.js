import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-button/paper-button.js';
import Common from "./common";
import MetamodelUploader from "./metamodel-uploader";
import './frontend-modeling.js';
import './microservice-modeling.js';
import './application-modeling.js';

/**
 * PolymerElement for the modeling page of the CAE.
 * TODO: Update Documentation when functionality of this element is final.
 * This element will contain the modeling with the three different
 * sub-pages (frontend-modeling, microservice-modeling and application-modeling)
 * for modeling.
 * @customElement
 * @polymer
 */
class CaeModeling extends PolymerElement {
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
      
      <p id="currentRoom" style="display: none">Current Space: Test</p>
      
      <app-location route="{{route}}"></app-location>
      <app-route route="{{route}}" pattern="/cae-modeling/:page" data="{{routeData}}"></app-route>
      <iron-pages id="iron-pages" selected="[[page]]" attr-for-selected="name" selected-attribute="visible" fallback-selection="404">
        <!--<frontend-modeling id="frontend-modeling" name="frontend-modeling"></frontend-modeling>
        <microservice-modeling id="microservice-modeling" name="microservice-modeling"></microservice-modeling>
        <application-modeling id="application-modeling" name="application-modeling"></application-modeling>-->
      </iron-pages>
    `;
  }

  static get properties() {
    return {
      page:{
        type: String,
        observer: '_subpageChanged'
      }
    };
  }

  static get observers(){
    return ['_routerChanged(routeData.page)'];
  }

  _routerChanged(page){
    this.page = page || 'cae-modeling';
  }

  _subpageChanged(currentSubpage, oldSubpage) {
    console.log("subpage changed: " + currentSubpage);
    /*switch (currentSubpage) {
      case 'frontend-modeling':
        this.removeModelingElement("frontend");
        this.shadowRoot.getElementById("iron-pages").appendChild(this.createNewModelingElement("frontend"));
        break;
      case 'microservice-modeling':
        this.removeModelingElement("microservice");
        this.shadowRoot.getElementById("iron-pages").appendChild(this.createNewModelingElement("microservice"));
        break;
      case 'application-modeling':
        this.removeModelingElement("application");
        this.shadowRoot.getElementById("iron-pages").appendChild(this.createNewModelingElement("application"));
        break;
      default:
        this.page = 'cae-modeling';
    }*/
  }

  /**
   * Creates a new modeling element for the given type.
   * This is needed, because everytime a page gets opened, the
   * element must be replaced by a new one. Otherwise it is not
   * possible to switch the Yjs room.
   * @param type
   */
  createNewModelingElement(type) {
    const elem = document.createElement(type + "-modeling");
    elem.setAttribute("name", type + "-modeling");
    elem.setAttribute("id", type + "-modeling");
    return elem;
  }

  /**
   * Removes the modeling element of the given type.
   * @param type
   */
  removeModelingElement(type) {
    if(this.shadowRoot.getElementById(type + "-modeling") != null) {
      this.shadowRoot.getElementById(type + "-modeling").remove();
    }
  }

  /**
   * Reloads the modeling element with the given type.
   * This can be used in order to reload/change the Yjs room of the modeling element.
   * @param type
   */
  reloadModelingElement(type) {
    this.removeModelingElement(type);
    this.shadowRoot.getElementById("iron-pages").appendChild(this.createNewModelingElement(type));
  }

  ready() {
    super.ready();

    // the following line is commented, should only be visible while debugging
    // this.displayCurrentRoomName();
  }

  /**
   * Displays the currently used room name.
   * maybe this is not really needed in the final CAE, but for development it is helpful
   */
  displayCurrentRoomName() {
    const element = this.shadowRoot.querySelector('#currentRoom');
    element.removeAttribute("style");
    let spaceHTML = "";
    if (Common.getYjsRoomName()) {
      spaceHTML = `<span style="font-weight: bold;">Current Space:</span> ${Common.getYjsRoomName()}`;
    } else {
      spaceHTML = "Please enter a space!";
    }
    element.innerHTML = spaceHTML;
  }
}

window.customElements.define('cae-modeling', CaeModeling);
