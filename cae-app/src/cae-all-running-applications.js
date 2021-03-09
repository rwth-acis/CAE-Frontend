import { html, PolymerElement } from "@polymer/polymer";
import "@polymer/paper-button";
import "./frontend-modeling.js";
import "./microservice-modeling.js";
import "./all-applications.js";
import "./application-modeling.js";
import "./requirements-bazaar-widget/requirements-bazaar-widget.js";
import "./github-projects-widget/github-projects-widget.js";

/**
 * PolymerElement for the modeling page of the CAE.
 * This element contains the modeling with the three different
 * sub-pages (frontend-modeling, microservice-modeling and application-modeling)
 * for modeling.
 * @customElement
 * @polymer
 */
class CaeAllRunningApplications extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
        paper-input {
          max-width: 300px;
        }
        paper-button {
          color: rgb(240, 248, 255);
          background: rgb(30, 144, 255);
          max-height: 30px;
        }
        paper-button:hover {
          color: rgb(240, 248, 255);
          background: rgb(65, 105, 225);
        }
        .reqbaz-img {
          background: #447500;
        }
        .reqbaz-img:hover {
          background: #65ab00;
        }
        #main {
          transition: all 0.5s linear;
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
      <app-route
        route="{{route}}"
        pattern="/cae-all-running-applications/:view"
        data="{{routeData}}"
      ></app-route>
      <div style="display: flex">
        <div id="main" style="flex: 1">
          <iron-pages
            id="iron-pages"
            selected="all-applications"
            style="flex: 1"
            attr-for-selected="id"
            selected-attribute="visible"
            fallback-selection="404"
          >
          <div name="404"><p>Could not find page.</p></div>
          <div name="all-applications" id="all-applications"></div>
          </iron-pages>
        </div>
      </div>
    `;
  }

  static get properties() {
    return {
      page: {
        type: String,
        observer: "_subpageChanged",
      },
    };
  }

  ready() {
    super.ready();
  }

  static get observers() {
    return ["_routerChanged(routeData.view)"];
  }

  _routerChanged(page) {
    this.page = page || "cae-all-running-applications";
  }
  createNewModelingElement(type) {
    const elem = document.createElement("all-applications");
    elem.setAttribute("name", "all-applications");
    elem.setAttribute("id", "all-applications");

    elem.addEventListener("reload-current-modeling-page", function() {
      this.reloadModelingElement(type);
    }.bind(this));

    return elem;
  }
  _subpageChanged(currentSubpage, oldSubpage) {

    if (currentSubpage == "all-applications") {
      this.reloadModelingElement("all-applications");
      // check if div in iron-pages is empty
      let ironPagesDivName = currentSubpage;
      const hasChildNodes = this.shadowRoot
        .getElementById(ironPagesDivName)
        .hasChildNodes();
      // if the div is empty, then the page got reloaded and the div is empty, so no modeling page would be shown
      // this should be prevented
      if (!hasChildNodes) {
        this.reloadModelingElement("all-applications");
        // split makes "frontend-modeling" to "frontend" etc.
      }
    }
  }
  reloadModelingElement(type) {
    let div = this.shadowRoot.getElementById("all-applications");
    const modelingElement = this.createNewModelingElement(type);
    div.appendChild(modelingElement);
    this.currentModelingElement = modelingElement;
  }
}

window.customElements.define("cae-all-running-applications", CaeAllRunningApplications);
