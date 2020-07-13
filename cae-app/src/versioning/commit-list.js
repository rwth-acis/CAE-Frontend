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
              <div style="display: flex; padding-top: 0.5em">
                <!-- commit message -->
                <p style="width: 100%; margin-right: 0; margin-top: auto; margin-bottom: auto" @click=${() => this._onCommitLeftClicked(commit)}>${commit.message}</p>
                <!-- button for context menu -->
                <!--<paper-menu-button vertical-align="bottom" style="margin-left: auto; padding-left: 0; padding-right: 0">
                  <paper-icon-button slot="dropdown-trigger" icon="more-vert" style="padding-left: 0; padding-right: 0"></paper-icon-button>
                  <p slot="dropdown-content" style="padding-left: 4px; padding-right: 4px"
                    @click=${() => this._onResetModelToCommitClicked(commit)}>Reset model to this commit</p>
                </paper-menu-button>-->
                ${!this.isApplication() ? html`
                  <a title="View commit on GitHub" style="text-decoration: none; margin-left: 0.5em; margin-right: 0.5em; margin-top: auto; margin-bottom: auto" 
                      href=${this.getCommitGitHubURL(commit)} target="_blank">
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
    if(commit.commitType == 1) {
      // this commit is not a commit which belongs to changes of the model
      // it is a commit which got created by the Live Code Editor
      return;
    }

    // only do something, if the commit that got selected was not selected before
    if(commit.id == this.selectedCommitId) return;

    this.selectedCommitId = commit.id;

    // check if the commit is the one for "uncommited changes"
    if(commit.message == null) {
      // show the main modeling in the main Yjs room again
      parent.caeRoom = Common.getYjsRoomNameForVersionedModel(this.versionedModel.id);
      this.dispatchEvent(new CustomEvent("show-main-canvas"));
    } else {
      // change the model which is shown in the canvas
      // we want to show the model at a previous stage/commit
      const componentType = Common.getComponentTypeByVersionedModelId(this.versionedModel.id);
      parent.caeRoom = Common.getYjsRoomNameForSpecificCommit(this.versionedModel.id, commit.id);
      MetamodelUploader.uploadMetamodelAndModelForSpecificCommit(componentType, commit.model,
        this.versionedModel.id, commit.id).then(
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

  /**
   * Returns whether the currently shown component is an application mashup.
   * @returns {boolean} Whether the currently shown component is an application mashup.
   */
  isApplication() {
    return Common.getComponentTypeByVersionedModelId(Common.getVersionedModelId()) == "application";
  }

  getCommitGitHubURL(commit) {
    return "https://github.com/" + Static.GitHubOrg + "/" + Common.getGitHubRepoName() + "/commit/" + commit.sha;
  }

  getSpinner() {
    return this.shadowRoot.getElementById("spinner-commit-list");
  }
}

customElements.define('commit-list', CommitList);
