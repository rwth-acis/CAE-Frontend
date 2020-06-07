import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import Common from './common.js';

/**
 * @customElement
 * @polymer
 */
class FrontendModeling extends PolymerElement {
  
  static get template() {
    return html`
      <style>
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
          flex: 3;
          display: flex;
          flex-flow: column;
        }

        .innercontainerfirst:nth-of-type(3) {
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
          flex: 4;
        }

        .innercontainersecond:nth-of-type(2) {
          flex: 2;
        }

        .innercontainersecond:nth-of-type(3) {
          flex: 4;
        }
      </style>
      <p>Frontend Modeling</p>
      <div class="maincontainer">
        <div class="innercontainersecond">
          <iframe id="Canvas" src="{WEBHOST}/syncmeta/widget.html"> </iframe>
        </div>
        <div class="innercontainersecond" style="display:flex;flex-flow:column;">
          <div style="display:flex;flex-flow:row;flex:2;">
            <div>
              <iframe id="Palette" src="{WEBHOST}/syncmeta/palette.html"> </iframe>
            </div>
            <div>
              <iframe id="User Activity" src="{WEBHOST}/syncmeta/activity.html"> </iframe>
            </div>    
          </div>
          <div style="flex: 1">
            <iframe id="Property Browser" src="{WEBHOST}/syncmeta/attribute.html"> </iframe>
          </div>
        </div>
        <div class="innercontainersecond">
          <iframe id="Wireframe Editor" src="{WEBHOST}/wireframe/index.html"> </iframe>
        </div>
        <!--
        <div class="innercontainersecond">
          <iframe id="Requirements Bazaar Widget" src="{WEBHOST}/cae-frontend/requirementsBazaarWidget/index.html"> </iframe>
        </div>
        -->
      </div>
      <div class="maincontainer">
        <div class="innercontainerfirst">
          <iframe id="Live Code Editor" src="{WEBHOST}/cae-frontend/liveCodeEditorWidget/FrontendEditorWidget.html"> </iframe>
        </div>
        <div class="innercontainerfirst">
          <p>Versioning Widget Placeholder</p>
        </div>
        <div class="innercontainerfirst">
          <div style="display:flex;flex-flow:row;flex:1">
            <iframe id="Live Preview" src="{WEBHOST}/cae-frontend/liveCodeEditorWidget/LivePreviewWidget.html"> </iframe>
          </div>
          <div style="flex:1">
            <iframe id="Requirements Bazaar Widget" src="{WEBHOST}/cae-frontend/requirementsBazaarWidget/index.html"> </iframe>
          </div>
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

window.customElements.define('frontend-modeling', FrontendModeling);
