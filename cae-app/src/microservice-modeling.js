import {LitElement, html} from "lit-element";
import Common from './util/common.js';
import Static from "./static.js";
import SyncMetaSwitchHelper from "./util/syncmeta-switch-helper";
import WidgetConfigHelper from "./util/role-based-access-management/widget-config-helper";
import('./versioning/versioning-element.js');

/**
 * @customElement
 * @polymer
 */
class MicroserviceModeling extends LitElement {
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
        
        #versioning-widget {
          flex: 2 1 0%;
        }
        
        #swagger-combo {
          flex: 2 1 0%;
        }
        
        #div-code-editor {
          flex: 2 1 0%;
        }
        
        paper-tabs {
          --paper-tabs-selection-bar-color: rgb(30,144,255);
        }
        
        .flex-column {
          display: flex;
          flex-flow: column;
        }
      </style>
      <div class="maincontainer">
        <div id="div-canvas" style="min-width: 450px;" class="flex-item widget" widgetconfigname="Modeling">
          <iframe id="Canvas" src="${Static.WebhostURL}/syncmeta/widget.html"> </iframe>
        </div>
        <div class="widget flex-item flex-column" style="min-width: 250px;" widgetconfigname="Modeling">
          <div style="display:flex;flex-flow:row;flex:2;">
            <div>
              <iframe id="Palette" src="${Static.WebhostURL}/syncmeta/palette.html"> </iframe>
            </div>
            <div>
              <iframe id="User Activity" scrolling="no" src="${Static.WebhostURL}/syncmeta/activity.html"> </iframe>
            </div>    
          </div>
          <div id="div-pb" style="flex: 1">
            <iframe id="Property Browser" src="${Static.WebhostURL}/syncmeta/attribute.html"> </iframe>
          </div>
        </div>
        <div id="swagger-combo" style="min-width: 450px" class="flex-item widget" widgetconfigname="Swagger Editor">
          <div style="height: 600px; display: flex; flex-flow: column">
            <paper-tabs selected="0">
              <paper-tab @click=${(e) => this._onTabSelected(0)}>Metadata Editor</paper-tab>
              <paper-tab @click=${(e) => this._onTabSelected(1)}>Deployment Viewer</paper-tab>
            </paper-tabs>
            <div id="swagger-combo-content" style="flex: 1">
              <iframe id="Metadata Widget" src="${Static.WebhostURL}/cae-frontend/swaggerWidget/widget.html" style="width: 100%; height: 100%"></iframe>
              <iframe id="Open API viewer" src="${Static.WebhostURL}/cae-frontend/swaggerWidget/swaggerUiEditor.html" style="width: 100%; height: 100%"> </iframe>
            </div>
          </div>
        </div>
        <div class="flex-item widget" widgetconfigname="Code Editor" style="min-width: 400px;" id="div-code-editor">
          <iframe id="Live Code Editor" src="${Static.WebhostURL}/cae-frontend/liveCodeEditorWidget/MicroserviceEditorWidget.html"> </iframe>
        </div>
        <div style="min-width: 300px; max-width: 700px" class="flex-item widget" widgetconfigname="Versioning">
          <versioning-element @reload-code-editor=${(e) => this._reloadCodeEditor()} id="versioning-widget"></versioning-element>
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

      this._onTabSelected(0);

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
    Common.setCaeRoom(modelingInfo.microservice.versionedModelId, modelingInfo.microservice.isDependency);
  }

  /**
   * Gets called when the selected tab for the swagger widgets has changed.
   * @param index 0 or 1, depending on the tab.
   * @private
   */
  _onTabSelected(index) {
    if(index == 0) {
      this.getMetadataWidget().removeAttribute("hidden");
      this.getOpenAPIViewer().hidden = true;
    } else {
      this.getMetadataWidget().hidden = true;
      this.getOpenAPIViewer().removeAttribute("hidden");
    }
  }

  _reloadCodeEditor() {
    const divCodeEditor = this.shadowRoot.getElementById("div-code-editor");
    this.shadowRoot.getElementById("Live Code Editor").remove();

    const codeEditor = document.createElement("iframe");
    codeEditor.id = "Live Code Editor";
    codeEditor.src = Static.WebhostURL + "/cae-frontend/liveCodeEditorWidget/FrontendEditorWidget.html";
    divCodeEditor.appendChild(codeEditor);
  }

  getMetadataWidget() {
    return this.shadowRoot.getElementById("Metadata Widget");
  }

  getOpenAPIViewer() {
    return this.shadowRoot.getElementById("Open API viewer");
  }
}

window.customElements.define('microservice-modeling', MicroserviceModeling);
