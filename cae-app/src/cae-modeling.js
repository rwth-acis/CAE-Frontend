import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-button/paper-button.js';
import Common from "./util/common";
import MetamodelUploader from "./util/metamodel-uploader";
import './frontend-modeling.js';
import './microservice-modeling.js';
import './application-modeling.js';
import './requirements-bazaar-widget/requirements-bazaar-widget.js';
import './github-projects-widget/github-projects-widget.js';
import WidgetAccessEditor from "./util/role-based-access-management/widget-access-editor";
import WidgetConfigHelper from "./util/role-based-access-management/widget-config-helper";

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
        #side-menu-content {
          border-left: thin solid #e1e1e1;
          transition: width 0.5s;
        }
        #btn-close-side-menu:hover {
          color: #7c7c7c;
        }
        .icon {
          color: #000000;
        }
        .icon:hover {
          color: #7c7c7c;
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
          <div style="width: 35px; display: flex; flex-flow: column">
            <iron-icon id="btn-close-side-menu" style="width: 24px; height: 24px; margin-left: auto; margin-right: auto; margin-top: 0.5em; display: none" icon="icons:chevron-right"></iron-icon>
            <svg id="req-baz-icon" width="24px" height="24px" class="reqbaz-img" style="margin-left: auto; margin-right: auto; margin-top: 0.5em">
              <image xlink:href="https://requirements-bazaar.org/images/reqbaz-logo.svg" width="24px" height="24px"/>
            </svg>
            <svg id="github-projects-icon" width="24px" height="24px" class="github-img" style="margin-left: auto; margin-right: auto; margin-top: 0.5em">
              <image xlink:href="https://raw.githubusercontent.com/primer/octicons/e9a9a84fb796d70c0803ab8d62eda5c03415e015/icons/mark-github-16.svg" width="24px" height="24px"/>
            </svg>
            <iron-icon id="btn-widget-config" class="icon" style="width: 24px; height: 24px; margin-left: auto; margin-right: auto; margin-top: 0.5em" icon="icons:extension"></iron-icon>
          </div>
          <div id="side-menu-content" style="width: 0px">
            <!-- Gets added by JavaScript -->
          </div>
        </paper-card>
      </div>
    `;
  }

  static get properties() {
    return {
      page: {
        type: String,
        observer: '_subpageChanged'
      },
      menuOpen: {
        type: Boolean
      },
      currentModelingElement: {
        type: Object
      }
    };
  }

  ready() {
    super.ready();

    this.menuOpen = false;

    this.shadowRoot.getElementById("req-baz-icon").addEventListener("click", _ => {
      this.handleMenuItemClick("req-baz");
    });

    this.shadowRoot.getElementById("github-projects-icon").addEventListener("click", _ => {
      this.handleMenuItemClick("github-projects");
    });

    this.shadowRoot.getElementById("btn-widget-config").addEventListener("click", _ => {
      this.handleMenuItemClick("widget-config")
    });

    this.getButtonCloseSideMenuElement().addEventListener("click", _ => {
      this.closeSideMenu();
    });
  }

  /**
   * Gets called whenever one of the side menu items gets clicked.
   */
  handleMenuItemClick(menuItem) {
    if(!this.menuOpen)  {
      this.openSideMenu(menuItem);
    } else {
      this.displayMenuItemContent(menuItem);
    }
  }

  clearMenuContent() {
    while(this.getSideMenuContentElement().firstChild) {
      // check if method for clearing intervals exists
      if(typeof this.getSideMenuContentElement().firstChild.clearIntervals === "function") {
        this.getSideMenuContentElement().firstChild.clearIntervals();
      }
      this.getSideMenuContentElement().removeChild(this.getSideMenuContentElement().firstChild);
    }
  }

  openSideMenu(menuItem) {
    this.menuOpen = true;

    // show correct menu item
    this.displayMenuItemContent(menuItem);

    // show button for closing side menu
    this.getButtonCloseSideMenuElement().style.removeProperty("display");

    // open menu by changing the size of the menu content element
    this.getSideMenuContentElement().style.width = "300px";
  }

  displayMenuItemContent(menuItem) {
    this.clearMenuContent();
    if(menuItem == "req-baz") {
      // add Requirements Bazaar widget
      const reqBazWidget = document.createElement("requirements-bazaar-widget");
      reqBazWidget.setAttribute("id", "req-baz-widget");
      this.getSideMenuContentElement().appendChild(reqBazWidget);
    } else if(menuItem == "github-projects") {
      // add GitHub projects widget
      const gitHubProjectsWidget = document.createElement("github-projects-widget");
      gitHubProjectsWidget.setAttribute("id", "github-projects-widget");
      this.getSideMenuContentElement().appendChild(gitHubProjectsWidget);
    } else if(menuItem == "widget-config") {
      const widgetConfig = JSON.parse(Common.getCurrentlyOpenedModelingInfo().widgetConfig);
      // now we need to remove the view from the widget config, which are not relevant
      // we only want to have the currently opened view displayed in the access editor
      // => for more information see the documentation of the removeNotOpenedViewsFromConfig method
      WidgetConfigHelper.removeNotOpenedViewsFromConfig(widgetConfig);
      const editor = new WidgetAccessEditor(widgetConfig, function() {
        // gets called when a checkbox changed
        // store updated widget config in localStorage
        const modelingInfo = Common.getModelingInfo();
        modelingInfo[Common.getComponentTypeByVersionedModelId(Common.getVersionedModelId())].widgetConfig = JSON.stringify(widgetConfig);
        Common.storeModelingInfo(modelingInfo);

        this.currentModelingElement.updateWidgetConfig();
      }.bind(this));

      // get HTML element of the editor and add some margin
      const editorHTML = editor.getHTMLElement();
      editorHTML.style.setProperty("margin-left", "0.5em");
      editorHTML.style.setProperty("margin-right", "0.5em");
      for(const elem of editorHTML.getElementsByTagName("h3")) elem.style.setProperty("margin-top", "0.5em");

      // add the editor HTML element to the side menu
      this.getSideMenuContentElement().appendChild(editorHTML);
    }
  }

  closeSideMenu() {
    this.menuOpen = false;

    // hide button for closing side menu
    this.getButtonCloseSideMenuElement().style.setProperty("display", "none");

    this.getSideMenuContentElement().style.width = "0px";
    this.clearMenuContent();
  }

  getSideMenuContentElement() {
    return this.shadowRoot.getElementById("side-menu-content");
  }

  getButtonCloseSideMenuElement() {
    return this.shadowRoot.getElementById("btn-close-side-menu");
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
    const modelingElement = this.createNewModelingElement(type);
    div.appendChild(modelingElement);
    this.currentModelingElement = modelingElement;

    // also clear the content of the menu
    this.clearMenuContent();
    this.closeSideMenu();
  }
}

window.customElements.define('cae-modeling', CaeModeling);
