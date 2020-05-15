import {html, LitElement} from 'lit-element';
import '@polymer/paper-card/paper-card';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-item/paper-item.js'
import '@polymer/paper-listbox/paper-listbox.js';

/**
 * PolymerElement for management of project users.
 * TODO: Update Documentation when functionality of this element is final.
 * This element allows to list the users of a project, to add users to a project,
 * to remove users from a project and to change their role in a project.
 */
class ProjectUser extends LitElement {
  render() {
    return html`
      <style>
        .main{
          width: 100%;
          margin-top: 1em;
          height: 600px;
          border-left: thin solid #eeeeee;
        }
        .dropdown-menu {
          width: 100%;
        }
      </style>
      <div class="main">
        <div style="margin-left: 1em; margin-right: 1em">
        <paper-dropdown-menu class="dropdown-menu" label="Select Project">
          <paper-listbox slot="dropdown-content" class="dropdown-content">
            ${this.getListOfCurrentUsersProjects().map(usersProject => html`
              <paper-item @click="${() => this._onProjectSelected(usersProject.id)}">${usersProject.name}</paper-item>
            `)}
          </paper-listbox>
        </paper-dropdown-menu>
        </div>
        <div class="user-list" style="margin-left: 1em; margin-right: 1em">
          <ul>
            ${this.userList.map(user => html`
              <li>
                <p>${user.name}</p>
                <hr>
              </li>
            `)}
          </ul>
        </div>
      </div>
    `;
  }

  static get properties() {
    return {
      userList: {
        type: Array
      }
    }
  }

  constructor() {
    super();
    this.userList = this.getUsersByProject(1);
  }

  _onProjectSelected(projectId) {
    console.log("project with id " + projectId + " got selected");
    this.userList = this.getUsersByProject(projectId);
  }

  /**
   * TODO: Only returns example data for now.
   * @returns {*[]}
   */
  getListOfCurrentUsersProjects() {
    return [
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

  getUsersByProject(projectId) {
    if(projectId == 1) {
      return [
        {
          "id": 1,
          "name": "Alice",
          "role": "Frontend Modeler"
        },
        {
          "id": 2,
          "name": "Bob",
          "role": "Software Engineer"
        },
        {
          "id": 3,
          "name": "Dave",
          "role": "Frontend Modeler"
        }
      ];
    }
    if(projectId == 2) {
      return [
        {
          "id": 3,
          "name": "Dave",
          "role": "Frontend Modeler"
        },
        {
          "id": 4,
          "name": "Chris",
          "role": "Software Engineer"
        }
      ];
    }
    if(projectId == 3) {
      return [
        {
          "id": 4,
          "name": "Chris",
          "role": "Software Engineer"
        }
      ];
    }
  }


}

customElements.define('project-user', ProjectUser);
