import {LitElement, html} from "lit-element";
import Common from './util/common.js';
import Static from './static.js';
import './versioning/versioning-element.js';
import SyncMetaSwitchHelper from "./util/syncmeta-switch-helper";
import WidgetConfigHelper from "./util/role-based-access-management/widget-config-helper";

/**
 * @customElement
 * @polymer
 */
class FrontendModeling extends LitElement {
  
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
        
        .flex-item {
          flex: 1 1 0%;
          margin: 5px;
        }
        
        #div-canvas {
          flex: 5 1 0%;
        }
        
        #div-wireframe {
          flex: 4 1 0%;
        }
        
        #versioning-widget {
          flex: 2 1 0%;
        }
        
        #div-code-editor {
          flex: 2 1 0%;
        }

        .bordered {
          border-width: 2px;
          border-style: solid;
          border-color: #dddddd;
        }
      </style>
      <div class="maincontainer">
        <div id="div-canvas" style="min-width: 450px; height: 600px" class="flex-item widget" widgetconfigname="Modeling">
          <iframe id="Canvas" src="${Static.WebhostURL}/syncmeta/widget.html"> </iframe>
        </div>
        <div class="flex-item widget-config-container" style="display:flex; flex-flow:column; min-width: 250px; height: 600px">
          <div class="widget-config-container" style="display:flex;flex-flow:row;flex:2;">
            <div class="widget" widgetconfigname="Modeling">
              <iframe id="Palette" src="${Static.WebhostURL}/syncmeta/palette.html"> </iframe>
            </div>
            <div class="widget" widgetconfigname="Modeling">
              <iframe id="User Activity" scrolling="no" src="${Static.WebhostURL}/syncmeta/activity.html"> </iframe>
            </div>    
          </div>
          <div id="div-pb" class="widget" widgetconfigname="Modeling" style="flex: 1">
            <iframe id="Property Browser" src="${Static.WebhostURL}/syncmeta/attribute.html"> </iframe>
          </div>
        </div>
        <div id="div-wireframe" style="min-width: 450px; height: 600px" class="flex-item widget" widgetconfigname="Wireframe">
          <iframe id="Wireframe Editor" src="${Static.WebhostURL}/wireframe/index.html"> </iframe>
        </div>
        <div id="div-code-editor" style="min-width: 400px;" class="flex-item widget" widgetconfigname="Code Editor">
          <iframe id="Live Code Editor" src="${Static.WebhostURL}/cae-frontend/liveCodeEditorWidget/FrontendEditorWidget.html"> </iframe>
        </div>
        <div id="versioning-widget" class="flex-item widget" style="min-width: 300px; max-width: 700px" widgetconfigname="Versioning">
          <versioning-element @reload-wireframe=${(e) => this._reloadWireframe()} 
              @reload-code-editor=${(e) => this._reloadCodeEditor()} id="versioning-widget"></versioning-element>
        </div>
        <div class="flex-item widget" style="height: 600px" widgetconfigname="Live Preview">
          <div style="display:flex;flex-flow:row;flex:1" class="bordered">
            <div style="display: flex; flex-flow: column; margin-left: 4px">
              <h3>Live Preview</h3>
              <iframe id="Live Preview" style="border-style: none" src="${Static.WebhostURL}/cae-frontend/liveCodeEditorWidget/LivePreviewWidget.html"
                  style="flex: 1"></iframe>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  constructor() {
    super();

    this.requestUpdate().then(_ => {
      parent.caeFrames = this.shadowRoot.querySelectorAll("iframe");

      this.reloadCaeRoom();

      new SyncMetaSwitchHelper(this.shadowRoot, true);

      if(Common.isCurrentComponentDependency()) {
        // hide palette widget
        this.shadowRoot.getElementById("Palette").style.display = "none";
        // disable committing in versioning widget
        this.shadowRoot.getElementById("versioning-widget").committingDisabled = true;
      }

      // listener for reloading of current modeling page
      // this is used, when the changes since the last commit should be undone
      this.shadowRoot.getElementById("versioning-widget").addEventListener("reload-current-modeling-page", function() {
        this.dispatchEvent(new CustomEvent("reload-current-modeling-page"));
      }.bind(this));

      this.updateWidgetConfig();
    });
  }

  updateWidgetConfig() {
    WidgetConfigHelper.updateWidgetConfig(this.shadowRoot);
  }

  reloadCaeRoom() {
    // load the current Yjs room name from localStorage into
    // parent.caeRoom variable (used by modeling/SyncMeta widget)
    const modelingInfo = Common.getModelingInfo();
    Common.setCaeRoom(modelingInfo.frontend.versionedModelId, modelingInfo.frontend.isDependency);
  }

  _reloadWireframe() {
    const divWireframe = this.shadowRoot.getElementById("div-wireframe");
    this.shadowRoot.getElementById("Wireframe Editor").remove();

    const wireframe = document.createElement("iframe");
    wireframe.id = "Wireframe Editor";
    wireframe.src = Static.WebhostURL + "/wireframe/index.html";
    divWireframe.appendChild(wireframe);

    // reload caeFrames (otherwise the other widgets will not be able to find the wireframe anymore)
    parent.caeFrames = this.shadowRoot.querySelectorAll("iframe");
  }

  _reloadCodeEditor() {
    const divCodeEditor = this.shadowRoot.getElementById("div-code-editor");
    this.shadowRoot.getElementById("Live Code Editor").remove();

    const codeEditor = document.createElement("iframe");
    codeEditor.id = "Live Code Editor";
    codeEditor.src = Static.WebhostURL + "/cae-frontend/liveCodeEditorWidget/FrontendEditorWidget.html";
    divCodeEditor.appendChild(codeEditor);
  }
}

window.customElements.define('frontend-modeling', FrontendModeling);
