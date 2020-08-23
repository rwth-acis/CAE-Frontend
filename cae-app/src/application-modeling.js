import {LitElement, html} from "lit-element";
import Common from './util/common.js';
import Static from "./static.js";
import './deployment-widget/deployment-widget.js';
import './select-widget/component-select-widget.js';
import SyncMetaSwitchHelper from "./util/syncmeta-switch-helper";
import WidgetConfigHelper from "./util/role-based-access-management/widget-config-helper";

/**
 * @customElement
 * @polymer
 */
class ApplicationModeling extends LitElement {
  render() {
    return html`
    <style>
      :host {
          font-family: Roboto;
      }

      .maincontainer { 
        display: flex;
        height: 600px;
        flex-flow: row wrap;
      }
      
      .flex-item {
        flex: 1 1 0%;
        margin: 5px;
      }
      
      #div-canvas {
        flex: 3 1 0%;
        min-width: 300px;
      }
      
      #versioning-widget {
        flex: 2 1 0%;
      }
      
      #triple-div {
        flex: 2 1 0%;
      }
     
      paper-tabs {
        --paper-tabs-selection-bar-color: rgb(30,144,255);
      }
      
      .full-width {
        width: 100%;
      }
      .bordered {
        border-width: 2px;
        border-style: solid;
        border-color: #dddddd;
      }
    </style>
    <div class="maincontainer">
      <div id="div-canvas" class="widget flex-item" widgetconfigname="Modeling incl. Select">
        <iframe id="Canvas" class="bordered" style="width: 100%; height: 100%" src="${Static.WebhostURL}/syncmeta/widget.html"> </iframe>
      </div>
      <div id="triple-div" class="flex-item widget-config-container" style="display: flex; flex-direction: column; height: 600px">
        <!-- Component select widget -->
        <div id="comp-select" style="margin-bottom: 5px; flex: 1 1 0%; overflow-y: auto" class="bordered full-width widget" widgetconfigname="Modeling incl. Select">
          <div>
            <paper-tabs selected="0">
              <paper-tab @click=${(e) => this._onTabSelected(0)}>Frontend Components</paper-tab>
              <paper-tab @click=${(e) => this._onTabSelected(1)}>Microservices</paper-tab>
            </paper-tabs>
            <div>
              <component-select-widget componentType="frontend" id="Frontend Component Select Widget" style="height: inherit"></component-select-widget>
              <component-select-widget componentType="microservice" id="Microservice Select Widget" style="height: inherit"></component-select-widget>
            </div>
          </div>
        </div>
        <!-- Property Browser -->
        <div id="div-pb" style="margin-bottom: 10px; flex: 1 1 0%;" class="widget" widgetconfigname="Modeling incl. Select">
          <iframe id="Property Browser" class="bordered" style="width: 100%; height: 100%" src="${Static.WebhostURL}/syncmeta/attribute.html"> </iframe>
        </div>
        <!-- Deployment widget -->
        <div id="div-deploy" class="bordered full-width widget" style="flex: 1 1 0%;" widgetconfigname="Deployment">
          <deployment-widget id="deployment-widget"></deployment-widget>
        </div>
      </div>
      <versioning-element id="versioning-widget" class="widget flex-item" widgetconfigname="Versioning"></versioning-element>
      <iframe id="UserActivity" scrolling="no" class="bordered widget flex-item" widgetconfigname="Modeling incl. Select" src="${Static.WebhostURL}/syncmeta/activity.html"> </iframe>
      <iframe id="Matching Widget" class="widget bordered" style="padding: 5px; width: auto; height: 100%" widgetconfigname="Matching" scrolling="no" src="${Static.WebhostURL}/cae-frontend/matchingWidget/widget.html"> </iframe>
    </div>
    `;
  }

  constructor() {
    super();

    this.requestUpdate().then(_ => {
      parent.caeFrames = this.shadowRoot.querySelectorAll("iframe");

      this.reloadCaeRoom();

      new SyncMetaSwitchHelper(this.shadowRoot);

      if(Common.isCurrentComponentDependency()) {
        // disable committing in versioning widget
        this.shadowRoot.getElementById("versioning-widget").committingDisabled = true;
      }

      // in the beginning, the deployment widget is always disabled
      // if there exist at least one real commit (so not only the "uncommited changes" one), then
      // the deployment widget should be enabled
      this.shadowRoot.getElementById("versioning-widget").addEventListener("versioned-model-loaded", function(event) {
        if(event.detail.versionedModel.commits.length > 1) {
          this.shadowRoot.getElementById("deployment-widget").enableWidget();
        }
      }.bind(this));


      // listener for reloading of current modeling page
      // this is used, when the changes since the last commit should be undone
      this.shadowRoot.getElementById("versioning-widget").addEventListener("reload-current-modeling-page", function() {
        this.dispatchEvent(new CustomEvent("reload-current-modeling-page"));
      }.bind(this));

      this._onTabSelected(0);

      if(!Common.isCurrentComponentDependency()) {
        this.updateWidgetConfig();
      }
    });
  }

  updateWidgetConfig() {
    WidgetConfigHelper.updateWidgetConfig(this.shadowRoot);
  }

  reloadCaeRoom() {
    // load the current Yjs room name from localStorage into
    // parent.caeRoom variable (used by modeling/SyncMeta widget)
    const modelingInfo = Common.getModelingInfo();
    Common.setCaeRoom(modelingInfo.application.versionedModelId, modelingInfo.application.isDependency);
  }

  /**
   * Gets called when the selected tab for the select-widgets has changed.
   * @param index 0 or 1, depending on the tab.
   * @private
   */
  _onTabSelected(index) {
    if(index == 0) {
      this.getFrontendComponentSelectWidget().removeAttribute("hidden");
      this.getMicroserviceSelectWidget().hidden = true;
    } else {
      this.getFrontendComponentSelectWidget().hidden = true;
      this.getMicroserviceSelectWidget().removeAttribute("hidden");
    }
  }

  getFrontendComponentSelectWidget() {
    return this.shadowRoot.getElementById("Frontend Component Select Widget");
  }

  getMicroserviceSelectWidget() {
    return this.shadowRoot.getElementById("Microservice Select Widget");
  }
}

window.customElements.define('application-modeling', ApplicationModeling);
