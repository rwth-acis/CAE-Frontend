import {html, LitElement} from 'lit-element';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';

/**
 * PolymerElement for management of projects.
 * TODO: Update Documentation when functionality of this element is final.
 * This element allows listing the projects that the current user is part of.
 * It also allows creating new projects, searching for existing ones, joining projects
 * and enter the modeling in a project.
 */
class ProjectExplorer extends LitElement {
  render() {
    return html`
      <style>
        .main {
          width: 100%;
          margin-top: 1em;
        }
        paper-button {
          color: rgb(240,248,255);
          background: rgb(30,144,255);
          max-height: 50px;
        }
        .button-create-project {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        paper-button:hover {
          color: rgb(240,248,255);
          background: rgb(65,105,225);
        }
        .explorer-top-menu {
          display: flex;
          align-items: center;
        }
        .input-search-project {
          border-radius: 3px;
          border: thin solid #e6e6e6;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          margin-left: auto;
          height: 2.5em;
          padding-left:5px;
        }
        .project-item-card {
          display: flex;
          width: 100%;
          margin-top: 1em;
        }
        .project-item-card:hover {
          background: #eeeeee;
        }
        .project-item-card-content {
          width: 100%;
          height: 100%;
          align-items: center;
          display: flex;
        }
        .project-item-name {
          margin-left: 1em;
          margin-top: 1em;
          margin-bottom: 1em;
        }
        .project-item-user-list {
          margin: 1em 1em 1em 0.5em;
        }
        .green-dot {
          background-color: #c5e686;
          height: 0.8em;
          width: 0.8em;
          border-radius: 50%;
          display: inline-block;
          margin-left: auto;
        }
      </style>
      <div class="main">
        <div class="explorer-top-menu">
          <paper-button class="button-create-project" @click="${this._onCreateProjectButtonClicked}">Create Project</paper-button>
          <input class="input-search-project" placeholder="Search Projects"></input>
        </div>
        ${this.listedProjects.map(project => html`
            <paper-card class="project-item-card" @click="${() => this._onProjectItemClicked(project.id)}">
              <div class="project-item-card-content">
                <p class="project-item-name">${project.name}</p>
                ${this.getListOfProjectOnlineUsers(project.id) ? html`<span class="green-dot"></span>` : html``}
                <p class="project-item-user-list">${this.getListOfProjectOnlineUsers(project.id)}</p>
              </div>
            </paper-card>
        `)}
      </div>
    `;
  }

  static get properties() {
    return {
      listedProjects: {
        type: Array
      }
    }
  }

  constructor() {
    super();
    this.listedProjects = [
      {
        "id": 1,
        "name": "Project 1"
      },
      {
        "id": 2,
        "name": "Project 2"
      },
      {
        "id": 3,
        "name": "Project 3"
      }
    ];
  }

  _onCreateProjectButtonClicked() {
    console.log("create project button clicked");
  }

  _onProjectItemClicked(projectId) {
    console.log("project with id " + projectId + " clicked");
  }

  /**
   * TODO: check which users are really online in the project.
   * @param projectId
   */
  getListOfProjectOnlineUsers(projectId) {
    // only some test data for now
    if(projectId == 1) return "Alice, Bob";
    if(projectId == 2) return "Chris";
    else return undefined;
  }
}

customElements.define('project-explorer', ProjectExplorer);
