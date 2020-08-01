import {LitElement, html} from "lit-element";
import Common from "../util/common";

/**
 * Widget used to display the columns and their cards of a GitHub project.
 */
export class GitHubProjectsWidget extends LitElement {
  render() {
    return html`
      <style>
        a {
          text-decoration: none;
          color: rgb(30,144,255)
        }
        a:hover {
          color: rgb(65,105,225);
        }
      </style>
      
      <div id="main" style="margin-left: 0.5em; margin-right: 0.5em">
        <h3 style="margin-top: 0.5em; margin-bottom: 0.5em">GitHub Projects - 
          <a href=${this.gitHubProjectHtmlUrl} target="_blank">${this.projectName}</a>
        </h3>
      </div>
    `;
  }

  static get properties() {
    return {
      gitHubProjectId: { type: Number },
      gitHubProjectHtmlUrl: { type: String },
      projectName: { type: String },
      accessToken: { type: String }
    }
  }

  constructor() {
    super();

    const componentType = Common.getComponentTypeByVersionedModelId(Common.getVersionedModelId());
    const modelingInfo = Common.getModelingInfo()[componentType];
    this.gitHubProjectId = modelingInfo.gitHubProjectId;
    this.gitHubProjectHtmlUrl = modelingInfo.gitHubProjectHtmlUrl;
    this.projectName = modelingInfo.projectName;

    this.accessToken = Common.getUserInfo().gitHubAccessToken;

    this.getProjectColumns().then(columns => {
      const columnNames = columns.map(column => column.name);
      console.log("github", columnNames);
    });
  }

  getProjectColumns() {
    return new Promise((columnsLoaded, loadingFailed) => {
      fetch("https://api.github.com/projects/" + this.gitHubProjectId + "/columns", {
        method: "GET",
        headers: {
          "Accept": "application/vnd.github.inertia-preview+json",
          "Authorization": "token " + this.accessToken
        }
      }).then(response => {
        if(response.ok) {
          response.json().then(data => {
            columnsLoaded(data);
          });
        } else {
          loadingFailed();
        }
      });
    });
  }
}

customElements.define('github-projects-widget', GitHubProjectsWidget);
