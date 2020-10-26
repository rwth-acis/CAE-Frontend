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
          margin-right: 4px;
        }
        .label-auto-commit {
          color: #1E90FF;
          border: 1px solid #1E90FF;
        }
        .label-manual-commit {
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
      <h3 style="margin-left: 4px">Commit List</h3>
      <div class="separator"></div>
      <div style="overflow: scroll; height: 500px">
        <div id="spinner-commit-list" style="display: flex; width: 100%">
          <paper-spinner-lite style="margin-top: 2em; margin-left: auto; margin-right: auto" active></paper-spinner-lite>
        </div>
        <!-- list commits (commit html elements are added by js) -->
        <div id="commit-list">
        
        </div>
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
      },
      commitSegments: {
        type: Array
      }
    };
  }

  constructor() {
    super();

    // default: committing should be enabled
    this.committingDisabled = false;

    this.commitSegments = [];
  }

  /**
   * Gets called when the user left-clicks on a commit in the commit list.
   * @param commit The commit that was left-clicked.
   * @private
   */
  _onCommitLeftClicked(commit) {
    // only do something, if the commit that got selected was not selected before
    if(commit.id == this.selectedCommitId) return;

    if(this.selectedCommitId) this.shadowRoot.getElementById(this.selectedCommitId).setAttribute("class", "commit");
    this.selectedCommitId = commit.id;
    this.shadowRoot.getElementById(commit.id).setAttribute("class", "commit-selected");

    // check if the commit is the one for "uncommited changes"
    if(commit.message == null) {
      // show the main modeling in the main Yjs room again
      parent.caeRoom = Common.getYjsRoomNameForVersionedModel(this.versionedModel.id, Common.isCurrentComponentDependency());
      this.dispatchEvent(new CustomEvent("show-main-canvas"));
    } else {
      // we want to show the model at a previous stage/commit
      // check if it is a "manual commit" or an "auto commit"
      // because "auto commits" do not contain a model (then we need to get a previous one)
      let model;
      if(commit.commitType == 0) {
        // commit is a "manual commit"
        // thus the commit itself contains a model we can display
        model = commit.model;
      } else if(commit.commitType == 1) {
        // commit is an "auto commit"
        // thus the commit itself does not contain a model, so we need to get the previous model
        let reachedCommit = false;
        for(const c of this.versionedModel.commits) {
          if(!reachedCommit) {
            if(c.id == commit.id) reachedCommit = true;
          } else {
            if(c.commitType == 0) {
              // this is a previous commit which is a manual commit
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

    // this.versionedModel.commits is now a list of commits
    // as an example this could look like:
    // 0: Manual commit
    // 1: Auto commit
    // 2: Auto commit
    // 3: Auto commit
    // 4: Manual commit
    //
    // We want to summarize multiple auto commits to one segment, so that the
    // list looks like:
    // 0: Manual commit
    // 1: Auto commits made by Live Code Editor -> contains the auto commits as an array
    // 2: Manual commit
    this.commitSegments = [];
    let previousWasAutoCommit = false;
    for(const commit of this.versionedModel.commits) {
      if(commit.commitType == 0) {
        // manual commit
        this.commitSegments.push(commit);
        previousWasAutoCommit = false;
      } else if(commit.commitType == 1) {
        // auto commit
        if(previousWasAutoCommit) {
          // the last element of commitSegments is an array containing auto commits
          // we want to add the commit to this array
          this.commitSegments[this.commitSegments.length-1].push(commit);
        } else {
          this.commitSegments.push([commit]);
        }
        previousWasAutoCommit = true;
      }
    }

    const list = this.shadowRoot.getElementById("commit-list");
    while(list.firstChild) list.removeChild(list.firstChild);

    for(const segment of this.commitSegments) {
      const html = this.getCommitSegmentHTML(segment);
      if(html) list.appendChild(html);
    }

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
    const month = date.getMonth()+1 < 10 ? "0" + (date.getMonth()+1) : (date.getMonth()+1);
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

  /**
   * Returns the HTML element for a segment of auto commits.
   * @param commitSegment
   * @returns {HTMLDivElement} HTML element for a segment of auto commits.
   */
  getCommitSegmentHTML(commitSegment) {
    if(Array.isArray(commitSegment)) {
      // segment contains (possibly multiple) auto commits
      const div = document.createElement("div");

      const topDiv = document.createElement("div");
      const divCommits = document.createElement("div");

      topDiv.setAttribute("class", "commit");
      topDiv.style.setProperty("display", "flex");

      const p = document.createElement("p");
      p.style.setProperty("width", "100%");
      p.style.setProperty("margin-left", "4px");
      p.style.setProperty("margin-right", "0");
      p.style.setProperty("margin-top", "6px");
      p.style.setProperty("margin-bottom", "6px");

      const span = document.createElement("span");
      span.setAttribute("class", "label-commit-type label-auto-commit");
      span.innerText = "Auto";
      p.appendChild(span);
      p.innerHTML += "Live Code Editor change(s)";

      topDiv.appendChild(p);

      const iconExpandCollapse = document.createElement("iron-icon");
      iconExpandCollapse.setAttribute("icon", "icons:expand-more");
      iconExpandCollapse.style.setProperty("margin-left", "auto");
      iconExpandCollapse.style.setProperty("margin-right", "0.5em");
      iconExpandCollapse.style.setProperty("margin-top", "auto");
      iconExpandCollapse.style.setProperty("margin-bottom", "auto");
      topDiv.appendChild(iconExpandCollapse);

      topDiv.addEventListener("click", _ => {
        if(iconExpandCollapse.getAttribute("icon") == "icons:expand-more") {
          iconExpandCollapse.setAttribute("icon", "icons:expand-less");
          divCommits.style.removeProperty("display");
        } else {
          iconExpandCollapse.setAttribute("icon", "icons:expand-more");
          divCommits.style.setProperty("display", "none");
        }
      });

      div.appendChild(topDiv);
      div.appendChild(this.getSeparatorHTML());

      // hide commits of a segment initially
      divCommits.style.setProperty("display", "none");
      for(const commit of commitSegment) {
        divCommits.appendChild(this.getStandardCommitHTML(commit, false));

        const divSeparator = document.createElement("div");
        divSeparator.setAttribute("class", "separator");
        divCommits.appendChild(divSeparator);
      }
      div.appendChild(divCommits);
      return div;
    } else {
      // commit is manual commit
      // check if commit is the commit for uncommited changes
      const commit = commitSegment;
      if(commit.message) {
        // standard commit
        const div = document.createElement("div");
        div.appendChild(this.getStandardCommitHTML(commit, true));
        div.appendChild(this.getSeparatorHTML());
        return div;
      } else {
        // commit for uncommited changes
        // only display if committing is not disabled
        if(!this.committingDisabled) {
          const div = document.createElement("div");
          div.appendChild(this.getUncommitedChangesCommitHTML(commit));
          div.appendChild(this.getSeparatorHTML());
          return div;
        }
      }
    }
  }

  /**
   * Returns the HTML element for a standard commit.
   * @param commit Commit data
   * @param showCommitTypeLabel Whether the label "Auto" or "Manual" should be shown.
   * @returns {HTMLDivElement} HTML element for a standard commit.
   */
  getStandardCommitHTML(commit, showCommitTypeLabel) {
    const outerDiv = document.createElement("div");
    outerDiv.setAttribute("id", commit.id);
    outerDiv.setAttribute("class", "commit");
    outerDiv.style.setProperty("padding-bottom", "1em");
    outerDiv.addEventListener("click", () => this._onCommitLeftClicked(commit));

    const innerDiv = document.createElement("div");
    innerDiv.style.setProperty("display", "flex");
    innerDiv.style.setProperty("padding-top", "0.5em");

    const p = document.createElement("p");
    p.style.setProperty("width", "100%");
    p.style.setProperty("margin-left", "4px");
    p.style.setProperty("margin-right", "0");
    p.style.setProperty("margin-top", "auto");
    p.style.setProperty("margin-bottom", "auto");

    if(showCommitTypeLabel) {
      const span = document.createElement("span");
      span.setAttribute("class",
        "label-commit-type " + (commit.commitType == 0 ? "label-manual-commit" : "label-auto-commit"));
      span.innerText = commit.commitType == 0 ? "Manual" : "Auto";
      p.appendChild(span);
    }
    p.innerHTML += commit.message;

    innerDiv.appendChild(p);

    if(!this.isApplication()) {
      const a = document.createElement("a");
      a.setAttribute("title", "View commit on GitHub");
      a.style.setProperty("text-decoration", "none");
      a.style.setProperty("margin-left", "0.5em");
      a.style.setProperty("margin-right", "0.5em");
      a.style.setProperty("margin-top", "auto");
      a.style.setProperty("margin-bottom", "auto");
      a.setAttribute("href", CommitList.getCommitGitHubURL(commit));
      a.setAttribute("target", "_blank");

      const img = document.createElement("img");
      img.style.setProperty("width", "1.5em");
      img.style.setProperty("height", "1.5em");
      img.setAttribute("src", "https://raw.githubusercontent.com/primer/octicons/e9a9a84fb796d70c0803ab8d62eda5c03415e015/icons/mark-github-16.svg");
      img.setAttribute("class", "github-img");
      a.appendChild(img);

      innerDiv.appendChild(a);
    }

    outerDiv.appendChild(innerDiv);

    if(commit.versionTag) {
      const divTag = document.createElement("div");
      divTag.style.setProperty("margin-top", "8px");
      divTag.style.setProperty("margin-bottom", "4px");
      divTag.style.setProperty("margin-left",  "4px");

      const spanTag = document.createElement("span");
      spanTag.setAttribute("class", "label");
      spanTag.innerText = commit.versionTag;
      divTag.appendChild(spanTag);

      outerDiv.appendChild(divTag);
    }

    const pTimestamp = document.createElement("p");
    pTimestamp.style.setProperty("color", "#aeaeae");
    pTimestamp.style.setProperty("margin-top", "4px");
    pTimestamp.style.setProperty("margin-bottom", "0");
    pTimestamp.style.setProperty("margin-left", "4px");
    pTimestamp.innerText = this.beautifyTimestamp(commit.timestamp);
    outerDiv.appendChild(pTimestamp);

    return outerDiv;
  }

  /**
   * Returns the HTML Element used for displaying the "uncommited changes" commit.
   * in the commit list.
   * @param commit Required for the click event of the commit.
   * @returns {HTMLDivElement} HTML Element used for displaying the "uncommited changes" commit.
   */
  getUncommitedChangesCommitHTML(commit) {
    const outerDiv = document.createElement("div");
    outerDiv.setAttribute("id", commit.id);
    outerDiv.setAttribute("class", "commit");
    outerDiv.style.setProperty("padding-bottom", "1em");

    const innerDiv = document.createElement("div");
    innerDiv.style.setProperty("display", "flex");
    innerDiv.addEventListener("click", () => this._onCommitLeftClicked(commit));

    const p = document.createElement("p");
    p.style.setProperty("margin-left", "4px");
    p.innerText = "Uncommited changes";

    innerDiv.appendChild(p);
    outerDiv.appendChild(innerDiv);
    return outerDiv;
  }

  /**
   * Returns the HTML element used as a separator.
   * @returns {HTMLDivElement} HTML element used as a separator.
   */
  getSeparatorHTML() {
    const divSeparator = document.createElement("div");
    divSeparator.setAttribute("class", "separator");
    return divSeparator;
  }
}

customElements.define('commit-list', CommitList);
