import {LitElement, html} from "lit-element";
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';
import Static from "../static";

export class SwaggerComboWidget extends LitElement {
  render() {
    return html`
      <style>
        paper-tabs {
          --paper-tabs-selection-bar-color: rgb(30,144,255);
        }
      </style>
      
      <paper-tabs selected="0">
        <paper-tab @click=${(e) => this._onTabSelected(0)}>Metadata Editor</paper-tab>
        <paper-tab @click=${(e) => this._onTabSelected(1)}>Open API Viewer</paper-tab>
      </paper-tabs>
      <div id="swagger-combo-content" style="height: 100%">
        <iframe id="Metadata Widget" src="${Static.WebhostURL}/cae-frontend/swaggerWidget/widget.html" style="width: 100%; height: 100%"></iframe>
        <iframe id="Open API viewer" src="${Static.WebhostURL}/cae-frontend/swaggerWidget/swaggerUiEditor.html" style="width: 100%; height: 100%"> </iframe>
      </div>
    `
  }

  constructor() {
    super();
    this.requestUpdate().then(_ => {
      this._onTabSelected(0);
    });
  }

  _onTabSelected(index) {
    if(index == 0) {
      this.getMetadataWidget().removeAttribute("hidden");
      this.getOpenAPIViewer().hidden = true;
    } else {
      this.getMetadataWidget().hidden = true;
      this.getOpenAPIViewer().removeAttribute("hidden");
    }
  }

  getMetadataWidget() {
    return this.shadowRoot.getElementById("Metadata Widget");
  }

  getOpenAPIViewer() {
    return this.shadowRoot.getElementById("Open API viewer");
  }
}

customElements.define('swagger-combo-widget', SwaggerComboWidget);
