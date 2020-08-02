import {LitElement, html} from "lit-element";
import Common from "../util/common";
import Static from "../static";

/**
 * Element currently only used for connecting the user's GitHub account with the CAE.
 */
class SettingsElement extends LitElement {

  render() {
    return html`
      <style>
        :host {
          font-family: Roboto;
        }
        .main {
          margin-left: 1em;
          margin-right: 1em;
          margin-top: 1em;
        }
        .github-button {
          color: #333;
          background-color: #fff;
          font-size: 14px;
          font-weight: bold;
          padding: 6px 12px;
          margin-bottom: 0;
          border: 1px solid #ccc;
          border-radius: 4px;
          vertical-align: middle;
          outline: none;
        }
        .github-button:hover {
          background-color: #f0f0f0;
        }
        .github-button:focus {
          border: 1px solid #ccc;
        }
      </style>
      <div class="main">
        <p><b>Settings</b></p>
        ${this.gitHubConnected ? html`
          <p>You are connected with the GitHub account <span id="gitHubUsername"></span>.</p>
        ` : html`
          <p>You have not connected your GitHub account. When you connect your account, then you get access to edit the GitHub projects which belong to your CAE projects.</p>
          
          <button class="github-button" style="display: flex" @click=${this._onConnectGitHubClicked}>
              <p style="margin-top: 4px; margin-bottom: 4px">Connect GitHub Account</p>
              <svg style="margin-top: 4px; margin-left: 4px" id="github-projects-icon" width="16px" height="16px">
                <image xlink:href="https://raw.githubusercontent.com/primer/octicons/e9a9a84fb796d70c0803ab8d62eda5c03415e015/icons/mark-github-16.svg" width="16px" height="16px"/>
              </svg>
          </button>
        `}
      </div>
    `;
  }

  _onConnectGitHubClicked() {
    window.open("https://github.com/login/oauth/authorize?client_id=" + Static.GitHubOAuthClientId + "&scope=write:org", '_blank');
  }

  static get properties() {
    return {
      gitHubConnected: {
        type: Boolean
      }
    };
  }

  constructor() {
    super();

    window.addEventListener("storage", function(event) {
      this.init();
    }.bind(this));

    this.init();
  }

  init() {
    if(Common.getUserInfo()) {
      const gitHubUsername = Common.getUsersGitHubUsername();
      this.gitHubConnected = gitHubUsername != undefined;

      this.requestUpdate().then(_ => {
        if (this.gitHubConnected) {
          this.shadowRoot.getElementById("gitHubUsername").innerText = gitHubUsername;
        }
      });
    }
  }
}


customElements.define('settings-element', SettingsElement);
