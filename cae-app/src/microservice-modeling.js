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
        
        paper-tabs {
          --paper-tabs-selection-bar-color: rgb(30,144,255);
        }
      </style>
      <div class="maincontainer">
        <div id="div-canvas" class="innercontainersecond widget" widgetconfigname="Modeling">
          <iframe id="Canvas" src="${Static.WebhostURL}/syncmeta/widget.html"> </iframe>
        </div>
        <div class="innercontainersecond widget" style="display:flex;flex-flow:column;" widgetconfigname="Modeling">
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
        <div class="innercontainersecond">
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
      </div>
      <div class="maincontainer" style="margin-top: 1em">
        <div id="div-code-editor" class="innercontainerfirst">
          <iframe id="Live Code Editor" src="${Static.WebhostURL}/cae-frontend/liveCodeEditorWidget/MicroserviceEditorWidget.html"> </iframe>
        </div>
        <div class="innercontainerfirst">
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
