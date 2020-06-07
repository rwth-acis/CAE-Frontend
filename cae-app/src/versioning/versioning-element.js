import { LitElement, html} from 'lit-element';

export class VersioningElement extends LitElement {
  render() {
    return html`
      <p>Versioning Widget</p>
    `;
  }
}

customElements.define('versioning-element', VersioningElement);
