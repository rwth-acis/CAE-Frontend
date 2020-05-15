import {html, LitElement} from 'lit-element';
import '@polymer/paper-card';

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
        paper-card {
          width: 100%;
        }
      </style>
      <paper-card>
        <p>Project User</p>
      </paper-card>
    `;
  }

  constructor() {
    super();
  }
}

customElements.define('project-user', ProjectUser);
