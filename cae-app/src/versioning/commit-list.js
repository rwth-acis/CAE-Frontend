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
          <div>
            <!-- check if commit is the commit for uncommited changes -->
            ${commit.message ? html`
              <!-- standard commit -->
              <div style="display: flex">
                <!-- commit message -->
                <p style="margin-right: 0; margin-bottom: 0" @click=${() => this._onCommitLeftClicked(commit)}>${commit.message}</p>
                <!-- button for context menu -->
                <paper-menu-button vertical-align="bottom" style="padding-left: 0; padding-right: 0">
                  <paper-icon-button slot="dropdown-trigger" icon="more-vert" style="padding-left: 0; padding-right: 0"></paper-icon-button>
                  <p slot="dropdown-content" style="padding-left: 4px; padding-right: 4px"
                    @click=${() => this._onResetModelToCommitClicked(commit)}>Reset model to this commit</p>
                </paper-menu-button>
              </div>
              <!-- version tag -->
              ${commit.tag ? html`
                <div style="margin-top: 8px; margin-bottom: 4px">
                  <span class="label">${commit.tag.tag}</span>
                </div>
              ` : html``}
              <!-- timestamp -->
              <p style="color: #aeaeae; margin-top: 4px">${commit.timestamp}</p>
            ` : html`
              <!-- commit for uncommited changes -->
              <div>
                <p>Uncommited changes</p>
              </div>
            `}
          </div>
          <div class="separator"></div>
        `)}
      </div>
    `;
  }

  static get properties() {
    return {
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
   * Gets called when the user wants to reset the model to a specific commit.
   * @param commit Commit where the model should be reset to.
   * @private
   */
  _onResetModelToCommitClicked(commit) {
    console.log("reset model to commit clicked:");
    console.log(commit);
  }

  /**
   * Gets called by versioning-element after the versioned model got loaded from API.
   * @param versionedModel
   */
  setVersionedModel(versionedModel) {
    console.log("Commit-List: Received versioned model from versioning-element.");
    this.versionedModel = versionedModel;
  }
}

customElements.define('commit-list', CommitList);
