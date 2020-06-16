import { LitElement, html} from 'lit-element';
import '@polymer/paper-checkbox/paper-checkbox.js';
import Common from "../common";
import Auth from "../auth";
import Static from "../static";

export class CommitDetails extends LitElement {
  render() {
    return html`
      <style>
        .separator {
          border-top: thin solid #e1e1e1;
        }
        .input {
          width: 100%;
          border-radius: 3px;
          margin-right: 0.2em;
          margin-left: 0.2em;
          border: thin solid #e1e1e1;
          height: 2.5em;
          padding-left:5px;
        }
        /* Set outline to none, otherwise the border color changes when clicking on input field. */
        .input:focus {
          outline: none;
        }
        .input-version-number {
          width: 1em;
          height: 2em;
        }
        paper-button {
          color: rgb(240,248,255);
          background: rgb(30,144,255);
          height: 2.5em;
        }
        paper-button:hover {
          color: rgb(240,248,255);
          background: rgb(65,105,225);
        }
        paper-button[disabled] {
          background: #e1e1e1;
        }
      </style>
      
      <h3>Commit Details</h3>
      <div class="separator"></div>
      <!-- div for main content -->
      <div style="height: 500px; display: flex; flex-direction: column">
        <!-- div for displaying changes -->
        <div style="flex-grow: 1">
          <!-- div for selecting all changes -->
          <div style="margin-left: 1em; margin-top: 1em; margin-bottom: 1em">
            <paper-checkbox checked="true" disabled="true">Select all changes</paper-checkbox>
          </div>
          <div class="separator"></div>
          <!-- div for changes list -->
          <div>
            <p>Changes are not yet displayed and it is only possible to commit all new changes.
            There is no check if the model really changed.</p>
          </div>
        </div>
        <div class="separator"></div>
        <!-- div for commit settings -->
        <div style="margin-left: 1em; margin-top: 1em; margin-bottom: 1em; margin-right: 1em">
          <!-- div for commit version tag settings -->
          <div>
            <paper-checkbox aria-checked="false" id="new-version-checkbox" @change="${this._onNewVersionCheckBoxChanged}">New version</paper-checkbox>
            <!-- div for entering version number -->
            <div id="version-number-div" style="display: none">
              <div style="display: flex; height: 2em; margin-top: 0.5em">
                <input id="input-version-number-1" class="input input-version-number"/>
                <span style="margin-top: 0.85em">.</span>
                <input id="input-version-number-2" class="input input-version-number"/>
                <span style="margin-top: 0.85em">.</span>
                <input id="input-version-number-3" class="input input-version-number"/>
              </div>
            </div>
          </div>
          <!-- div for commit message and commit button -->
          <div style="margin-top: 0.5em">
            <input id="input-commit-message" class="input" placeholder="Enter commit message" style="margin-left: 0"
              @input="${(e) => this._onCommitMessageInputChanged(e.target.value)}"/>
            <paper-button id="button-commit" @click="${this._onCommitClicked}"
                        style="margin-top: 0.5em" disabled="true">Commit</paper-button>
          </div>
        </div>
      </div>
      
      <!-- Dialog showing a loading bar -->
      <paper-dialog id="dialog-loading" modal>
        <paper-spinner-lite active></paper-spinner-lite>
      </paper-dialog>
    `;
  }

  /**
   * Gets called when the input of the commit message input field
   * gets changed.
   * @param commitMessage The currently entered commit message.
   * @private
   */
  _onCommitMessageInputChanged(commitMessage) {
    if(commitMessage) {
      // enable commit button, because commit message is not empty anymore
      this.getCommitButton().disabled = false;
    } else {
      // commit button should only be enabled when a message is entered
      // so disable commit button now, since message is empty
      this.getCommitButton().disabled = true;
    }
  }

  /**
   * Gets called when the user clicks on the "commit" button.
   * @private
   */
  _onCommitClicked() {
    // get commit message
    const commitMessage = this.getCommitMessageInput().value;

    // disable button so that it is not possible to click the button twice (or more often)
    this.getCommitButton().disabled = true;

    // show dialog
    this.openLoadingDialog();

    const body = {
      message: commitMessage
    };

    if(this.getNewVersionCheckBox().checked) {
      body.versionTag = this.getEnteredVersion();
    }

    // get current model out of Yjs room
    Common.getModelFromYjsRoom(Common.getYjsRoomNameForVersionedModel(Common.getVersionedModelId())).then(model => {
      if(model) {
        body.model = model;

        fetch(Static.ModelPersistenceServiceURL + "/versionedModels/" + Common.getVersionedModelId() + "/commits", {
          method: "POST",
          headers: Auth.getAuthHeader(),
          body: JSON.stringify(body)
        }).then(response => {
          // close dialog
          this.closeLoadingDialog();

          // clear input field
          this.getCommitMessageInput().value = "";

          if(response.ok) {
            // reload commit list
            this.sendReloadCommitListEvent();
          } else {
            console.log(response.status);
          }
        });
      }
    });
  }

  /**
   * Notifies the versioning-element to reload the commit list.
   */
  sendReloadCommitListEvent() {
    const event = new CustomEvent("reload-commit-list");
    this.dispatchEvent(event);
  }

  /**
   * Gets called when the checked-value of the new version checkbox
   * got changed.
   * Expands/hides possibility to edit version tag.
   * @private
   */
  _onNewVersionCheckBoxChanged() {
    const checked = this.getNewVersionCheckBox().checked;

    if(checked) {
      // expand possibility to edit version tag
      this.getVersionNumberDiv().removeAttribute("style");
    } else {
      // hide possibility to edit version tag
      this.getVersionNumberDiv().style.display = "none";
    }
  }

  /**
   * Returns the HTMLElement of the commit button.
   * @returns {HTMLElement} HTMLElement of the commit button.
   */
  getCommitButton() {
    return this.shadowRoot.getElementById("button-commit");
  }

  /**
   * Returns the HTMLElement of the check box for deciding whether the commit
   * should be tagged with a new version or not.
   * @returns {HTMLElement} HTMLElement of the new version checkbox.
   */
  getNewVersionCheckBox() {
    return this.shadowRoot.getElementById("new-version-checkbox");
  }

  /**
   * Creates a semantic version number from the three input fields.
   * @returns {string}
   */
  getEnteredVersion() {
    const major = this.shadowRoot.getElementById("input-version-number-1").value;
    const minor = this.shadowRoot.getElementById("input-version-number-2").value;
    const patch = this.shadowRoot.getElementById("input-version-number-3").value;
    return major + "." + minor + "." + patch;
  }

  /**
   * Returns the HTMLElement of the div that gets used for entering the version
   * number of a commit.
   * @returns {HTMLElement} HTMLElement of the div for entering the version number.
   */
  getVersionNumberDiv() {
    return this.shadowRoot.getElementById("version-number-div");
  }

  /**
   * Returns the HTMLElement of the input field for entering the commit message.
   * @returns {HTMLElement} HTMLElement of commit message input field.
   */
  getCommitMessageInput() {
    return this.shadowRoot.getElementById("input-commit-message");
  }

  /**
   * Opens the dialog which shows a progress spinner.
   */
  openLoadingDialog() {
    this.shadowRoot.getElementById("dialog-loading").open();
  }

  /**
   * Closes the dialog which shows a progress spinner.
   */
  closeLoadingDialog() {
    this.shadowRoot.getElementById("dialog-loading").close();
  }
}

customElements.define('commit-details', CommitDetails);
