
import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import Common from './common.js';
import Static from "./static.js";

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
      <div class="innercontainerfirst">
        <iframe id="Canvas" src="{{Static.WebhostURL}}/syncmeta/widget.html"> </iframe>
      </div>
      <div class="innercontainerfirst">
        <iframe id="Property Browser" src="{{Static.WebhostURL}}/syncmeta/attribute.html"> </iframe>
        <iframe id="Application Persistence Widget" src="{{Static.WebhostURL}}/cae-frontend/applicationPersistenceWidget/widget.html"> </iframe>
      </div>
      <div class="innercontainerfirst">
        <div style="display:flex;flex-flow:row;flex:1;">
          <div>
            <iframe id="Frontend Component Select Widget" src="{{Static.WebhostURL}}/cae-frontend/frontendComponentSelectWidget/widget.html"> </iframe>
          </div>
          <div>
            <iframe id="Microservice Select Widget" src="{{Static.WebhostURL}}/cae-frontend/microserviceSelectWidget/widget.html"> </iframe>
          </div>
        </div>
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
  }

  reloadCaeRoom() {
    // load the current Yjs room name from localStorage into
    // parent.caeRoom variable (used by modeling/SyncMeta widget)
    const modelingInfo = Common.getModelingInfo();
    Common.setCaeRoom(modelingInfo.application.versionedModelId);
  }
}

window.customElements.define('application-modeling', ApplicationModeling);
