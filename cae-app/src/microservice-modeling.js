import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import Common from './common.js';
import Static from "./static.js";
import('./versioning/versioning-element.js');

/**
 * @customElement
 * @polymer
 */
class MicroserviceModeling extends PolymerElement {
  static get template() {
    return html`
    <style>
      .firstcontainer { 
        display: flex;
        height: 400px;
        flex-flow: row wrap;
      }

      .secondcontainer { 
        display: flex;
        height: 400px;
        flex-flow: row wrap;
      }

      iframe {
        width: 100%;
        height: 100%;
      }

      .innercontainerfirst {
        padding: 5px;
        margin: 5px;
        flex: 1;
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

      .innercontainersecond {
        padding: 5px;
        margin: 5px;
        flex: 1;
      }

      .innercontainersecond:nth-of-type(1) {
        flex: 2;
      }
      .innercontainersecond:nth-of-type(2) {
        flex: 2;
      }
      .innercontainersecond:nth-of-type(3) {
        flex: 1;
      }
    </style>
    <div class="firstcontainer">
      <div class="innercontainerfirst">
        <iframe id="Canvas" src="{{Static.WebhostURL}}/syncmeta/widget.html"> </iframe>      
      </div>
      <div class="innercontainerfirst">
        <iframe id="Property Browser" src="{{Static.WebhostURL}}/syncmeta/attribute.html"> </iframe>
        <iframe id="Metadata Widget" src="{{Static.WebhostURL}}/cae-frontend/swaggerWidget/widget.html"> </iframe>
      </div>
      <div class="innercontainerfirst">
        <iframe id="Palette" src="{{Static.WebhostURL}}/syncmeta/palette.html"> </iframe>
      </div>
      <div class="innercontainerfirst">
        <iframe id="User Activity" src="{{Static.WebhostURL}}/syncmeta/activity.html"> </iframe>
      </div>
    </div>
    <div class="secondcontainer">
      <div class="innercontainersecond">
        <iframe id="Live Code Editor" src="{{Static.WebhostURL}}/cae-frontend/liveCodeEditorWidget/MicroserviceEditorWidget.html"> </iframe>
      </div>
      <!--
      <div class="innercontainersecond">
        <iframe id="Import Tool" src="{{Static.WebhostURL}}/syncmeta/debug.html"> </iframe>
      </div>
      -->
      <div class="innercontainersecond">
        <versioning-element></versioning-element>
      </div>
      <div class="innercontainersecond">
        <iframe id="Open API viewer" src="{{Static.WebhostURL}}/cae-frontend/swaggerWidget/swaggerUiEditor.html"> </iframe>
      </div>
    </div>
    `;
  }

  static get properties() {}

  ready() {
    super.ready();
    parent.caeFrames = this.shadowRoot.querySelectorAll("iframe");

    // load the current Yjs room name from localStorage into
    // parent.caeRoom variable (used by modeling/SyncMeta widget)
    const modelingInfo = Common.getModelingInfo();
    Common.setCaeRoom(modelingInfo.frontend.versionedModelId);
  }
}

window.customElements.define('microservice-modeling', MicroserviceModeling);
