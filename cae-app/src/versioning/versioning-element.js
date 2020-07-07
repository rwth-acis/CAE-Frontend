import { LitElement, html} from 'lit-element';
import './commit-list.js';
import './commit-details.js';
import Common from "../util/common";
import Static from "../static";

export class VersioningElement extends LitElement {
  render() {
    return html`
      <style>
        :host {
          font-family: Roboto;
        }
      </style>
      
      <custom-style>
        <style is="custom-style">
          .flex-horizontal-with-ratios {
            @apply --layout-horizontal;
          }
          .flex-commit-details {
            @apply --layout-flex;
          }
          .flex-commit-list {
            @apply --layout-flex;
          }
        </style>
      </custom-style>
      
      <div class="container flex-horizontal-with-ratios">
        <div class="flex-commit-list">
          <commit-list id="commit-list" @show-commit-canvas=${(e) => this.dispatchEvent(new CustomEvent("show-commit-canvas"))} 
              @show-main-canvas=${(e) => this.dispatchEvent(new CustomEvent("show-main-canvas"))}
              @commit-selected=${(e) => this._onCommitSelected(e.detail.commit)}></commit-list>
        </div>
        <div class="flex-commit-details">
          <commit-details id="commit-details" @reload-commit-list=${this.reloadCommitList}></commit-details>
        </div>
      </div>
    `;
  }

  static get properties() {
    return {
      versionedModel: {
        type: Object
      },
      versionedModelId: {
        type: Number
      }
    };
  }

  constructor() {
    super();

    // load versioned model id from localStorage
    this.versionedModelId = Common.getVersionedModelId();

    // now load versioned model from API
    this.loadVersionedModel();
  }

  /**
   * Loads the versioned model from API and sends it to the commit-list.
   */
  loadVersionedModel() {
    fetch(Static.ModelPersistenceServiceURL + "/versionedModels/" + this.versionedModelId, {
      method: "GET"
    }).then(response => {
      if(response.ok) {
        return response.json();
      }
    }).then(data => {
      // data contains the versioned model
      this.versionedModel = data;
      this.getCommitListElement().setVersionedModel(data);
      this.getCommitDetailsElement().setVersionedModel(data);

      // also notify parent elements (e.g. application-modeling needs to know whether commits exist or not)
      this.dispatchEvent(new CustomEvent("versioned-model-loaded", {
        detail: {
          versionedModel: this.versionedModel
        }
      }));
    });
  }

  /**
   * Gets called by the commit-list when the selected commit got changed.
   * @param commit Commit that got selected.
   * @private
   */
  _onCommitSelected(commit) {
    console.log("Selected commit", commit);

    // notify commit-details about the selected commit
    this.getCommitDetailsElement()._onCommitSelected(commit);
  }

  /**
   * Gets called after creating a new commit to reload the commit list.
   */
  reloadCommitList() {
    this.loadVersionedModel();

    // show loading spinner
    this.getCommitListElement().getSpinner().style.display = "flex";
  }

  /**
   * Returns the HTMLElement of the commit list.
   * @returns {HTMLElement} HTMLElement of commit list.
   */
  getCommitListElement() {
    return this.shadowRoot.getElementById("commit-list");
  }

  /**
   * Returns the HTMLElement of the commit details.
   * @returns {HTMLElement} HTMLElement of commit details.
   */
  getCommitDetailsElement() {
    return this.shadowRoot.getElementById("commit-details");
  }
}

customElements.define('versioning-element', VersioningElement);
