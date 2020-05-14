import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';

/**
 * PolymerElement for the project management page of the CAE.
 * TODO: Update Documentation when functionality of this element is final.
 * This element will contain the Project Management Widget and the
 * Project User Widget.
 * @customElement
 * @polymer
 */
class ProjectManagement extends PolymerElement {
  static get template() {
    return html`
      <p>This is the Project Management page.</p>
      <a href="/cae-modeling">Test Link to Modeling</a> 
    `;
  }
}

window.customElements.define('project-management', ProjectManagement);
