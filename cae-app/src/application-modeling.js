import {LitElement, html} from "lit-element";
import Common from './util/common.js';
import Static from "./static.js";
import './deployment-widget/deployment-widget.js';
import './select-widget/component-select-widget.js';
import SyncMetaSwitchHelper from "./util/syncmeta-switch-helper";

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
      iframe {
        width: 100%;
        height: 100%;
      }

      .maincontainer { 
        display: flex;
        height: 600px;
        flex-flow: row wrap;
      }

      .innercontainerfirst {
        margin: 5px;
        flex: 1;
        display: flex;
      }

      .innercontainerfirst:nth-of-type(1) {
        flex: 3;
        display: flex;
        flex-flow: column;
      }

      .innercontainerfirst:nth-of-type(2) {
        flex: 1;
        display: flex;
        flex-flow: column;
      }

      .innercontainerfirst:nth-of-type(3) {
        flex:2;
        display:flex;
        flex-flow:column;
      }
      
      .innercontainersecond {
        padding: 5px;
        margin: 5px;
        flex: 1;
      }
     
      paper-tabs {
        --paper-tabs-selection-bar-color: rgb(30,144,255);
      }
    </style>
    <div class="maincontainer">
      <div id="div-canvas" class="innercontainerfirst">
        <iframe id="Canvas" src="${Static.WebhostURL}/syncmeta/widget.html"> </iframe>
      </div>
      <div class="innercontainerfirst">
        <div>
          <div>
            <paper-tabs selected="0">
              <paper-tab @click=${(e) => this._onTabSelected(0)}>Frontend Components</paper-tab>
              <paper-tab @click=${(e) => this._onTabSelected(1)}>Microservices</paper-tab>
            </paper-tabs>
            <div style="flex: 1; height: 250px">
              <component-select-widget componentType="frontend" id="Frontend Component Select Widget" style="width: 100%; height: 100%"></component-select-widget>
              <component-select-widget componentType="microservice" id="Microservice Select Widget" style="width: 100%; height: 100%"></component-select-widget>
            </div>
          </div>
        </div>
        <div id="div-pb">
          <iframe id="Property Browser" src="${Static.WebhostURL}/syncmeta/attribute.html" style="height:150px"> </iframe>
        </div>
        <deployment-widget id="deployment-widget" style="flex: 1"></deployment-widget>
      </div>
      <div class="innercontainerfirst" style="display: flex; flex-flow: column">
        <versioning-element id="versioning-widget"></versioning-element>
      </div>
      <div class="innercontainerfirst">
        <iframe id="User Activity" scrolling="no" src="${Static.WebhostURL}/syncmeta/activity.html"> </iframe>
      </div>
    </div>
    <div class="maincontainer" style="height: 500px">
      <div class="innercontainersecond">
        <iframe id="Matching Widget" scrolling="no" src="${Static.WebhostURL}/cae-frontend/matchingWidget/widget.html"> </iframe>
      </div>
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
    });
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
