import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import Common from './common.js';
import Static from './static.js';

/**
 * @customElement
 * @polymer
 */
class MicroserviceModeling extends PolymerElement {
  static get template() {
    return html`
    <p>Microservice Modeling</p>	
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
    </style>
    <div class="firstcontainer">
      <div class="innercontainerfirst">
        <iframe id="Canvas" src="{WEBHOST}/syncmeta/widget.html"> </iframe>      
      </div>
      <div class="innercontainerfirst">
        <iframe id="Property Browser" src="{WEBHOST}/syncmeta/attribute.html"> </iframe>
        <iframe id="Persistence Widget" src="{WEBHOST}/cae-frontend/microservicePersistenceWidget/index.html"> </iframe>
      </div>
      <div class="innercontainerfirst">
        <iframe id="Palette" src="{WEBHOST}/syncmeta/palette.html"> </iframe>
      </div>
      <div class="innercontainerfirst">
        <iframe id="User Activity" src="{WEBHOST}/syncmeta/activity.html"> </iframe>
      </div>
    </div>
    <div class="secondcontainer">
      <div class="innercontainersecond">
        <iframe id="Live Code Editor" src="{WEBHOST}/cae-frontend/liveCodeEditorWidget/MicroserviceEditorWidget.html"> </iframe>
      </div>
      <!--
      <div class="innercontainersecond">
        <iframe id="Import Tool" src="{WEBHOST}/syncmeta/debug.html"> </iframe>
      </div>
      -->
      <div class="innercontainersecond">
        <iframe id="Metadata Widget" src="{WEBHOST}/cae-frontend/swaggerWidget/widget.html"> </iframe>
      </div>
      <div class="innercontainersecond">
        <iframe id="Open API viewer" src="{WEBHOST}/cae-frontend/swaggerWidget/swaggerUiEditor.html"> </iframe>
      </div>
    </div>
    `;
  }

  static get properties() {}

  ready() {
    super.ready();
    parent.caeFrames = this.shadowRoot.querySelectorAll("iframe");
    parent.caeSpace = Static.MicroserviceSpaceId;
    Common.setCaeSpace(parent.caeSpace);
  }
}

window.customElements.define('microservice-modeling', MicroserviceModeling);
