import { LitElement, html} from 'lit-element';

export class CommitList extends LitElement {
  render() {
    return html`
      <style>
        .separator {
           border-top: thin solid #e1e1e1;
        }
        .label {
          color: #586069;
          border: 1px solid #e1e1e1;
          margin-top: auto;
          margin-bottom: auto;
          padding: 0.1em 0.2em;
          border-radius: 3px;
        }
      </style>
      <h3>Commits</h3>
      <div class="separator"></div>
      <div style="overflow: scroll; max-height: 500px">
        <!-- list commits -->
        ${this.versionedModel.commits.map(commit => html`
          <div @click=${() => this._onCommitLeftClicked(commit)} @contextmenu="${(e) => this._onCommitRightClicked(e, commit)}">
            <div style="display: flex">
              <!-- version message -->
              <p style="margin-right: 0.5em">${commit.message}</p>
              <!-- version tag -->
              ${commit.tag ? html`<span class="label" style="margin-right: 0.5em">${commit.tag.tag}</span>` : html``}
            </div>
            <!-- timestamp -->
            <p style="color: #aeaeae">${commit.timestamp}</p>
          </div>
          <div class="separator"></div>
        `)}
      </div>
    `;
  }

  static get properties() {
    return {
      /**
       * Gets set by versioning-element.
       */
      versionedModel: {
        type: Object
      }
    };
  }

  /**
   * Gets called when the user left-clicks on a commit in the commit list.
   * @param commit The commit that was left-clicked.
   * @private
   */
  _onCommitLeftClicked(commit) {
    console.log("commit left-clicked:");
    console.log(commit);
  }

  /**
   * Gets called when the user right-clicks on a commit in the commit list.
   * @param event MouseEvent needed to prevent displaying context menu of browser.
   * @param commit The commit that was right-clicked.
   * @private
   */
  _onCommitRightClicked(event, commit) {
    // preventDefault ensures that the context menu of the browser does not show up
    event.preventDefault();

    // notify versioning-element about right click on commit
    let notifyEvent = new CustomEvent("commit-right-click", {
      detail: {
        commit: commit
      }
    });
    this.dispatchEvent(notifyEvent);
  }
}

customElements.define('commit-list', CommitList);
