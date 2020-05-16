import {html, LitElement} from 'lit-element';
import '@polymer/paper-card/paper-card';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/iron-icon/iron-icon';

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
        :host {
          font-family: Roboto;
        }
        .main{
          width: 100%;
          margin-top: 1em;
          height: 600px;
          border-left: thin solid #eeeeee;
        }
        .dropdown-menu {
          width: 100%;
        }
        .separator {
           border-top: thin solid #eeeeee;
        }
        .input-username {
          width: 100%;
          margin-right: 0.5em;
          border-radius: 3px;
          border: thin solid #e6e6e6;
          height: 2.5em;
          padding-left:5px;
        }
        paper-button {
          color: rgb(240,248,255);
          background: rgb(30,144,255);
          height: 2.5em;
        }
        paper-button:hover {
          color: rgb(240,248,255);
          background: rgb(65,105,225);
        }
        .edit-icon {
          color: #c6c6c6;
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
        <div class="user-list" style="margin-left: 1em; margin-right: 1em; overflow: auto; max-height: 25em">
          ${this.projectSelected ? html`` : html`<p>No project selected.</p>`}
            ${this.userList.map(user => html`
              <div style="width: 100%; display: flex; align-items: center">
                <p>${user.name}</p>
                <p style="margin-right: 0.5em; margin-left: auto">${user.role}</p>
                <iron-icon class="edit-icon" icon="create"></iron-icon>
              </div>
              <div class="separator"></div>
            `)}
        </div>
        ${this.projectSelected ? html`
          <div class="add-user" style="display: flex; margin-top: 0.5em; margin-left: 1em; margin-right: 1em">
            <input class="input-username" placeholder="Enter Username" style="margin-left: 0"></input>
            <paper-button @click="${this._onAddUserToProjectClicked}" style="margin-left: auto">Add</paper-button>
          </div>
        ` : html``}
      </div>
    `;
  }

  widgetClicked() {
    console.log('widget clicked');
    this.$.modal.open();
  }

  static get properties() {
    return {
      userList: {
        type: Array
      },
      projectSelected: {
        type: Boolean
      }
    }
  }

  constructor() {
    super();
    this.userList = [];
    this.projectSelected = false;
  }

  _onProjectSelected(projectId) {
    this.projectSelected = true;
    console.log("project with id " + projectId + " got selected");
    this.userList = this.getUsersByProject(projectId);
  }

  _onAddUserToProjectClicked() {
    console.log("add user to project clicked");
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
