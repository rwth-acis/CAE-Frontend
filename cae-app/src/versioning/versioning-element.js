import { LitElement, html} from 'lit-element';
import './commit-list.js';
import './commit-details.js';

export class VersioningElement extends LitElement {
  render() {
    return html`
      <style>
        :host {
          font-family: Roboto;
        }
      </style>
      
      <custom-style>
        <style is="custom-style">
          .flex-horizontal-with-ratios {
            @apply --layout-horizontal;
          }
          .flex-commit-details {
            @apply --layout-flex;
          }
          .flex-commit-list {
            @apply --layout-flex;
            margin-right: 1em;
          }
        </style>
      </custom-style>
      
      <div class="container flex-horizontal-with-ratios">
        <div class="flex-commit-list">
          <commit-list></commit-list>
        </div>
        <div class="flex-commit-details">
          <commit-details></commit-details>
        </div>
      </div>
    `;
  }
}

customElements.define('versioning-element', VersioningElement);
