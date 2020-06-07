import { LitElement, html} from 'lit-element';

export class CommitDetails extends LitElement {
  render() {
    return html`
      <p>Commit Details</p>
    `;
  }
}

customElements.define('commit-details', CommitDetails);
