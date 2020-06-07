
import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import Common from './common.js';

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
    <p>Application Modeling</p>
    <div class="maincontainer">
      <div class="innercontainerfirst">
        <iframe id="Canvas" src="{WEBHOST}/syncmeta/widget.html"> </iframe>
      </div>
      <div class="innercontainerfirst">
        <iframe id="Property Browser" src="{WEBHOST}/syncmeta/attribute.html"> </iframe>
        <iframe id="Application Persistence Widget" src="{WEBHOST}/cae-frontend/applicationPersistenceWidget/widget.html"> </iframe>
      </div>
      <div class="innercontainerfirst">
        <div style="display:flex;flex-flow:row;flex:1;">
          <div>
            <iframe id="Frontend Component Select Widget" src="{WEBHOST}/cae-frontend/frontendComponentSelectWidget/widget.html"> </iframe>
          </div>
          <div>
            <iframe id="Microservice Select Widget" src="{WEBHOST}/cae-frontend/microserviceSelectWidget/widget.html"> </iframe>
          </div>
        </div>
        <!--
        <div style="flex:1;">
          <iframe id="Import Tool" src="{WEBHOST}/syncmeta/debug.html"> </iframe>
        </div>
        -->
      </div>
      <div class="innercontainerfirst">
        <iframe id="User Activity" src="{WEBHOST}/syncmeta/activity.html"> </iframe>
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
    Common.loadCaeRoom();
  }
}

window.customElements.define('application-modeling', ApplicationModeling);
