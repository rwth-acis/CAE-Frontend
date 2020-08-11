import { LitElement, html} from 'lit-element';
import Common from "../util/common";
import MetamodelUploader from "../util/metamodel-uploader";
import Static from "../static";

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
        .label-commit-type {
          margin-top: auto;
          margin-bottom: auto;
          padding: 0.1em 0.2em;
          border-radius: 3px;
          margin-right: 2px;
        }
        .label-code-commit {
          color: #1E90FF;
          border: 1px solid #1E90FF;
        }
        .label-model-commit {
          color: #00cf20;
          border: 1px solid #00cf20;
        }
        .commit:hover {
          background: #eeeeee;
        }
        .commit-selected {
          background: #eeeeee;
        }
      </style>
      <h3>Commit List</h3>
      <div class="separator"></div>
      <div style="overflow: scroll; height: 500px">
        <div id="spinner-commit-list" style="display: flex; width: 100%">
          <paper-spinner-lite style="margin-top: 2em; margin-left: auto; margin-right: auto" active></paper-spinner-lite>
        </div>
        <!-- list commits -->
        ${this.versionedModel ? html`
        ${this.versionedModel.commits.map(commit => html`
            <!-- check if commit is the commit for uncommited changes -->
            ${commit.message ? html`
              <!-- standard commit -->
              <div class=${this.selectedCommitId == commit.id ? "commit-selected" : "commit"} @click=${() => this._onCommitLeftClicked(commit)} style="padding-bottom: 1em">
                <div style="display: flex; padding-top: 0.5em">
                  <!-- commit message -->
                  <p style="width: 100%; margin-right: 0; margin-top: auto; margin-bottom: auto">
                    ${commit.commitType == 0 ? 
                      html`<span class="label-commit-type label-model-commit">Model</span>` : 
                      html`<span class="label-commit-type label-code-commit">Code</span>`
                    }
                    ${commit.message}</p>
                  <!-- button for context menu -->
                  <!--<paper-menu-button vertical-align="bottom" style="margin-left: auto; padding-left: 0; padding-right: 0">
                    <paper-icon-button slot="dropdown-trigger" icon="more-vert" style="padding-left: 0; padding-right: 0"></paper-icon-button>
                    <p slot="dropdown-content" style="padding-left: 4px; padding-right: 4px"
                      @click=${() => this._onResetModelToCommitClicked(commit)}>Reset model to this commit</p>
                  </paper-menu-button>-->
                  ${!this.isApplication() ? html`
                    <a title="View commit on GitHub" style="text-decoration: none; margin-left: 0.5em; margin-right: 0.5em; margin-top: auto; margin-bottom: auto" 
                        href=${CommitList.getCommitGitHubURL(commit)} target="_blank">
                      <img style="width: 1.5em; height: 1.5em" src="https://raw.githubusercontent.com/primer/octicons/e9a9a84fb796d70c0803ab8d62eda5c03415e015/icons/mark-github-16.svg" class="github-img">
                    </a>
                  ` : html``}
                </div>
                <!-- version tag -->
                ${commit.versionTag ? html`
                  <div style="margin-top: 8px; margin-bottom: 4px">
                    <span class="label">${commit.versionTag}</span>
                  </div>
                ` : html``}
                <!-- timestamp -->
                <p style="color: #aeaeae; margin-top: 4px; margin-bottom: 0">${this.beautifyTimestamp(commit.timestamp)}</p>
              </div>
            ` : html`
              <!-- commit for uncommited changes -->
              <!-- this commit should not be shown if committing is disabled -->
              ${this.committingDisabled ? html`` : html`
                <div class=${this.selectedCommitId == commit.id ? "commit-selected" : "commit"} style="padding-bottom: 1em">
                  <div style="display: flex" @click=${() => this._onCommitLeftClicked(commit)}>
                    <p>Uncommited changes</p>
                  </div>
                </div>
              `}
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
      },
      committingDisabled: {
        type: Boolean
      }
    };
  }

  constructor() {
    super();

    // default: committing should be enabled
    this.committingDisabled = false;
  }

  /**
   * Gets called when the user left-clicks on a commit in the commit list.
   * @param commit The commit that was left-clicked.
   * @private
   */
  _onCommitLeftClicked(commit) {
    // only do something, if the commit that got selected was not selected before
    if(commit.id == this.selectedCommitId) return;

    this.selectedCommitId = commit.id;

    // check if the commit is the one for "uncommited changes"
    if(commit.message == null) {
      // show the main modeling in the main Yjs room again
      parent.caeRoom = Common.getYjsRoomNameForVersionedModel(this.versionedModel.id, Common.isCurrentComponentDependency());
      this.dispatchEvent(new CustomEvent("show-main-canvas"));
    } else {
      // we want to show the model at a previous stage/commit
      // check if it is a "model commit" or a "code commit"
      // because "code commits" do not contain a model (then we need to get a previous one)
      let model;
      if(commit.commitType == 0) {
        // commit is a "model commit"
        // thus the commit itself contains a model we can display
        model = commit.model;
      } else if(commit.commitType == 1) {
        // commit is a "code commit"
        // thus the commit itself does not contain a model, so we need to get the previous model
        let reachedCommit = false;
        for(const c of this.versionedModel.commits) {
          if(!reachedCommit) {
            if(c.id == commit.id) reachedCommit = true;
          } else {
            if(c.commitType == 0) {
              // this is a previous commit which is a model commit
              // use the model of this commit
              model = c.model;
              break;
            }
          }
        }
      } else {
        console.error("Commit type is neither 0 or 1.");
        return;
      }

      if(!model) {
        console.error("No model found to display.");
        return;
      }

      // change the model which is shown in the canvas
      const componentType = Common.getComponentTypeByVersionedModelId(this.versionedModel.id);
      // therefore change the Yjs room which is used first
      parent.caeRoom = Common.getYjsRoomNameForSpecificCommit(this.versionedModel.id, commit.id, Common.isCurrentComponentDependency());

      // upload model and metamodel for the commit
      MetamodelUploader.uploadMetamodelAndModelForSpecificCommit(componentType, model,
        this.versionedModel.id, commit.id, Common.isCurrentComponentDependency()).then(
        (_ => {
          // try to hide the canvas and show a new one (which then uses the newly set caeRoom)
          this.dispatchEvent(new CustomEvent("show-commit-canvas"));
        }).bind(this)
      );
    }

    const event = new CustomEvent("commit-selected", {
      detail: {
        commit: commit
      }
    });
    this.dispatchEvent(event);
  }

  // This is currently not used, but might be added as a feature later.
  /**
   * Gets called when the user wants to reset the model to a specific commit.
   * @param commit Commit where the model should be reset to.
   * @private
   */
  /*_onResetModelToCommitClicked(commit) {
    console.log("reset model to commit clicked:");
    console.log(commit);
  }*/

  /**
   * Gets called by versioning-element after the versioned model got loaded from API.
   * @param versionedModel
   * @param committingDisabled This is set to true, if committing should be disabled.
   */
  setVersionedModel(versionedModel, committingDisabled) {
    console.log("Commit-List: Received versioned model from versioning-element.");
    this.versionedModel = versionedModel;
    this.committingDisabled = committingDisabled;

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

    originalTimestamp.replace(" ", "T");
    const date = new Date(originalTimestamp + "Z");

    const year = date.getFullYear();
    const month = date.getMonth() < 10 ? "0" + (date.getMonth()+1) : (date.getMonth()+1);
    const day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    const hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
    const minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();

    const time = hours + ":" + minutes;
    return day + "." + month + "." + year + " " + time;
  }

  /**
   * Returns whether the currently shown component is an application mashup.
   * @returns {boolean} Whether the currently shown component is an application mashup.
   */
  isApplication() {
    return Common.getComponentTypeByVersionedModelId(Common.getVersionedModelId()) == "application";
  }

  static getCommitGitHubURL(commit) {
    return "https://github.com/" + Static.GitHubOrg + "/" + Common.getGitHubRepoName() + "/commit/" + commit.sha;
  }

  getSpinner() {
    return this.shadowRoot.getElementById("spinner-commit-list");
  }
}

customElements.define('commit-list', CommitList);
