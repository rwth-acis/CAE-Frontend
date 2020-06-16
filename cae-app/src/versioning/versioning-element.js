import { LitElement, html} from 'lit-element';
import './commit-list.js';
import './commit-details.js';
import Common from "../common";
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
          <commit-list id="commit-list"></commit-list>
        </div>
        <div class="flex-commit-details">
          <commit-details @reload-commit-list=${this.reloadCommitList}></commit-details>
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
    });
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
}

customElements.define('versioning-element', VersioningElement);
