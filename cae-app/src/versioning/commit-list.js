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
          border: 1px solid #eaeaea;
          margin-top: auto;
          margin-bottom: auto;
          padding: 0.1em 0.2em;
          border-radius: 3px;
        }
        .commit:hover {
          background: #eeeeee;
        }
        .commit-selected {
          background: #eeeeee;
        }
      </style>
      <h3>Commits</h3>
      <div class="separator"></div>
      <div style="overflow: scroll; height: 500px">
        <div id="spinner-commit-list" style="display: flex; width: 100%">
          <paper-spinner-lite style="margin-top: 2em; margin-left: auto; margin-right: auto" active></paper-spinner-lite>
        </div>
        <!-- list commits -->
        ${this.versionedModel ? html`
        ${this.versionedModel.commits.map(commit => html`
          <div class=${this.selectedCommitId == commit.id ? "commit-selected" : "commit"} style="padding-bottom: 1em">
            <!-- check if commit is the commit for uncommited changes -->
            ${commit.message ? html`
              <!-- standard commit -->
              <div style="display: flex">
                <!-- commit message -->
                <p style="width: 100%; margin-right: 0; margin-bottom: 0" @click=${() => this._onCommitLeftClicked(commit)}>${commit.message}</p>
                <!-- button for context menu -->
                <paper-menu-button vertical-align="bottom" style="margin-left: auto; padding-left: 0; padding-right: 0">
                  <paper-icon-button slot="dropdown-trigger" icon="more-vert" style="padding-left: 0; padding-right: 0"></paper-icon-button>
                  <p slot="dropdown-content" style="padding-left: 4px; padding-right: 4px"
                    @click=${() => this._onResetModelToCommitClicked(commit)}>Reset model to this commit</p>
                </paper-menu-button>
              </div>
              <!-- version tag -->
              ${commit.versionTag ? html`
                <div style="margin-top: 8px; margin-bottom: 4px">
                  <span class="label">${commit.versionTag}</span>
                </div>
              ` : html``}
              <!-- timestamp -->
              <p style="color: #aeaeae; margin-top: 4px; margin-bottom: 0" @click=${() => this._onCommitLeftClicked(commit)}>${this.beautifyTimestamp(commit.timestamp)}</p>
            ` : html`
              <!-- commit for uncommited changes -->
              <div style="display: flex" @click=${() => this._onCommitLeftClicked(commit)}>
                <p>Uncommited changes</p>
              </div>
            `}
          </div>
          <div class="separator"></div>
        `)}
        ` : html``}
      </div>
    `;
  }

  static get properties() {
    return {
      versionedModel: {
        type: Object
      },
      selectedCommitId: {
        type: Number
      }
    };
  }

  /**
   * Gets called when the user left-clicks on a commit in the commit list.
   * @param commit The commit that was left-clicked.
   * @private
   */
  _onCommitLeftClicked(commit) {
    this.selectedCommitId = commit.id;
    const event = new CustomEvent("commit-selected", {
      detail: {
        commit: commit
      }
    });
    this.dispatchEvent(event);
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

    // hide loading spinner
    this.getSpinner().style.display = "none";
  }

  /**
   * Removes not needed information (seconds) from timestamp and
   * changes the format a bit.
   * @param originalTimestamp The timestamp from the database.
   * @returns {string} Timestamp in format: 31.12.2020 14:00
   */
  beautifyTimestamp(originalTimestamp) {
    if(originalTimestamp == null) return null;
    const year = originalTimestamp.split("-")[0];
    const month = originalTimestamp.split("-")[1];
    const day = originalTimestamp.split("-")[2].split(" ")[0];

    const time = originalTimestamp.split(" ")[1].substring(0,5);

    return day + "." + month + "." + year + " " + time;
  }

  getSpinner() {
    return this.shadowRoot.getElementById("spinner-commit-list");
  }
}

customElements.define('commit-list', CommitList);
