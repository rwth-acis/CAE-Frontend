
import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import Common from './util/common.js';
import Static from "./static.js";
import './deployment-widget/deployment-widget.js';
import SyncMetaSwitchHelper from "./util/syncmeta-switch-helper";

/**
 * @customElement
 * @polymer
 */
class ApplicationModeling extends PolymerElement {
  static get template() {
    return html`
    <style>
      iframe {
        width: 100%;
        height: 100%;
      }

      .maincontainer { 
        display: flex;
        height: 500px;
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
        flex: 2;
        display: flex;
        flex-flow: column;
      }

      .innercontainerfirst:nth-of-type(3) {
        flex:2;
        display:flex;
        flex-flow:column;
      }
    </style>
    <div class="maincontainer">
      <div id="div-canvas" class="innercontainerfirst">
        <iframe id="Canvas" src="{{Static.WebhostURL}}/syncmeta/widget.html"> </iframe>
      </div>
      <div class="innercontainerfirst">
        <div id="div-pb">
          <iframe id="Property Browser" src="{{Static.WebhostURL}}/syncmeta/attribute.html" style="height:150px"> </iframe>
        </div>
        <versioning-element id="versioning-widget"></versioning-element>
      </div>
      <div class="innercontainerfirst" style="display: flex; flex-flow: column">
        <div>
          <iframe id="Frontend Component Select Widget" src="{{Static.WebhostURL}}/cae-frontend/frontendComponentSelectWidget/widget.html"
              style="height: 250px"></iframe>
          <iframe id="Microservice Select Widget" src="{{Static.WebhostURL}}/cae-frontend/microserviceSelectWidget/widget.html"
              style="height: 250px"></iframe>
        </div>
        <deployment-widget id="deployment-widget" style="flex: 1"></deployment-widget>
        <!--
        <div style="flex:1;">
          <iframe id="Import Tool" src="{{Static.WebhostURL}}/syncmeta/debug.html"> </iframe>
        </div>
        -->
      </div>
      <div class="innercontainerfirst">
        <iframe id="User Activity" src="{{Static.WebhostURL}}/syncmeta/activity.html"> </iframe>
      </div>
    </div>
    `;
  }

  static get properties() {}

  ready() {
    super.ready();
    parent.caeFrames = this.shadowRoot.querySelectorAll("iframe");

    this.reloadCaeRoom();

    new SyncMetaSwitchHelper(this.shadowRoot);

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
  }

  reloadCaeRoom() {
    // load the current Yjs room name from localStorage into
    // parent.caeRoom variable (used by modeling/SyncMeta widget)
    const modelingInfo = Common.getModelingInfo();
    Common.setCaeRoom(modelingInfo.application.versionedModelId);
  }
}

window.customElements.define('application-modeling', ApplicationModeling);
