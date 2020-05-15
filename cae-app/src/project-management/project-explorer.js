import {html, LitElement} from 'lit-element';
import '@polymer/paper-card';

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
        paper-card {
          width: 100%;
        }
      </style>
      <paper-card>
        <p>Project Explorer</p>
      </paper-card>
    `;
  }

  constructor() {
    super();
  }
}

customElements.define('project-explorer', ProjectExplorer);
