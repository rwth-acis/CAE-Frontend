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
          <commit-details></commit-details>
        </div>
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

  constructor() {
    super();

    // load versioned model id from localStorage
    const versionedModelId = Common.getVersionedModelId();

    // now load versioned model from API
    this.loadVersionedModel(versionedModelId);

    // TODO: this is only some testing data
    /*this.versionedModel = {
      "id": 1,
      "commits": [
        {
          // this is the commit containing uncommited changes
          "id": 11
        },
        {
          "id": 10,
          "message": "Another test commit without tag but with a longer text message.",
          "timestamp": "07.06.2020 18:20"
        },
        {
          "id": 9,
          "message": "Another test commit without tag but with a longer text message.",
          "timestamp": "07.06.2020 18:15"
        },
        {
          "id": 8,
          "message": "Another test commit without tag but with a longer text message.",
          "timestamp": "07.06.2020 14:46"
        },
        {
          "id": 7,
          "message": "Another test commit without tag but with a longer text message.",
          "timestamp": "06.06.2020 09:34"
        },
        {
          "id": 6,
          "message": "Again a commit with a version tag attached. This one has a longer text message.",
          "tag": {
            "id": 2,
            "tag": "0.1.0"
          },
          "timestamp": "05.06.2020 16:20"
        },
        {
          "id": 5,
          "message": "Another test commit without tag but with a longer text message.",
          "timestamp": "05.06.2020 13:17"
        },
        {
          "id": 4,
          "message": "Another test commit without tag but with a longer text message.",
          "timestamp": "04.06.2020 22:24"
        },
        {
          "id": 3,
          "message": "Another test commit without tag but with a longer text message.",
          "timestamp": "04.06.2020 16:10"
        },
        {
          "id": 2,
          "message": "This commit has a version tag attached.",
          "tag": {
            "id": 1,
            "tag": "0.0.1"
          },
          "timestamp": "02.06.2020 11:20"
        },
        {
          "id": 1,
          "message": "This is a test commit message for Commit 1.",
          "timestamp": "20.05.2020 13:46"
        }
      ]
    };*/
  }

  /**
   * Loads the versioned model from API and sends it to the commit-list.
   * @param versionedModelId Id of the versioned model to load.
   */
  loadVersionedModel(versionedModelId) {
    fetch(Static.ModelPersistenceServiceURL + "/versionedModels/" + versionedModelId, {
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
   * Returns the HTMLElement of the commit list.
   * @returns {HTMLElement} HTMLElement of commit list.
   */
  getCommitListElement() {
    return this.shadowRoot.getElementById("commit-list");
  }
}

customElements.define('versioning-element', VersioningElement);
