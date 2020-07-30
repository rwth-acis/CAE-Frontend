import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-button/paper-button.js';
import Common from "./util/common";
import MetamodelUploader from "./util/metamodel-uploader";
import './frontend-modeling.js';
import './microservice-modeling.js';
import './application-modeling.js';
import './requirements-bazaar-widget/requirements-bazaar-widget.js';

/**
 * PolymerElement for the modeling page of the CAE.
 * This element contains the modeling with the three different
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
        .reqbaz-img {
          background: #447500;
        }
        .reqbaz-img:hover {
          background: #65ab00;
        }
        #main {
          transition: all .5s linear;
        }
        #side-menu {
          
        }
        #side-menu-content {
          border-left: thin solid #e1e1e1;
          transition: width 0.5s;
        }
      </style>
      
      <app-location route="{{route}}"></app-location>
      <app-route route="{{route}}" pattern="/cae-modeling/:page" data="{{routeData}}"></app-route>
      <div style="display: flex">
        <div id="main" style="flex: 1">
          <iron-pages id="iron-pages" selected="[[page]]" style="flex: 1" attr-for-selected="name" selected-attribute="visible" fallback-selection="404">
            <div name="404"><p>Could not find page.</p></div>
            <div name="frontend-modeling" id="frontend-modeling"></div>
            <div name="microservice-modeling" id="microservice-modeling"></div>
            <div name="application-modeling" id="application-modeling"></div>
          </iron-pages>
        </div>
        
        <paper-card id="side-menu" style="display: flex; margin-top: 0.5em; margin-left: 0.2em">
          <div style="width: 35px; display: flex">
            <svg id="req-baz-icon" width="24px" height="24px" class="reqbaz-img" style="margin-left: auto; margin-right: auto; margin-top: 0.5em">
              <image xlink:href="https://requirements-bazaar.org/images/reqbaz-logo.svg" width="24px" height="24px"/>
            </svg>
          </div>
          <div id="side-menu-content" style="width: 0px">
            <!-- Gets added by JavaScript -->
          </div>
        </paper-card>
      </div>
    `;
  }

  ready() {
    super.ready();

    let menuOpen = false;

    this.reloadMenuContent();

    this.shadowRoot.getElementById("req-baz-icon").addEventListener("click", _ => {
      if(!menuOpen) this.openSideMenu();
      else this.closeSideMenu();
      menuOpen = !menuOpen;
    });
  }

  reloadMenuContent() {
    // clear menu content
    while(this.getSideMenuContentElement().firstChild) this.getSideMenuContentElement().removeChild(this.getSideMenuContentElement().firstChild);

    // add Requirements Bazaar widget
    const reqBazWidget = document.createElement("requirements-bazaar-widget");
    reqBazWidget.setAttribute("id", "req-baz-widget");
    reqBazWidget.style.setProperty("display", "none");
    this.getSideMenuContentElement().appendChild(reqBazWidget);
  }

  openSideMenu() {
    this.shadowRoot.getElementById("req-baz-widget").style.removeProperty("display");
    this.getSideMenuContentElement().style.width = "300px";
  }

  closeSideMenu() {
    this.getSideMenuContentElement().style.width = "0px";
    this.shadowRoot.getElementById("req-baz-widget").style.setProperty("display", "none");
  }

  getSideMenuElement() {
    return this.shadowRoot.getElementById("side-menu");
  }

  getSideMenuContentElement() {
    return this.shadowRoot.getElementById("side-menu-content");
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

    // also reload the content of the menu (e.g. requirements bazaar widget needs to adapt to different component)
    this.reloadMenuContent();
    this.closeSideMenu();
  }
}

window.customElements.define('cae-modeling', CaeModeling);
