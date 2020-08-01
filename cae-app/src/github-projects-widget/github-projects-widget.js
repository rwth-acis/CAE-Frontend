import {LitElement, html} from "lit-element";
import Common from "../util/common";

/**
 * Widget used to display the columns and their cards of a GitHub project.
 */
export class GitHubProjectsWidget extends LitElement {
  render() {
    return html`
      <style>
      </style>
      
      <p>GitHub Projects Widget</p>
      <p>This is not yet implemented.</p>
    `;
  }

  static get properties() {
    return {
      gitHubProjectId: { type: Number },
      accessToken: { type: String }
    }
  }

  constructor() {
    super();

    const componentType = Common.getComponentTypeByVersionedModelId(Common.getVersionedModelId());
    this.gitHubProjectId = Common.getModelingInfo()[componentType].gitHubProjectId;

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
