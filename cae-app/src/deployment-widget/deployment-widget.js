import { LitElement, html } from "lit-element";
import Common from "../util/common";
import Static from "../static";

export class DeploymentWidget extends LitElement {
  render() {
    return html`
      <style>
        paper-button {
          height: 2.5em;
        }
        .paper-button-blue {
          color: rgb(240, 248, 255);
          background: rgb(30, 144, 255);
          height: 2.5em;
        }
        .paper-button-blue:hover {
          color: rgb(240, 248, 255);
          background: rgb(65, 105, 225);
        }
        paper-button[disabled] {
          background: #e1e1e1;
        }
        textarea#deploy-status {
          background-color: #000000;
          color: #ffffff;
        }
      </style>

      <div
        style="display: flex; margin-left: 4px; margin-right: 4px; margin-top: 4px;"
      >
        <paper-button
          id="deploy-model"
          @click=${this._onDeployButtonClicked}
          href="/cae-deploy/test-deploy/${Common.getVersionedModelId()}"
          class="paper-button-blue"
          >Deploy</paper-button
        >
      </div>
    `;
  }

  static get properties() {
    return {};
  }

  constructor() {
    super();
    this.requestUpdate().then((_) => {
      this.getDeployButton().disabled = true;
    });
  }

  /**
   * Gets called by application-modeling.js when at least one commit exists (and code got generated)
   * and deployment can get started.
   */
  enableWidget() {
    this.getDeployButton().disabled = false;
  }

  _onDeployButtonClicked() {
    window.open(
      "/cae-deploy/test-deploy/" + Common.getVersionedModelId(),
      "_self"
    );
  }

  getDeployButton() {
    return this.shadowRoot.getElementById("deploy-model");
  }
}

customElements.define("deployment-widget", DeploymentWidget);
