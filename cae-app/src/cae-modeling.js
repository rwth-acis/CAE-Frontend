import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-button/paper-button.js';
import Common from "./util/common";
import MetamodelUploader from "./util/metamodel-uploader";
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
        <div name="404"><p>Could not find page.</p></div>
        <div name="frontend-modeling" id="frontend-modeling"></div>
        <div name="microservice-modeling" id="microservice-modeling"></div>
        <div name="application-modeling" id="application-modeling"></div>
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

    if(currentSubpage == "frontend-modeling" || currentSubpage == "microservice-modeling" || currentSubpage == "application-modeling") {
      // check if div in iron-pages is empty
      let ironPagesDivName = currentSubpage;
      const hasChildNodes = this.shadowRoot.getElementById(ironPagesDivName).hasChildNodes();
      // if the div is empty, then the page got reloaded and the div is empty, so no modeling page would be shown
      // this should be prevented
      if(!hasChildNodes) {
        // split makes "frontend-modeling" to "frontend" etc.
        this.reloadModelingElement(ironPagesDivName.split("-")[0]);
      }
    }
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
    elem.setAttribute("name", type + "-modeling-element");
    elem.setAttribute("id", type + "-modeling-element");

    elem.addEventListener("reload-current-modeling-page", function() {
      this.reloadModelingElement(type);
    }.bind(this));

    return elem;
  }

  /**
   * Removes the modeling element of the given type.
   * @param type
   */
  removeModelingElement(type) {
    if(this.shadowRoot.getElementById(type + "-modeling-element") != null) {
      this.shadowRoot.getElementById(type + "-modeling-element").remove();
    }
  }

  /**
   * Reloads the modeling element with the given type.
   * This can be used in order to reload/change the Yjs room of the modeling element.
   * @param type
   */
  reloadModelingElement(type) {
    this.removeModelingElement(type);
    let div = this.shadowRoot.getElementById(type + "-modeling");
    div.appendChild(this.createNewModelingElement(type));
  }

  ready() {
    super.ready();
  }
}

window.customElements.define('cae-modeling', CaeModeling);
