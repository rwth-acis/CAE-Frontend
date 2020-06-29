import { LitElement, html} from 'lit-element';
import '@polymer/paper-checkbox/paper-checkbox.js';
import Common from "../common";
import Auth from "../auth";
import Static from "../static";
import ModelDifferencing from "../model-differencing/model-differencing";
import SemVer from "../util/sem-ver";

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
          width: 2.5em;
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
        /*
         The following is used to always show the up/down buttons next to the version tag
         number input fields. Only needed for Chrome. Automatically works in Firefox.
         */
        input[type=number]::-webkit-inner-spin-button {
          opacity: 1
        }
      </style>
      
      <h3>Commit Details</h3>
      <div class="separator"></div>
      <!-- div for main content -->
      <div style="height: 500px; display: flex; flex-direction: column">
        <!-- div for displaying changes -->
        <div style="flex-grow: 1">
          <!-- div for selecting all changes -->
          <div id="div-select-all" style="padding-left: 0.5em; margin-top: 1em; margin-bottom: 1em">
            <paper-checkbox @change=${this._onCheckboxSelectAllChanged} id="checkbox-select-all" aria-checked="false">Select all changes</paper-checkbox>
          </div>
          <div class="separator"></div>
          <!-- div for changes list -->
          <div id="changes-list" style="overflow: scroll; height: 400px">
            <!-- gets replaced by code -->
          </div>
        </div>
        <div class="separator"></div>
        <!-- div for commit settings -->
        <div id="div-commit-settings" style="margin-left: 1em; margin-top: 1em; margin-bottom: 1em; margin-right: 1em">
          <!-- div for commit version tag settings -->
          <div>
            <paper-checkbox aria-checked="false" id="new-version-checkbox" @change="${this._onNewVersionCheckBoxChanged}">New version</paper-checkbox>
            <!-- div for entering version number -->
            <div id="version-number-div" style="display: none">
              <div style="display: flex; height: 2em; margin-top: 0.5em">
                <input id="input-version-number-1" @change=${(e) => this._onVersionInputChanged(e, 1)} type="number" step="1" min="0" value="0" class="input input-version-number"/>
                <span style="margin-top: 0.85em">.</span>
                <input id="input-version-number-2" @change=${(e) => this._onVersionInputChanged(e, 2)} type="number" step="1" min="0" value="0" class="input input-version-number"/>
                <span style="margin-top: 0.85em">.</span>
                <input id="input-version-number-3" @change=${(e) => this._onVersionInputChanged(e, 3)} type="number" step="1" min="0" value="0" class="input input-version-number"/>
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
      
      <!-- Generic Toast (see showToast method for more information) -->
      <paper-toast id="toast" text="Will be changed later."></paper-toast>
      
      <!-- Generic Warning-Toast (see showWarningToast method for more information) -->
      <custom-style><style is="custom-style">
        #warning-toast {
          --paper-toast-background-color: red;
          --paper-toast-color: white;
        }
      </style></custom-style>
      <paper-toast id="warning-toast" text="Will be changed later."></paper-toast>
    `;
  }

  static get properties() {
    return {
      differences: {
        type: Array
      },
      versionedModel: {
        type: Object
      },
      selectedCommit: {
        type: Object
      },
      /**
       * Stores the differences that were done since the last real commit.
       * This is needed, because when the users views the changes of a different
       * commit than the "uncommited changes" one, and after that wants to see the
       * "uncommited changes" again, then we do not want to reload them from the Yjs room.
       */
      differencesUncommitedChanges: {
        type: Array
      },
      /**
       * The differences where the checkbox is checked.
       */
      selectedDifferences: {
        type: Array
      },
      yjsRunning: {
        type: Boolean
      },
      commits: {
        type: Array
      },
      /**
       * Stores the HTML Elements of the differences, i.e. the changes that are displayed
       * in the list. This array is used to change the checked-state of the checkboxes
       * of the difference HTML elements.
       */
      differenceElements: {
        type: Array
      },
      /**
       * After setting the versioned model, this gets set to the latest version tag that is
       * assigned to a commit.
       */
      latestVersionTag: {
        type: Object
      },
      /**
       * Only used when a wireframe exists, i.e. only in frontend modeling.
       */
      currentWireframe: {
        type: String
      }
    };
  }

  constructor() {
    super();
    this.differences = [];
    this.yjsRunning = false;
    this.commits = [];
    this.differenceElements = [];
    this.latestVersionTag = undefined;
    this.currentWireframe = undefined;
  }

  /**
   * Whether the currently selected commit is the one for "uncommited changes".
   * @returns {boolean} Whether the currently selected commit is the one for "uncommited changes".
   */
  isUncommitedChangesCommitSelected() {
    if(this.selectedCommit) {
      return this.selectedCommit.message == null;
    }
    return true;
  }

  /**
   * When the user just views an older commit, then the UI for entering the commit
   * message, for choosing the version tag and for selecting all changes is not needed.
   * This method can be used to hide these UI elements.
   */
  hideUIForCommiting() {
    this.shadowRoot.getElementById("div-select-all").style.setProperty("display", "none");
    this.shadowRoot.getElementById("div-commit-settings").style.setProperty("display", "none");
  }

  /**
   * When the UI for commiting got hidden by a call of hideUIForCommiting(),
   * but after that the "uncommited changes" commit gets choosen again, the
   * UI has to be displayed again.
   * Therefore, this method might be used.
   */
  showUIForCommiting() {
    this.shadowRoot.getElementById("div-select-all").style.removeProperty("display");
    this.shadowRoot.getElementById("div-commit-settings").style.removeProperty("display");
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
    // check if at least one change got selected
    if(this.selectedDifferences.length == 0) {
      // no difference selected, commiting is not possible
      this.showWarningToast("You need to select at least one change to commit!");
      return;
    }

    // check if version tag got increased (if a version tag got entered)
    if(this.getNewVersionCheckBox().checked) {
      if(this.latestVersionTag != undefined) {
        if (!SemVer.greater(this.latestVersionTag, SemVer.extractSemanticVersionParts(this.getEnteredVersion()))) {
          this.showWarningToast("You need to increase the version number in order to commit!");
          return;
        }
      }
    }

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

    // check if a previous model exists
    if(this.versionedModel.commits.length > 1) {
      // previous model exists
      const previousModel = this.versionedModel.commits[1].model;
      // create the updated model which should be stored into the database, by applying the currently selected differences
      const updatedModel = ModelDifferencing.createModelFromDifferences(previousModel, this.selectedDifferences);
      body.model = updatedModel;
    } else {
      // there does not exist a previous model
      const updatedModel = ModelDifferencing.createModelFromDifferences(ModelDifferencing.getEmptyModel(), this.selectedDifferences);
      body.model = updatedModel;
    }

    // add wireframe to model
    body.model.wireframe = this.currentWireframe;

    // add type of component, because the Model Persistence Service then adds it as an attribute to the model
    // and the Code Generation Service can use it
    body.componentType = Common.getComponentTypeByVersionedModelId(this.versionedModel.id);

    fetch(Static.ModelPersistenceServiceURL + "/versionedModels/" + Common.getVersionedModelId() + "/commits", {
      method: "POST",
      headers: Auth.getAuthHeader(),
      body: JSON.stringify(body)
    }).then(response => {
      // close dialog
      this.closeLoadingDialog();

      // clear message input field
      this.getCommitMessageInput().value = "";

      // reset version tag input area
      this.resetVersionTagUI();

      if(response.ok) {
        // since the selected differences got commited, they can be removed from this.differencesUncommitedChanges
        this.differencesUncommitedChanges = this.differencesUncommitedChanges.filter(diff => !this.selectedDifferences.includes(diff));

        // since the user commited, we have the "uncommited changes" commit as the selected commit
        // thus, after the commit, the changes list needs to be updated
        this.setDifferencesToDifferencesUncommitedChanges();
        this.updateChangesListElement();

        // reload commit list
        this.sendReloadCommitListEvent();
      } else {
        console.log(response.status);
        if(response.status == "403") {
          this.showToast("You are not allowed to commit to this component!");
        }
      }
    });
  }

  /**
   * Gets called by versioning-element after the versioned model got loaded from API.
   * @param versionedModel
   */
  setVersionedModel(versionedModel) {
    this.versionedModel = versionedModel;
    console.log("Commit-Details: Received versioned model from versioning-element.");

    this.commits = versionedModel.commits;
    // set uncommited changes commit as the selected one
    this.selectedCommit = this.commits[0];

    this.selectedDifferences = [];

    // check if there exists a commit with a version tag
    // if there exists one, then get the currently latest version tag
    this.latestVersionTag = undefined;
    for(const commit of this.commits) {
      const versionTag = commit.versionTag;
      // check if it matches the Semantic Version format
      if(SemVer.isSemanticVersionNumber(versionTag)) {
        this.latestVersionTag = SemVer.extractSemanticVersionParts(versionTag);
        break;
      }
    }

    // only setup Yjs if this is the first time when setVersionedModel is called
    if(!this.yjsRunning) {
      this.yjsRunning = true;
      // observe current model for changes
      Y({
        db: {
          name: "memory" // store the shared data in memory
        },
        connector: {
          name: "websockets-client", // use the websockets connector
          room: Common.getYjsRoomNameForVersionedModel(versionedModel.id),
          options: { resource: Static.YjsResourcePath},
          url: Static.YjsAddress
        },
        share: { // specify the shared content
          data: 'Map'
        }
      }).then(function(y) {
        // wait until a model is available
        // because there was the bug, that the model sometimes was not available yet
        const waitForModel = function() {
          if(y.share.data.get("model") != undefined) {
            // model is available
            console.log("model is available now");

            // update this.differencesUncommitedChanges
            this.updateDifferencesUncommitedChanges(y.share.data.get("model"));

            // since the versioning widget got just started, the selected commit is the "uncommited changes" one
            this.setDifferencesToDifferencesUncommitedChanges();
            this.updateChangesListElement();

            // set wireframe (does not matter if there exists one or not)
            this.currentWireframe = y.share.data.get("wireframe");

            y.share.data.observe(event => {
              console.log("model has changed");
              // model might have changed

              // update this.differencesUncommitedChanges
              this.updateDifferencesUncommitedChanges(y.share.data.get("model"));

              // reset selected differences
              // TODO: this should be changed later, the selected changes should still be selected
              this.selectedDifferences = [];

              // check if the currently selected commit is the one for "uncommited changes"
              if(this.selectedCommit.message == null) {
                // the currently selected commit is the one for "uncommited changes"
                // since the differences might have changed, we need to update the changes list
                this.setDifferencesToDifferencesUncommitedChanges();
                this.updateChangesListElement();
              } else {
                // the currently selected commit is not the one for "uncommited changes"
                // thus, we do not need to update the changes list
              }

              // maybe the wireframe changed too (does not matter if one exists or not)
              this.currentWireframe = y.share.data.get("wireframe");
            });
          } else {
            // model not available yet
            console.log("Waiting for model...");
            setTimeout(waitForModel, 500);
          }
        }.bind(this);
        waitForModel();
      }.bind(this));
    }
  }

  /**
   * Updates the variable this.differencesUncommitedChanges by calculating the differences
   * that were done since the last commit.
   * @param currentModelFromYjsRoom Current state of the model given from Yjs room.
   */
  updateDifferencesUncommitedChanges(currentModelFromYjsRoom) {
    // get last real commit (do not take "uncommited changes" commit)
    // lastCommit might be undefined
    let lastCommit = this.commits[1];

    // get differences between last commit and current model state
    if(lastCommit == undefined) {
      // there does not exist a commit, so calculated everything that the current model consists of
      this.differencesUncommitedChanges = ModelDifferencing.getDifferencesOfSingleModel(currentModelFromYjsRoom);
    } else {
      // there exists a last commit, so we can calculate the differences between the last commit and the current model state
      this.differencesUncommitedChanges = ModelDifferencing.getDifferences(lastCommit.model, currentModelFromYjsRoom);
    }
  }

  /**
   * Sets this.differences to the differences of the "uncommited changes".
   */
  setDifferencesToDifferencesUncommitedChanges() {
    this.differences = [];
    for(const diff of this.differencesUncommitedChanges) {
      this.differences.push(diff);
    }
  }

  /**
   * Gets called when the selected commit in the commit-list has changed.
   * @param commit
   * @private
   */
  _onCommitSelected(commit) {
    //console.log("commit changed", commit);
    this.selectedCommit = commit;

    // reset checkbox to select all changes
    this.getCheckboxSelectAllElement().checked = false;
    // reset selected differences
    this.selectedDifferences = [];

    // show or hide UI for commiting
    if(this.isUncommitedChangesCommitSelected()) {
      // the selected commit is the one for "uncommited changes"
      this.showUIForCommiting();

      // if we just use the model given from commit.model, then this will be the same
      // as the commit before it
      // we must choose the current model from yjs room
      this.setDifferencesToDifferencesUncommitedChanges();
      this.updateChangesListElement();
    } else {
      // the selected commit is not the one for "uncommited changes"
      this.hideUIForCommiting();

      // get previous commit before the one that got selected
      const commitBefore = this.getCommitBefore(commit);
      // check if a previous commit exists
      if(commitBefore) {
        // previous commit exists
        this.differences = ModelDifferencing.getDifferences(commitBefore.model, commit.model);
        this.updateChangesListElement();
      } else {
        // previous commit does not exist
        this.differences = ModelDifferencing.getDifferencesOfSingleModel(commit.model);
        this.updateChangesListElement();
      }
    }
  }

  /**
   * Searches for the last commit that was commited before the given one.
   * @param commit
   */
  getCommitBefore(commit) {
    let returnNext = false;
    let commitToReturn = undefined;
    for(let c of this.versionedModel.commits) {
      if(returnNext) {
        commitToReturn =  c;
        break;
      }
      if(c.id == commit.id) {
        // this is the commit we searched for, the one before should get returned
        // the one before is the next one in the array
        returnNext = true;
      }
    }
    return commitToReturn;
  }

  /**
   * Updates the changes list by using the differences stored in
   * this.differences.
   */
  updateChangesListElement() {
    const changesListElement = this.getChangesListElement();

    // clear all elements
    while (changesListElement.firstChild) changesListElement.removeChild(changesListElement.firstChild);

    this.differenceElements = [];
    // read elements
    for(let i in this.differences) {
      const difference = this.differences[i];

      // only display the checkbox on the left of the element if the current commit is the "uncommited changes" one
      const listener = function(checkboxChecked) {
        if(checkboxChecked) {
          this.selectedDifferences.push(difference);
          // check if every change is checked, because then the checkbox to select all changes should also be checked
          let allChecked = true;
          for(let diffElement of this.differenceElements) {
            const checkbox = diffElement.getElementsByTagName("paper-checkbox")[0];
            if(!checkbox.checked) allChecked = false;
          }
          // special case: no diff elements available
          if(this.differenceElements.length == 0) allChecked = false;
          if(allChecked) {
            this.getCheckboxSelectAllElement().checked = true;
          }
        } else {
          this.selectedDifferences = this.selectedDifferences.filter(diff => diff != difference);
          // since at least one checkbox is not checked, the checkbox to select all changes should also not be checked
          this.getCheckboxSelectAllElement().checked = false;
        }
        console.log("selected differences", this.selectedDifferences);
      }.bind(this);
      const checkboxListener = this.selectedCommit.message == null ? listener : undefined;

      const diffHTMLElement = difference.toHTMLElement(checkboxListener);
      this.differenceElements.push(diffHTMLElement);

      changesListElement.appendChild(diffHTMLElement);
      changesListElement.appendChild(this.getSeparatorElement());
    }
  }

  /**
   * Gets called when the checked-state of the checkbox to select all changes gets changed.
   * @param event
   * @private
   */
  _onCheckboxSelectAllChanged(event) {
    const checked = this.getCheckboxSelectAllElement().checked;

    if(checked) {
      for(const element of this.differenceElements) {
        const checkbox = element.getElementsByTagName("paper-checkbox")[0];
        if(checkbox) {
          if(!checkbox.checked) {
            checkbox.checked = true;

            // also fire a change event so that the change listener gets called
            const event = document.createEvent("HTMLEvents");
            event.initEvent("change", false, true);
            checkbox.dispatchEvent(event);
          }
        }
      }
    }
  }

  getCheckboxSelectAllElement() {
    return this.shadowRoot.getElementById("checkbox-select-all");
  }

  getSeparatorElement() {
    const separator = document.createElement("div");
    separator.setAttribute("class", "separator");
    return separator;
  }

  getChangesListElement() {
    return this.shadowRoot.getElementById("changes-list");
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

      // reset version number
      this.setInitVersionNumber();
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

  resetVersionTagUI() {
    // reset checkbox
    this.getNewVersionCheckBox().checked = false;

    // reset input fields
    this.setInitVersionNumber();

    // hide version number div
    this.getVersionNumberDiv().style.display = "none";
  }

  setInitVersionNumber() {
    // set to default init values
    // As mentioned on https://semver.org/, the simplest way is starting
    // the initial development release at 0.1.0
    let initMajor = 0;
    let initMinor = 1;
    let initPatch = 0;

    // if there already exists a version tag on a previous commit, then take the version number from there
    // as the initial version number
    if(this.latestVersionTag) {
      initMajor = this.latestVersionTag.major;
      initMinor = this.latestVersionTag.minor;
      initPatch = this.latestVersionTag.patch;
    }
    // put initial number into input fields
    this.setEnteredVersion(initMajor,initMinor,initPatch);
    // set these initial values as the minimum for the input fields
    this.getVersionNumberInput(1).min = initMinor;
    this.getVersionNumberInput(2).min = initMinor;
    this.getVersionNumberInput(3).min = initPatch;
  }

  _onVersionInputChanged(event, field) {
    console.log("version tag: input field " + field + " changed");
    const inputElement = this.getVersionNumberInput(field);
    // Example: latestVersionTag is 0.1.2, then the minimum values for the input fields are 0, 1 and 2.
    // If the user changes the version tag to 0.2.2, then the minimum value of the patch part could also
    // be 0, because 0.2.0 > 0.1.2. Thus the minimum of the second input field needs to be updated from 2 to 0.
    const currentVersionTag = SemVer.extractSemanticVersionParts(this.getEnteredVersion());

    // update minimum values of input fields

    // set minimum for major part
    if(this.latestVersionTag) {
      if(currentVersionTag.major > this.latestVersionTag.major) {
        this.getVersionNumberInput(1).min = this.latestVersionTag.major;
        this.getVersionNumberInput(2).min = "0";
        this.getVersionNumberInput(3).min = "0";
      } else if(currentVersionTag.major == this.latestVersionTag.major) {
        this.getVersionNumberInput(1).min = this.latestVersionTag.major;
        if(currentVersionTag.minor > this.latestVersionTag.minor) {
          this.getVersionNumberInput(2).min = this.latestVersionTag.minor;
          this.getVersionNumberInput(3).min = "0";
        } else if(currentVersionTag.minor == this.latestVersionTag.minor) {
          this.getVersionNumberInput(2).min = this.latestVersionTag.minor;
          this.getVersionNumberInput(3).min = this.latestVersionTag.patch;
        }
      }

      // reset colors
      this.getVersionNumberInput(1).style.removeProperty("background");
      this.getVersionNumberInput(2).style.removeProperty("background");
      this.getVersionNumberInput(3).style.removeProperty("background");

      // check if the new version tag is lower than the previous one
      this.getCommitButton().disabled = this.getCommitMessageInput().value == "";
      if(!SemVer.greaterEqual(this.latestVersionTag, currentVersionTag)) {
        console.log("current is not greater equal last version tag");
        if(currentVersionTag.major < this.latestVersionTag.major) {
          this.getVersionNumberInput(1).style.setProperty("background", "rgba(239,57,67,0.59)");
        } else if(currentVersionTag.minor < this.latestVersionTag.minor) {
          this.getVersionNumberInput(2).style.setProperty("background", "rgba(239,57,67,0.59)");
        } else if(currentVersionTag.patch < this.latestVersionTag.patch) {
          this.getVersionNumberInput(3).style.setProperty("background", "rgba(239,57,67,0.59)");
        }
        this.getCommitButton().disabled = true;
      }
    }
  }

  /**
   * Creates a semantic version number from the three input fields.
   * @returns {string}
   */
  getEnteredVersion() {
    const major = this.getVersionNumberInput(1).value;
    const minor = this.getVersionNumberInput(2).value;
    const patch = this.getVersionNumberInput(3).value;
    return major + "." + minor + "." + patch;
  }

  /**
   * Puts the given Semantic Version number into the three input fields.
   * @param major Major part of the version number.
   * @param minor Minor part of the version number.
   * @param patch Patch part of the version number.
   */
  setEnteredVersion(major, minor, patch) {
    this.getVersionNumberInput(1).value = major;
    this.getVersionNumberInput(2).value = minor;
    this.getVersionNumberInput(3).value = patch;
  }

  getVersionNumberInput(part) {
    return this.shadowRoot.getElementById("input-version-number-" + part);
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

  /**
   * Since the cae-static-app page uses lots of toast messages,
   * it is helpful to have this method for displaying toast messages.
   * It allows to have one single paper-toast item in the html which
   * gets used for different message texts.
   * @param text Text to display in the toast.
   */
  showToast(text) {
    const toastElement = this.shadowRoot.getElementById("toast");
    toastElement.text = text;
    toastElement.show();
  }

  /**
   * Since the cae-static-app page uses lots of toast messages,
   * it is helpful to have this method for displaying warning toast messages.
   * It allows to have one single paper-toast item in the html which
   * gets used for different message texts.
   * @param text Text to display in the toast.
   */
  showWarningToast(text) {
    const toastElement = this.shadowRoot.getElementById("warning-toast");
    toastElement.text = text;
    toastElement.show();
  }
}

customElements.define('commit-details', CommitDetails);
