import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import Common from './common.js';
import Static from './static.js';

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
          flex: 4;
          display: flex;
          flex-flow: column;
        }

        .innercontainerfirst:nth-of-type(2) {
          flex: 2;
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
          flex: 4;
        }

        .innercontainersecond:nth-of-type(3) {
          flex: 1;
        }
      </style>
      <p>Frontend Modeling</p>
      <div class="maincontainer">
        <div class="innercontainerfirst">
          <iframe id="Wireframe Editor" src="{WEBHOST}/wireframe/index.html"> </iframe>
        </div>
        <div class="innercontainerfirst">
          <div style="flex:1;margin-bottom:5px;">
            <iframe id="Live Preview" src="{WEBHOST}/cae-frontend/liveCodeEditorWidget/LivePreviewWidget.html"> </iframe>
          </div>
          <div style="display:flex;flex-flow:column;flex:1;">
            <div>
              <iframe id="Property Browser" src="{WEBHOST}/syncmeta/attribute.html"> </iframe>
            </div>
            <div>
              <iframe id="Frontend Persistence Widget" src="{WEBHOST}/cae-frontend/frontendComponentPersistenceWidget/index.html"> </iframe>           
              <!--
              <iframe id="Import Tool" src="{WEBHOST}/syncmeta/debug.html"> </iframe>
              -->
            </div>
          </div>
        </div>  
        <div class="innercontainerfirst">
          <div style="display:flex;flex-flow:row;flex:1;margin:5px;">
            <div>
              <iframe id="Palette" src="{WEBHOST}/syncmeta/palette.html"> </iframe>
            </div>
            <div>
              <iframe id="User Activity" src="{WEBHOST}/syncmeta/activity.html"> </iframe>
            </div>    
          </div>   
          <div style="flex:1;margin:5px;">
            <iframe id="Requirements Bazaar Widget" src="{WEBHOST}/cae-frontend/requirementsBazaarWidget/index.html"> </iframe>
          </div>  
        </div> 
      </div>
      <div class="maincontainer">
        <div class="innercontainersecond">
          <iframe id="Canvas" src="{WEBHOST}/syncmeta/widget.html"> </iframe>
        </div>
        <div class="innercontainersecond">
          <iframe id="Live Code Editor" src="{WEBHOST}/cae-frontend/liveCodeEditorWidget/FrontendEditorWidget.html"> </iframe>
        </div>
        <!--
        <div class="innercontainersecond">
          <iframe id="Requirements Bazaar Widget" src="{WEBHOST}/cae-frontend/requirementsBazaarWidget/index.html"> </iframe>
        </div>
        -->
      </div>
    `;
  }

  static get properties() {}

  ready() {
    super.ready();
    parent.caeFrames = this.shadowRoot.querySelectorAll("iframe");
    parent.caeSpace = Static.FrontendSpaceId;
    Common.setCaeSpace(parent.caeSpace);
  }
}

window.customElements.define('frontend-modeling', FrontendModeling);
