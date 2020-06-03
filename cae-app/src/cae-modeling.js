import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-button/paper-button.js';
import Common from "./common";
import MetamodelUploader from "./metamodel-uploader";

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
      
      <p id="currentRoom">Current Space: Test</p>
      
      <app-location route="{{route}}"></app-location>
      <app-route route="{{route}}" pattern="/cae-modeling/:page" data="{{routeData}}"></app-route>
      <iron-pages selected="[[page]]" attr-for-selected="name" selected-attribute="visible" fallback-selection="404">
        <frontend-modeling name="frontend-modeling"></frontend-modeling>
        <microservice-modeling name="microservice-modeling"></microservice-modeling>
        <application-modeling name="application-modeling"></application-modeling>
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
    switch (currentSubpage) {
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
        this.page = 'cae-modeling';
    }
  }

  ready() {
    super.ready();
    this.displayCurrentRoomName();
  }

  /**
   * Displays the currently used room name.
   * TODO: maybe this is not really needed in the final CAE, but for development it is helpful
   */
  displayCurrentRoomName() {
    var spaceHTML = "";
    if (Common.getYjsRoomName()) {
      spaceHTML = `<span style="font-weight: bold;">Current Space:</span> ${Common.getYjsRoomName()}`;
    } else {
      spaceHTML = "Please enter a space!";
    }
    this.shadowRoot.querySelector('#currentRoom').innerHTML = spaceHTML;
  }
}

window.customElements.define('cae-modeling', CaeModeling);
