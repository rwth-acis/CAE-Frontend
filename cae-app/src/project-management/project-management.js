import {html, LitElement} from 'lit-element';
import './project-explorer';
import './project-user';
import '@polymer/iron-flex-layout/iron-flex-layout-classes';

/**
 * PolymerElement for the project management page of the CAE.
 * TODO: Update Documentation when functionality of this element is final.
 * This element will contain the Project Management Widget and the
 * Project User Widget.
 */
class ProjectManagement extends LitElement {
  render() {
    return html`
      <p>This is the Project Management page.</p>
      <a href="/cae-modeling">Link to Modeling</a> 
      
      <custom-style>
        <style is="custom-style">
          .flex-horizontal-with-ratios {
            @apply --layout-horizontal;
          }
          .flexchild {
            @apply --layout-flex;
          }
          .flex2child {
            @apply --layout-flex-2;
          }
        </style>
      </custom-style>
      
      <div class="container flex-horizontal-with-ratios">
        <div class="flex2child">
          <project-explorer></project-explorer>
        </div>
        <div class="flexchild">
          <project-user></project-user>
        </div>
      </div>
    `;
  }
}

customElements.define('project-management', ProjectManagement);
