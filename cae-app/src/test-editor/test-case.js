import {html, LitElement} from 'lit-element';
import BootstrapUtil from '../util/bootstrap-util';
import './test-request';

class TestCase extends LitElement {

    render() {
      return html`
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
      </head>

      <style>
        .main {
          margin-bottom: 0.5em;
        }
        .card-body:hover {
          background-color: #fcfcfc;
        }
        .status-badge {
          min-width: 5em;
          margin-top: auto;
          margin-bottom: auto;
        }
      </style>

      <div class="card main">
        <div id="test-case-card-top" class="card-body" @click=${(e) => this.expandClicked(e)}>
          <div style="display: flex">
            <!-- Status Badge -->
            <span id="status-badge" class="badge status-badge ${this.testData.status === "success" ? "bg-success" : (this.testData.status === "failed" ? "bg-danger" : "bg-secondary")}"
              data-bs-toggle="tooltip" data-bs-placement="top" title=${this.getTestStatusTooltipText()}>
              ${this.testData.status === "success" ? "Success" : (this.testData.status === "failed" ? "Failed" : "-")}
            </span>
            
            <!-- Test Case Name -->
            <input id="input-test-case-name" type="text" class="form-control" @focusout=${this.changeNameEditModeOn} style="display: ${this.nameEditModeOn ? '' : 'none'}; margin-left: 0.5em; margin-top: auto; margin-bottom: auto">
            <h6 id="test-case-name" @click=${this.changeNameEditModeOn} style="display: ${this.nameEditModeOn ? 'none' : ''}; margin-left: 0.5em; margin-top: auto; margin-bottom: auto">${this.testData.name}</h6>
            
            <!-- Expand/Collapse Button -->
            <i class="bi ${this.open ? "bi-chevron-up" : "bi-chevron-down"}" style="margin-right: 0; margin-left: auto"></i>
          </div>
        </div>
        <!-- Collapsible Content of the Card -->
        <ul class="list-group list-group-flush" style="display: ${this.open ? '' : 'none'}">
          <li class="list-group-item">
            <div>
              <!-- Button to add a new request -->
              <div style="display: flex">
                <button type="button" @click=${this.onAddRequestClicked} class="btn btn-primary" style="margin-left: auto; margin-bottom: 0.5em">Add request</button>
              </div>

              <!-- Requests -->
              <div>
                ${this.testData.requests.map(request => html`
                  <test-request requestData=${JSON.stringify(request)} testCaseId=${this.testData.id} availableAgents=${JSON.stringify(this.availableAgents)}></test-request>
                `)}
              </div>
            </div>
          </li>
        </ul>
      </div>


      <!-- Delete Test Case Dialog -->
      <paper-dialog id="dialog-delete-test-case" class="rounded" modal>
          <h5 class="modal-title mt-3">Delete test case?</h5>
          <hr/>
          <p>Do you want to delete the test case "${this.testData.name}"?</p>
          <hr/>
          <div class="buttons">
            <button type="button" class="btn btn-secondary" dialog-dismiss>Close</button>
            <button type="button" @click=${this.onDeleteTestClicked} class="btn btn-primary" style="margin-left: 0.5em" dialog-confirm>Yes</button>
          </div>
      </paper-dialog>
      `;
    }

    static get properties() {
      return {
        /**
         * Whether the card is open or not.
         */
        open: { type: Boolean },

        /**
         * JSON data containing information on the test case.
         */
        testData: { type: Object },

        /**
         * Whether the edit mode for the test case name is enabled.
         */
        nameEditModeOn: { type: Boolean },

        /**
         * List of agents that are available in the current test suite.
         */
        availableAgents: { type: Array }
      };
    }

    constructor() {
      super();
      this.open = false;
      this.nameEditModeOn = false;
    }

    firstUpdated() {
      this.setupCardContextMenu();
      this.setupTestCaseNameInput();
      BootstrapUtil.setupBootstrapTooltips(this.shadowRoot);
    }

    updated() {
      this.shadowRoot.querySelectorAll("test-request").forEach(request => request.setYjsSync(this.yjsSync));
    }

    setYjsSync(yjsSync) {
      this.yjsSync = yjsSync;
    }

    /**
     * Disables the default context menu of the test case card header.
     * Right click on top of card opens dialog to delete test case.
     */
    setupCardContextMenu() {
      this.shadowRoot.getElementById("test-case-card-top").addEventListener("contextmenu", event => {
        // hide default context menu
        event.preventDefault();

        // show test case deletion dialog
        this.shadowRoot.getElementById("dialog-delete-test-case").open();
      });
    }

    /**
     * If enter is pressed in the test case name input field, the focus should be removed from the input.
     */
    setupTestCaseNameInput() {
      this.shadowRoot.getElementById("input-test-case-name").addEventListener("keydown", event => {
        if (event.key === "Enter") {
          // focus out if enter is pressed
          this.shadowRoot.getElementById("input-test-case-name").blur();
        }
      });
    }

    /**
     * Gets called when the "Add request" button gets clicked.
     * Fires an event, to add a new request into the Yjs room.
     */
    onAddRequestClicked() {
      this.dispatchEvent(new CustomEvent("add-test-case-request", {
        detail: {}
      }));
    }

    /**
     * Gets called if the expand/collapse button of the card is clicked.
     */
    expandClicked(e) {
      // if the click was on the status badge or test case name, then don't react to this click event
      const elementId = e.path[0].id;
      if (["status-badge", "input-test-case-name", "test-case-name"].includes(elementId)) {
        return;
      }

      this.open = !this.open;

      if(this.open) {
          // collapse all other test cases
          this.shadowRoot.host.parentNode.querySelectorAll("test-case").forEach(testCase => {
            if(testCase !== this) {
              testCase.collapse();
            }
          });
      } else {
          // test case got collapsed
          // also collapse all requests of the test case
          this.shadowRoot.querySelectorAll("test-request").forEach(request => request.collapse());
      }
    }

    /**
     * Collapses the test case card and all request cards within the test case card.
     */
    collapse() {
      this.open = false;
      this.shadowRoot.querySelectorAll("test-request").forEach(request => request.collapse());
    }

    /**
     * Click event handler for button in "delete test case" dialog.
     * Fires event to notify parent elements that the test case should be deleted.
     */
    onDeleteTestClicked() {
      this.dispatchEvent(new CustomEvent("test-case-delete", {
        detail: {}
      }));
    }

    /**
     * Enables or disables the edit mode for the test case name.
     * If edit mode is disabled, the updated test case name is sent to the parent element.
     */
    changeNameEditModeOn() {
      this.nameEditModeOn = !this.nameEditModeOn;

      if(this.nameEditModeOn) {
        // edit mode is enabled now => focus on the input
        window.setTimeout(() => this.shadowRoot.getElementById("input-test-case-name").focus(), 0);
      } else {
        // edit mode is disabled now => update test case name
        this.testData.name = this.shadowRoot.getElementById("input-test-case-name").value;

        this.dispatchEvent(new CustomEvent("test-case-name-updated", {
          detail: {
            newTestCaseName: this.testData.name
          }
        }));
      }

      this.shadowRoot.getElementById("input-test-case-name").value = this.testData.name;
      this.shadowRoot.getElementById("test-case-name").value = this.testData.name;
    }

    getTestStatusTooltipText() {
      if(this.testData.status === "success") {
        return "Last run: Successful";
      } else if(this.testData.status === "failed") {
        return "Last run: Failed";
      } else {
        return "Test never ran";
      }
    }
}

customElements.define('test-case', TestCase);