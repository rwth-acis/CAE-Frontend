import { LitElement, html} from 'lit-element';

export class CommitList extends LitElement {
  render() {
    return html`
      <p>Commit List</p>
    `;
  }
}

customElements.define('commit-list', CommitList);
