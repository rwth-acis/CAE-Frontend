import { LitElement, html} from 'lit-element';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/paper-progress/paper-progress.js';
import Common from "../util/common";
import Auth from "../util/auth";
import Static from "../static";
import ModelDifferencing from "../util/model-differencing/model-differencing";
import SemVer from "../util/sem-ver";
import ModelValidator from "../util/model-differencing/model-validator";
import ModelDifference from "../util/model-differencing/model-difference";
import MetamodelUploader from "../util/metamodel-uploader";
import {CommitList} from "./commit-list";
import TestModelDifferencing from '../util/model-differencing/test-model-differencing';

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
        .paper-button-blue {
          color: rgb(240,248,255);
          background: rgb(30,144,255);
          height: 2.5em;
        }
        .paper-button-blue:hover {
          color: rgb(240,248,255);
          background: rgb(65,105,225);
        }
        .paper-button-blue[disabled] {
          background: #e1e1e1;
        }
        /*
         The following is used to always show the up/down buttons next to the version tag
         number input fields. Only needed for Chrome. Automatically works in Firefox.
         */
        input[type=number]::-webkit-inner-spin-button {
          opacity: 1
        }
        .undo-icon:hover {
          color: #7c7c7c;
        }
        .label {
          color: #586069;
          border: 1px solid #eaeaea;
          margin-top: auto;
          margin-bottom: auto;
          padding: 0.1em 0.2em;
          border-radius: 3px;
        }
      </style>
      
      <h3>Commit Details</h3>
      <div class="separator"></div>
      <!-- div for main content -->
      <div style="height: 500px; display: flex; flex-direction: column">
        <!-- div for selecting all changes -->
        <div id="div-select-all" style="display: flex; padding-left: 0.5em; margin-top: 1em; margin-bottom: 1em; margin-right: 1em">
          <paper-checkbox @change=${this._onCheckboxSelectAllChanged} id="checkbox-select-all" aria-checked="false">Select all changes</paper-checkbox>
          <iron-icon id="undo-changes-button" icon="undo" class="undo-icon" @click=${this._onUndoChangesClicked} style="margin-left: auto"></iron-icon>
        </div>
        <div class="separator"></div>
        <!-- div for displaying changes -->
        <div id="changes-list" style="overflow-y: scroll; height: 100%">
          <!-- gets replaced by code -->
        </div>
        <div class="separator"></div>
        <!-- div for commit settings -->
        <div id="div-commit-settings" style="margin-left: 1em; margin-top: 1em; margin-bottom: 1em; margin-right: 1em">
          <!-- div for commit version tag settings -->
          <div>
            <paper-checkbox aria-checked="false" id="new-version-checkbox" @change="${this._onNewVersionCheckBoxChanged}">New version</paper-checkbox>
            <!-- div for entering version number -->
            <div id="version-number-div" style="display: none">
              <div id="semver-number-div" style="display: flex; height: 2em; margin-top: 0.5em">
                <input id="input-version-number-1" @change=${(e) => this._onVersionInputChanged(e, 1)} type="number" step="1" min="0" value="0" class="input input-version-number"/>
                <span style="margin-top: 0.85em">.</span>
                <input id="input-version-number-2" @change=${(e) => this._onVersionInputChanged(e, 2)} type="number" step="1" min="0" value="0" class="input input-version-number"/>
                <span style="margin-top: 0.85em">.</span>
                <input id="input-version-number-3" @change=${(e) => this._onVersionInputChanged(e, 3)} type="number" step="1" min="0" value="0" class="input input-version-number"/>
              </div>
              <a id="a-different-version-format" @click=${this._onDifferentFormatClicked} href="">Different format</a>
              <div>
                <paper-input id="input-different-version-format" hidden="true" label="Version" style="margin-top: 0"></paper-input>
              </div>
            </div>
          </div>
          <!-- div for commit message and commit button -->
          <div id="div-commit-message-button" style="margin-top: 0.5em">
            <input id="input-commit-message" class="input" placeholder="Enter commit message" style="margin-left: 0"
              @input="${(e) => this._onCommitMessageInputChanged(e.target.value)}"/>
            <paper-button id="button-commit" @click="${this._onCommitClicked}" class="paper-button-blue"
                        style="margin-top: 0.5em" disabled="true">Commit</paper-button>
          </div>
        </div>
      </div>
      
      <!-- Dialog showing a loading bar -->
      <custom-style>
        <style is="custom-style">
          paper-progress.blue {
            --paper-progress-active-color: rgb(30,144,255);
          }
        </style>
      </custom-style>
      <paper-dialog id="dialog-loading" modal>
        <h2>Committing and pushing...</h2>
        <div>
          <paper-progress class="blue" style="width: 100%" indeterminate></paper-progress>
          <p>
            The changes are committed and pushed to GitHub. This may take some time.
          </p>
        </div>
      </paper-dialog>
      
      <!-- Confirmation dialog for undo changes -->
      <paper-dialog id="dialog-undo-confirmation" modal>
        <h2>Undo changes</h2>
        <p>Are you sure that you want to undo the changes since the last commit?</p>
        <div class="buttons">
          <paper-button dialog-dismiss>No</paper-button>
          <paper-button @click=${this._onConfirmUndoChangesClicked} dialog-confirm>Yes</paper-button>
        </div>
      </paper-dialog>
      
      <paper-dialog id="dialog-semver-verify" modal>
        <h2>Verify Update of Version</h2>
        <p id="dialog-semver-verify-text" style="margin-bottom: 6px">You have increased the <span id="dialog-semver-verify-part">MAJOR</span> part of the semantic version number.</p>
        <div style="display: flex; margin-top: 0">
          <div style="margin: auto">
            <span class="label" id="dialog-semver-prev-number">0.0.0</span>
            ->
            <span class="label" id="dialog-semver-new-number">0.0.0</span>
          </div>
        </div>
        <p style="margin-top: 6px">Please verify that this is justified:</p>
        <paper-checkbox @change=${this.dialogSemVerCheckBoxChanged} id="dialog-semver-checkbox" style="margin-top: 0.5em">TEXT REPLACED BY JAVASCRIPT</paper-checkbox>
        <p>You can find more information about the semantic versioning format <a href="https://semver.org/" target="_blank">here</a>.</p>
        <div class="buttons">
          <paper-button @click=${this.dontShowSemVerVerifyDialogAgain}>Don't show again</paper-button>
          <paper-button dialog-dismiss>Close</paper-button>
          <paper-button id="dialog-semver-btn-commit" disabled="true" @click=${this.postCommit} dialog-confirm>Commit</paper-button>
        </div>
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
      /**
       * The difference object of the differences list which is currently
       * selected, i.e. the user clicked on the item and it is highlighted now.
       * Note: This has nothing to do with the checkboxes, if an item is checked, then
       * it does not mean that it is "selected" here.
       */
      selectedDifference: {
        type: Object
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
      },
      /**
       * Stores the current test model (received from test-editor).
       */
      currentTestModel: {
        type: Object
      },
      /**
       * This references the Yjs instance of the currently shown canvas.
       */
      y: {
        type: Object
      },
      /**
       * Reference to the Yjs instance used for the actual modeling process.
       */
      mainY: {
        type: Object
      },
      committingDisabled: {
        type: Boolean
      },
      /**
       * Gets set in _onCommitClicked and then used in postCommit.
       */
      updatedModel: {
        type: Object
      },
      /**
       * Test model from previous commit with selected changes being applied to.
       */
      updatedTestModel: {
        type: Object
      },
      /**
       * Whether a different version format than the Semantic Versioning should be used.
       */
      differentVersionFormat: {
        type: Boolean
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
    this.currentTestModel = undefined;
    this.selectedDifference = undefined;
    // default: committing is enabled
    this.committingDisabled = false;
    this.differentVersionFormat = false;
  }

  firstUpdated() {
    // receive test model changes from test editor
    document.addEventListener("test-model-updated", (e) => {
      this.currentTestModel = e.detail.testModel;

      if(this.mainY) {
        this.reloadUncommitedChanges(this.mainY);
      }
    });
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
    this.shadowRoot.getElementById("new-version-checkbox").style.removeProperty("display");
    this.shadowRoot.getElementById("version-number-div").style.setProperty("display", "none");
    this.shadowRoot.getElementById("div-commit-message-button").style.removeProperty("display");
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
      // no difference selected, committing should only be possible if this is not the first commit
      // then empty commits may be used to create version tags
      // but the first commit needs to be a commit containing model changes
      if(this.versionedModel.commits.length <= 1) {
        // this is the first commit, it should not be empty
        this.showWarningToast("You need to select at least one change to commit!");
        return;
      }
    }

    const currentModel = this.y.share.data.get("model");

    // check if a previous model (and test model) exists
    this.updatedModel = undefined;
    this.updatedTestModel = undefined;

    if(this.versionedModel.commits.length > 1) {
      // previous model exists
      const lastCommit = this.getLastCommit(this.versionedModel.commits);
      const previousModel = lastCommit.model;
      // create the updated model which should be stored into the database, by applying the currently selected differences
      this.updatedModel = ModelDifferencing.createModelFromDifferences(previousModel, this.selectedDifferences, currentModel);

      // check if this is a microservice component
      if(Common.getComponentTypeByVersionedModelId(this.versionedModel.id) == "microservice") {
        // get state of test model from last commit
        const previousTestModel = lastCommit.testModel;
        // apply selected changes to the test model from last commit
        this.updatedTestModel = TestModelDifferencing.createTestModelFromDifferences(previousTestModel, this.selectedDifferences);
      }
    } else {
      // there does not exist a previous model
      this.updatedModel = ModelDifferencing.createModelFromDifferences(ModelDifferencing.getEmptyModel(), this.selectedDifferences, currentModel);

      // check if this is a microservice component
      if(Common.getComponentTypeByVersionedModelId(this.versionedModel.id) == "microservice") {
        this.updatedTestModel = TestModelDifferencing.createTestModelFromDifferences({"testCases": []}, this.selectedDifferences);
      }
    }

    const modelValid = ModelValidator.edgesValid(this.updatedModel);
    if(!modelValid) {
      this.showWarningToast("Model is not valid when applying the selected changes!");
      return;
    }

    // check if version tag got increased (if a version tag got entered)
    if(this.getNewVersionCheckBox().checked) {
      const enteredVersion = this.getEnteredVersion();

      if(!this.differentVersionFormat) {
        // we are using the sem-ver format
        if(this.latestVersionTag != undefined) {

          // check if entered version is "higher" than previous one
          if (!SemVer.greater(this.latestVersionTag, SemVer.extractSemanticVersionParts(enteredVersion))) {
            this.showWarningToast("You need to increase the version number in order to commit!");
            return;
          }

          // there exists a previous version tag and the currently entered one is "higher" than the previous one
          // find out which part of the sem-ver number got changed, then display verify dialog
          const changedPart = SemVer.getChangedPart(this.latestVersionTag, SemVer.extractSemanticVersionParts(enteredVersion));
          if (!Common.semVerVerifyDialogDisabled()) {
            this.openSemVerVerifyDialog(changedPart, SemVer.objectToString(this.latestVersionTag), enteredVersion);
            return;
          }
        }
        // otherwise, if the new version is the initial one, we dont want to show the sem-ver verify dialog
      } else {
        // user might use a different format than sem-ver
        // we cannot check if the entered version is "higher" than the previous one
        // and we cannot check which part got edited
        // we can only check if the entered version is empty
        if(!enteredVersion) {
          this.showWarningToast("You need to enter a version tag!");
          return;
        }
      }
    }

    this.postCommit();
  }

  /**
   * This method should be called to create a new commit.
   * We decide two cases:
   * 1. No dialog to verify that the version update is justified is shown:
   *    -> Then this method gets called in _onCommitClicked.
   * 2. The dialog to verify that the version update is justified is shown:
   *    -> Then this method gets called by the click listener of the dialogs "Commit" button.
   */
  postCommit() {
    // get commit message
    const commitMessage = this.getCommitMessageInput().value;

    const body = {
      message: commitMessage
    };

    body.model = this.updatedModel;
    body.testModel = this.updatedTestModel;

    if(this.getNewVersionCheckBox().checked) {
      body.versionTag = this.getEnteredVersion(); // automatically returns the correct version depending on whether sem-ver is used or not
    }

    let metadataDocString = "";
    // depending on the type of component which is currently opened, we need to send different extra information
    // as the wireframe for frontend components and metadata information for microservices
    if(this.isFrontendComponent()) {
      // add wireframe to model
      body.model.wireframe = this.currentWireframe;

      // restrict the wireframe to the nodes that are selected in the commit
      const success = ModelDifferencing.restrictWireframeToModel(body.model);
      if(!success) {
        this.showWarningToast("Wireframe is not valid when applying the selected changes!");
        return;
      }
    } else if(this.isMicroserviceComponent()) {
      // add metadataDocString to the model
      metadataDocString = this.y.share.data.get('metadataDocString');
      if (!metadataDocString)
        metadataDocString = "";

      body.model["metadataDoc"] = metadataDocString;
      // besides this, there is another request to /CAE/docs (see below commit request at the end of this method)
    }

    // add type of component, because the Model Persistence Service then adds it as an attribute to the model
    // and the Code Generation Service can use it
    body.componentType = Common.getComponentTypeByVersionedModelId(this.versionedModel.id);

    // also add component name, which also gets added as an attribute to the model by the Model Persistence Service
    body.componentName = Common.getComponentNameByVersionedModelId(this.versionedModel.id);

    // also put name of the project into the request (this is required to check if user is allowed to write to project)
    body.projectName = Common.getProjectNameByVersionedModelId(this.versionedModel.id);

    // disable button so that it is not possible to click the button twice (or more often)
    this.getCommitButton().disabled = true;

    // show dialog
    this.openLoadingDialog();

    let version = "0.0.0";
    if(this.latestVersionTag != undefined) {
      if(!this.differentVersionFormat) {
        version = SemVer.objectToString(this.latestVersionTag);
      } else {
        version = this.latestVersionTag;
      }
    }
    const newVersion = this.getNewVersionCheckBox().checked;
    if(newVersion) version = this.getEnteredVersion();
    body.metadataVersion = version;

    const metadataDocPromise = new Promise(function(resolve, reject) { 
      if(this.isMicroserviceComponent()) {
        metadataDocString.info.version = version;
        fetch(Static.ModelPersistenceServiceURL + "/docs/" + this.versionedModel.id + "/" + version, {
          method: "POST",
          headers: Auth.getAuthHeader(), // send headers at least for content type
          body: JSON.stringify(metadataDocString)
        }).then(_ => resolve());
      } else {
        resolve();
      }
    }.bind(this));

    metadataDocPromise.then(_ => {

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

      // uncheck "select all" checkbox
      this.getCheckboxSelectAllElement().checked = false;

      if(response.ok) {
        // since the selected differences got commited, they can be removed from this.differencesUncommitedChanges
        const diffUncommitedChangesToDelete = [];
        for(const diff of this.differencesUncommitedChanges) {
          const matches = this.selectedDifferences.filter(d => ModelDifference.equals(diff, d));
          if(matches.length > 0) {
            diffUncommitedChangesToDelete.push(diff);
          }
        }
        this.differencesUncommitedChanges = this.differencesUncommitedChanges.filter(diff => !diffUncommitedChangesToDelete.includes(diff));

        // every selected difference was commited, thus now there should not be any selected difference
        this.selectedDifferences = [];

        // since the user commited, we have the "uncommited changes" commit as the selected commit
        // thus, after the commit, the changes list needs to be updated
        this.setDifferencesToDifferencesUncommitedChanges();
        this.updateChangesListElement();

        // reload commit list
        this.sendReloadCommitListEvent();

        // notify everyone in the Yjs room about the new commit
        // this allows to reload the versioning widget for the other users
        this.y.share.versioning_widget.set("COMMIT_CREATED", true);

        window.dispatchEvent(new Event("committed-changes", { detail: {} }));
      } else {
        console.log(response.status);
        if(response.status == "403") {
          this.showToast("You are not allowed to commit to this component!");
        } else if(response.status == "500") {
          response.text().then(error => {
            if(error.startsWith("Model not valid")) {
              const errorMessage = error.split("Model not valid: ")[1];
              this.showWarningToast(errorMessage);
            }
          });
        }
      }
    });
  });
  }

  /**
   * Gets called by versioning-element after the versioned model got loaded from API.
   * @param versionedModel
   * @param committingDisabled
   */
  setVersionedModel(versionedModel, committingDisabled) {
    this.versionedModel = versionedModel;
    this.committingDisabled = committingDisabled;

    if(this.committingDisabled) {
      // if user should not be able to commit, then the commit UI can be hidden
      this.hideUIForCommiting();
    }

    console.log("Commit-Details: Received versioned model from versioning-element.");

    this.commits = versionedModel.commits;
    parent.commits = this.commits;
    // set uncommited changes commit as the selected one
    this.selectedCommit = this.commits[0];

    this.selectedDifferences = [];

    if(this.mainY) {
      this.reloadUncommitedChanges(this.mainY);
    }

    // check if a previous commit has a version tag which does not match the semantic versioning format
    if(!SemVer.allSemanticVersionTags(this.commits)) {
      // at least one of the previous version tags does not match the sem-ver format
      // thus, we disable the semantic versioning format input
      this.differentVersionFormat = true;
    }

    // check if there exists a commit with a version tag
    // if there exists one, then get the currently latest version tag
    this.latestVersionTag = undefined;
    for(const commit of this.commits) {
      const versionTag = commit.versionTag;
      if(versionTag) {
        // commit is tagged with a version
        // check if it matches the Semantic Version format (then convert to object)
        if(SemVer.isSemanticVersionNumber(versionTag)) {
          this.latestVersionTag = SemVer.extractSemanticVersionParts(versionTag);
          break;
        } else {
          this.latestVersionTag = versionTag;
          break;
        }
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
          room: Common.getYjsRoomNameForVersionedModel(versionedModel.id, Common.isCurrentComponentDependency()),
          options: { resource: Static.YjsResourcePath},
          url: Static.YjsAddress
        },
        share: { // specify the shared content
          data: 'Map',
          canvas: 'Map',
          versioning_widget: 'Map'
        }
      }).then(function(y) {
        this.y = y;
        this.mainY = y;
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
              // model might have changed

              this.reloadUncommitedChanges(y);

              // maybe the wireframe changed too (does not matter if one exists or not)
              this.currentWireframe = y.share.data.get("wireframe");
            });

            y.share.versioning_widget.observe(event => {
              if(event.name == "COMMIT_CREATED") {
                // a user (the local one or a remote user) has created a new commit
                // thus, the commit list needs to be reloaded
                // when this event gets fired, also the commit details get reloaded.
                this.dispatchEvent(new CustomEvent("reload-commit-list"));
                // also reload the live code editor
                this.dispatchEvent(new CustomEvent("reload-code-editor"));
              }
            });

            y.share.canvas.observe(event => {
              if(event.name == "ReloadWidgetOperation") {
                this.dispatchEvent(new CustomEvent("reload-wireframe"));
              }
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

  reloadUncommitedChanges(y) {
    // update this.differencesUncommitedChanges
    this.updateDifferencesUncommitedChanges(y.share.data.get("model"));

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
  }

  /**
   * Updates the variable this.differencesUncommitedChanges by calculating the differences
   * that were done since the last commit.
   * @param currentModelFromYjsRoom Current state of the model given from Yjs room.
   */
  updateDifferencesUncommitedChanges(currentModelFromYjsRoom) {
    if(!currentModelFromYjsRoom) {
      console.error("Called updateDifferencesUncommitedChanges with empty model.");
      return;
    }
    // get last real commit (do not take "uncommited changes" commit)
    // lastCommit might be undefined
    let lastCommit = this.getLastCommit(this.commits);


    // get differences between last commit and current model state
    if(lastCommit == undefined) {
      // there does not exist a commit, so calculated everything that the current model consists of
      this.differencesUncommitedChanges = ModelDifferencing.getDifferencesOfSingleModel(currentModelFromYjsRoom);

      // check if a test model exists
      if(this.currentTestModel) {
        // test model exists => get all the changes that have been applied yet
        const differences = TestModelDifferencing.getDifferencesOfSingleModel(this.currentTestModel.testCases);
        this.differencesUncommitedChanges = this.differencesUncommitedChanges.concat(differences);
      }
    } else {
      // there exists a last commit, so we can calculate the differences between the last commit and the current model state
      this.differencesUncommitedChanges = ModelDifferencing.getDifferences(lastCommit.model, currentModelFromYjsRoom);

      // also get differences for test model (if exists)
      if(this.currentTestModel) {
        const differences = TestModelDifferencing.getDifferences(lastCommit.testModel.testCases, this.currentTestModel.testCases);
        this.differencesUncommitedChanges = this.differencesUncommitedChanges.concat(differences);
      }
    }
  }

  getLastCommit(commits) {
    let lastCommit = undefined;
    if(commits.length > 1) {
      for (let i = 1; i < commits.length; i++) {
        if(commits[i].commitType == 0) {
          lastCommit = commits[i];
          break;
        }
      }
    }
    return lastCommit;
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

    if(commit.commitType == 1) {
      // this is an "auto-commit" and not a "manual-commit"
      this.hideUIForCommiting();

      const changesListElement = this.getChangesListElement();

      // clear all elements
      while (changesListElement.firstChild) changesListElement.removeChild(changesListElement.firstChild);

      const commitDetailsCodeCommit = document.createElement("p");
      commitDetailsCodeCommit.innerHTML = "This commit belongs to code changes made with the " +
        "Live Code Editor. View them on <a href='" + CommitList.getCommitGitHubURL(commit) +
        "' style='text-decoration: none' target='_blank'>GitHub</a>.";

      commitDetailsCodeCommit.style = "margin-left: 0.5em; margin-right: 0.5em";
      changesListElement.appendChild(commitDetailsCodeCommit);

      // when the commit is a commit made by the live code editor, then
      // we do not need to calculate model difference etc.
      return;
    }

    // reset checkbox to select all changes
    this.getCheckboxSelectAllElement().checked = false;
    // reset selected differences
    this.selectedDifferences = [];

    // Yjs room might have changed when the selected commit got changed
    // then the highlighting feature might not work anymore
    // => update it's Yjs instance
    Y({
      db: {
        name: "memory" // store the shared data in memory
      },
      connector: {
        name: "websockets-client", // use the websockets connector
        room: parent.caeRoom,
        options: { resource: Static.YjsResourcePath},
        url: Static.YjsAddress
      },
      share: { // specify the shared content
        data: 'Map',
        canvas: 'Map',
        versioning_widget: 'Map'
      }
    }).then(function(y) {
      this.y = y;

      // now since Yjs instance is updated, reload commit changes

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

          // check if this is a microservice component
          if(Common.getComponentTypeByVersionedModelId(this.versionedModel.id) == "microservice") {
            this.differences = this.differences.concat(TestModelDifferencing.getDifferences(commitBefore.testModel.testCases, commit.testModel.testCases));
          }

          this.updateChangesListElement();
        } else {
          // previous commit does not exist
          this.differences = ModelDifferencing.getDifferencesOfSingleModel(commit.model);

          // check if this is a microservice component
          if(Common.getComponentTypeByVersionedModelId(this.versionedModel.id) == "microservice") {
            this.differences = this.differences.concat(TestModelDifferencing.getDifferencesOfSingleModel(commit.testModel.testCases));
          }

          this.updateChangesListElement();
        }
      }
    }.bind(this));
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
        if(c.commitType == 0) {
          commitToReturn = c;
          break;
        }
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

    // for all selected differences, check if they are still element of this.differences
    const selectedDifferencesUpdated = [];
    for(const selectedDiff of this.selectedDifferences) {
      const matches = this.differences.filter(diff => ModelDifference.equals(selectedDiff, diff));
      if(matches.length > 0) {
        // use the one from matches array i.e. the one from this.differences and NOT the one from
        // this.selectedDifferences, because the one from this.differences is updated (got changes from canvas)
        // and this.selectedDifferences not
        selectedDifferencesUpdated.push(matches[0]);
      }
    }
    this.selectedDifferences = selectedDifferencesUpdated;

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
          this.selectedDifferences = this.selectedDifferences.filter(diff => !ModelDifference.equals(diff, difference));
          // since at least one checkbox is not checked, the checkbox to select all changes should also not be checked
          this.getCheckboxSelectAllElement().checked = false;
        }
      }.bind(this);
      const checkboxListener = this.selectedCommit.message == null ? listener : undefined;

      const diffHTMLElement = difference.toHTMLElement(checkboxListener, this.y);

      if(ModelDifference.equals(difference, this.selectedDifference)) {
        diffHTMLElement.style.background = "#eeeeee";
      }

      for(const selectedDiff of this.selectedDifferences) {
        if(ModelDifference.equals(selectedDiff, difference)) {
          diffHTMLElement.getElementsByTagName("paper-checkbox")[0].checked = true;
        }
      }

      diffHTMLElement.addEventListener("mouseover", function() {
        diffHTMLElement.style.background = "#eeeeee";
      });
      diffHTMLElement.addEventListener("mouseleave", function() {
        if(!ModelDifference.equals(this.selectedDifference, difference)) {
          diffHTMLElement.style.removeProperty("background");
        }
      }.bind(this));
      diffHTMLElement.addEventListener("click", function(event) {
        if(this.selectedDifference) {
          // currently, there's another element selected
          // remove background color from that (just remove it from all)
          for(const child of changesListElement.childNodes) {
            child.style.removeProperty("background");
          }
        }
        diffHTMLElement.style.background = "#eeeeee";

        // set this list element as the selected one
        this.selectedDifference = difference;

        // highlight node/edge in canvas
        difference.highlight(this.y);
      }.bind(this));
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

  /**
   * Shows the confirmation dialog for undoing all the changes since the last commit.
   * @private
   */
  _onUndoChangesClicked() {
    this.shadowRoot.getElementById("dialog-undo-confirmation").open();
  }

  /**
   * Gets called when the user confirmed, that every change since the last commit should be undone
   * @private
   */
  _onConfirmUndoChangesClicked() {
    const previousModel = this.versionedModel.commits[0].model;
    this.mainY.share.data.set("model", previousModel);
    this.mainY.share.data.set("wireframe", previousModel.wireframe);

    this.mainY.share.canvas.set('ReloadWidgetOperation', 'import');
    // Wireframe widget gets reloaded by observer waiting for ReloadWidgetOperation
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

      // check if one of the previous commits does not match the sem-ver format
      if(!SemVer.allSemanticVersionTags(this.commits)) {
        // hide input for sem-ver format version number
        this.shadowRoot.getElementById("semver-number-div").style.setProperty("display", "none");
        // hide "a" element for show/hide other format version input field
        this.shadowRoot.getElementById("a-different-version-format").style.setProperty("display", "none");
        // show input field for version tag with different format
        this.shadowRoot.getElementById("input-different-version-format").removeAttribute("hidden");
      } else {
        // reset version number
        this.setInitVersionNumber();
      }
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

    this.shadowRoot.getElementById("input-different-version-format").value = "";
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

      // set these values as the minimum for the input fields
      // and set the max, so that every number can be increase by 1 only
      this.getVersionNumberInput(1).min = initMajor;
      this.getVersionNumberInput(1).max = parseInt(initMajor) + 1;
      this.getVersionNumberInput(2).min = initMinor;
      this.getVersionNumberInput(2).max = parseInt(initMinor) + 1;
      this.getVersionNumberInput(3).min = initPatch;
      this.getVersionNumberInput(3).max = parseInt(initPatch) + 1;
    } else {
      // no commit before got tagged with a version
      // the inital version tag should always be 0.1.0
      this.getVersionNumberInput(1).min = 0;
      this.getVersionNumberInput(1).max = 0;
      this.getVersionNumberInput(2).min = 1;
      this.getVersionNumberInput(2).max = 1;
      this.getVersionNumberInput(3).min = 0;
      this.getVersionNumberInput(3).max = 0;
    }
    // put initial number into input fields
    this.setEnteredVersion(initMajor,initMinor,initPatch);
  }

  _onVersionInputChanged(event, field) {
    console.log("version tag: input field " + field + " changed");
    const inputElement = this.getVersionNumberInput(field);
    // Example: latestVersionTag is 0.1.2, then the minimum values for the input fields are 0, 1 and 2.
    // If the user changes the version tag to 0.2.2, then the minimum value of the patch part could also
    // be 0, because 0.2.0 > 0.1.2. Thus the minimum of the second input field needs to be updated from 2 to 0.
    const currentVersionTag = SemVer.extractSemanticVersionParts(this.getEnteredVersion());

    if(!this.latestVersionTag) this.latestVersionTag = SemVer.getObject(0, 1, 0);

    if(field == 1) {
      if (currentVersionTag.major > this.latestVersionTag.major) {
        // major part got increased, set others to 0
        this.setEnteredVersion(currentVersionTag.major, 0, 0);
        // update min/max values
        this.getVersionNumberInput(2).min = 0;
        this.getVersionNumberInput(2).max = 0;
        this.getVersionNumberInput(3).min = 0;
        this.getVersionNumberInput(3).max = 0;
      } else {
        // major part is equals to the major part of the latestVersionTag again
        this.setEnteredVersion(this.latestVersionTag.major, this.latestVersionTag.minor, this.latestVersionTag.patch);
        this.getVersionNumberInput(1).min = this.latestVersionTag.major;
        this.getVersionNumberInput(1).max = parseInt(this.latestVersionTag.major) + 1;
        this.getVersionNumberInput(2).min = this.latestVersionTag.minor;
        this.getVersionNumberInput(2).max = parseInt(this.latestVersionTag.minor) + 1;
        this.getVersionNumberInput(3).min = this.latestVersionTag.patch;
        this.getVersionNumberInput(3).max = parseInt(this.latestVersionTag.patch) + 1;
      }
    } else if(field == 2) {
      if(currentVersionTag.minor > this.latestVersionTag.minor) {
        // minor got increased
        this.setEnteredVersion(currentVersionTag.major, currentVersionTag.minor, 0);
        this.getVersionNumberInput(1).min = this.latestVersionTag.major;
        this.getVersionNumberInput(1).max = parseInt(this.latestVersionTag.major) + 1;
        this.getVersionNumberInput(3).min = 0;
        this.getVersionNumberInput(3).max = 0;
      } else {
        // minor part is equals to the minor part of the latestVersionTag again
        this.setEnteredVersion(this.latestVersionTag.major, this.latestVersionTag.minor, this.latestVersionTag.patch);
        this.getVersionNumberInput(1).min = this.latestVersionTag.major;
        this.getVersionNumberInput(1).max = parseInt(this.latestVersionTag.major) + 1;
        this.getVersionNumberInput(2).min = this.latestVersionTag.minor;
        this.getVersionNumberInput(2).max = parseInt(this.latestVersionTag.minor) + 1;
        this.getVersionNumberInput(3).min = this.latestVersionTag.patch;
        this.getVersionNumberInput(3).max = parseInt(this.latestVersionTag.patch) + 1;
      }
    }
  }

  /**
   * Creates a semantic version number from the three input fields.
   * If user selected to enter a different version format, then just the input of the
   * corresponding input field gets returned.
   * @returns {string}
   */
  getEnteredVersion() {
    if(!this.differentVersionFormat) {
      const major = this.getVersionNumberInput(1).value;
      const minor = this.getVersionNumberInput(2).value;
      const patch = this.getVersionNumberInput(3).value;
      return major + "." + minor + "." + patch;
    } else {
      return this.shadowRoot.getElementById("input-different-version-format").value;
    }
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

  /*
   * Opens the dialog which should verify that the change of version is justified.
   */
  openSemVerVerifyDialog(versionPart, previousVersionNumber, newVersionNumber) {
    this.shadowRoot.getElementById("dialog-semver-verify").open();
    this.shadowRoot.getElementById("dialog-semver-verify-part").innerText = versionPart;
    this.shadowRoot.getElementById("dialog-semver-prev-number").innerText = previousVersionNumber;
    this.shadowRoot.getElementById("dialog-semver-new-number").innerText = newVersionNumber;
    let checkBoxText;
    if(versionPart == "MAJOR") {
      checkBoxText = "This update contains incompatible API changes.";
    } else if(versionPart == "MINOR") {
      checkBoxText = "This update only adds functionality which is backwards compatible.";
    } else if(versionPart == "PATCH") {
      checkBoxText = "This update only contains backwards compatible bug fixes.";
    }
    this.shadowRoot.getElementById("dialog-semver-checkbox").innerText = checkBoxText;
    this.shadowRoot.getElementById("dialog-semver-checkbox").checked = false;
    this.shadowRoot.getElementById("dialog-semver-btn-commit").disabled = true;
  }

  dontShowSemVerVerifyDialogAgain() {
    Common.disableSemVerVerifyDialog();
    this.shadowRoot.getElementById("dialog-semver-verify").close();
  }

  /**
   * Gets called when the checkbox in the semver verify dialog gets changed.
   */
  dialogSemVerCheckBoxChanged() {
    if(this.shadowRoot.getElementById("dialog-semver-checkbox").checked) {
      // enable commit button
      this.shadowRoot.getElementById("dialog-semver-btn-commit").disabled = false;
    } else {
      this.shadowRoot.getElementById("dialog-semver-btn-commit").disabled = true;
    }
  }

  _onDifferentFormatClicked() {
    const differentFormatInputElement = this.shadowRoot.getElementById("input-different-version-format");
    const differentFormatText = this.shadowRoot.getElementById("a-different-version-format");

    if(this.differentVersionFormat) {
      differentFormatInputElement.setAttribute("hidden", "true");
      differentFormatText.innerText = "Different format";
    } else {
      differentFormatInputElement.removeAttribute("hidden");
      differentFormatText.innerText = "Use Semantic Versioning";
    }

    this.differentVersionFormat = !this.differentVersionFormat;
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

  /**
   * Whether this versioning element is used in the modeling space of a frontend component.
   * @returns {boolean} Whether this versioning element is used in the modeling space of a frontend component.
   */
  isFrontendComponent() {
    return Common.getComponentTypeByVersionedModelId(Common.getVersionedModelId()) == "frontend";
  }

  /**
   * Whether this versioning element is used in the modeling space of a microservice.
   * @returns {boolean} Whether this versioning element is used in the modeling space of a microservice.
   */
  isMicroserviceComponent() {
    return Common.getComponentTypeByVersionedModelId(Common.getVersionedModelId()) == "microservice";
  }
}

customElements.define('commit-details', CommitDetails);
