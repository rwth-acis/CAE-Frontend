import {html, LitElement} from 'lit-element';
import './test-request-assertion';

class TestRequest extends LitElement {
    render() {
      return html`
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">

        <link href="../../node_modules/codemirror/lib/codemirror.css" rel="stylesheet">
      </head>
      <style>
        .card-body:hover {
          background-color: #fcfcfc;
        }
        .badge {
          margin-top: auto;
          margin-bottom: auto;
        }
        .main {
          margin-bottom: 0.5em;
        }
      </style>

      <div class="card main">
        <div id="test-request-card-top" class="card-body" @click=${this.expandClicked}>
          <div style="display: flex">
            <!-- Request type -->
            <span class="badge bg-primary" @click=${this.changeTypeEditModeOn} style="display: ${this.typeEditModeOn ? 'none' : ''};">${this.requestData.type}</span>
            <select id="select-request-type" @focusout=${this.changeTypeEditModeOn} class="form-select form-select-sm w-auto" style="display: ${this.typeEditModeOn ? '' : 'none'};">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            
            <!-- Request url -->
            <h6 id="test-case-name" style="margin-left: 0.5em; margin-top: auto; margin-bottom: auto">${this.requestData.url}</h6>

            <!-- Expand/Collapse Button -->
            <i class="bi ${this.open ? "bi-chevron-up" : "bi-chevron-down"}" style="margin-right: 0; margin-left: auto"></i>
          </div>
        </div>

        <!-- Collapsible Content of the Card -->
        <ul class="list-group list-group-flush" style="display: ${this.open ? '' : 'none'}">
          <li class="list-group-item">
            <div>
              <div style="display: flex">

                <!-- Authorization checkbox -->
                <div class="form-check" style="margin-top: auto; margin-bottom: auto">
                  <input class="form-check-input" type="checkbox" value="" id="checkAuth">
                  <label class="form-check-label" for="checkAuth">
                    Authorization
                  </label>
                </div>
              
                <!-- Agent selection -->
                <select id="select-agent" class="form-select form-select-sm w-auto" style="margin-left: 0.5em">
                  ${this.availableAgents.map(agent => html`
                    <option value=${agent.id}>
                      ${agent.name}
                    </option>
                  `)}
                </select> 
              </div>

              <!-- Request body -->
              <div>
                <label for="textarea-body" class="form-label">Body:</label>
                <textarea id="textarea-body"></textarea>
              </div>

              <!-- Assertions -->
              <div class="mb-3" style="display: flex">
                <label style="margin-top: auto; margin-bottom: auto">Assertions:</label>
                <button type="button" class="btn btn-primary" style="margin-left: auto;">Add assertion</button>
              </div>
              <div>
                ${this.requestData.assertions.map(assertion => html`
                  <test-request-assertion assertionData=${JSON.stringify(assertion)}></test-request-assertion>
                `)}
                ${this.requestData.assertions.length === 0 ? "No assertions added to the request yet." : ""}
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- Delete Test Request Dialog -->
      <paper-dialog id="dialog-delete-test-request" class="rounded" modal>
        <h5 class="modal-title mt-3">Delete test request?</h5>
        <hr/>
        <p>Do you want to delete the test request "${this.requestData.type + ' '  + this.requestData.url}"?</p>
        <hr/>
        <div class="buttons">
          <button type="button" class="btn btn-secondary" dialog-dismiss>Close</button>
          <button type="button" @click=${this.onDeleteTestRequestClicked} class="btn btn-primary" style="margin-left: 0.5em" dialog-confirm>Yes</button>
        </div>
      </paper-dialog>
      `;
    }

    static get properties() {
      return {
        open: { type: Boolean },
        typeEditModeOn: { type: Boolean },
        testCaseId: { type: Number },
        requestData: { type: Object },
        availableAgents: { type: Array },
        codeMirrorEditor: { type: Object }
      };
    }

    constructor() {
      super();
      this.open = false;
      this.typeEditModeOn = false;
    }

    firstUpdated() {
      this.setupCardContextMenu();
      this.setupAgentSelection();
      this.setupAuthCheckbox();
    }

    /**
     * Disables the default context menu of the test request card header.
     * Right click on top of card opens dialog to delete request from test.
     */
    setupCardContextMenu() {
      this.shadowRoot.getElementById("test-request-card-top").addEventListener("contextmenu", event => {
        // hide default context menu
        event.preventDefault();

        // show test request deletion dialog
        this.shadowRoot.getElementById("dialog-delete-test-request").open();
      });
    }

    /**
     * Sets the change listener for the agent select element.
     * Fires the test-request-updated event when the agent is changed.
     */
    setupAgentSelection() {
      this.shadowRoot.getElementById("select-agent").addEventListener("change", (e) => {
        // selected agent has changed
        this.requestData.auth.selectedAgent = Number.parseInt(e.target.value);

        this.sendTestRequestUpdatedEvent();
      });
    }

    /**
     * Sets the change listener for the authorization checkbox.
     * Fires the test-request-updated event when the authorization checkbox is changed.
     */
    setupAuthCheckbox() {
      this.shadowRoot.getElementById("checkAuth").addEventListener("change", (e) => {
        // auth checkbox has changed
        const authEnabled = e.target.checked;
        if(authEnabled) {
          this.requestData.auth.selectedAgent = Number.parseInt(this.shadowRoot.getElementById("select-agent").value);
        } else {
          this.requestData.auth = {};
        }
        this.sendTestRequestUpdatedEvent();
      });
    }

    updated(changedProperties) {
      super.update(changedProperties);

      // check if request data has changed
      if(changedProperties.has("requestData")) {
        // update auth checkbox and agent selection element
        this.updateAuthCheckbox();
        this.updateAgentSelect();
      }
    }

    /**
     * Fires the test-request-updated event.
     * Includes the current request data.
     */
    sendTestRequestUpdatedEvent() {
      this.dispatchEvent(new CustomEvent("test-request-updated", {
        detail: {
          request: this.requestData
        },
        bubbles: true,
        composed: true
      }));
    }

    /**
     * Click event handler for button in "delete test request" dialog.
     * Fires event to notify parent elements that the test request should be deleted.
     */
     onDeleteTestRequestClicked() {
      this.dispatchEvent(new CustomEvent("test-request-delete", {
        detail: {
          testCaseId: this.testCaseId,
          requestId: this.requestData.id
        },
        bubbles: true,
        composed: true
      }));
    }

    /**
     * Updates the agent selection element: Enables/disables it and sets its value. 
     */
    updateAgentSelect() {
      if(Object.keys(this.requestData.auth).includes("selectedAgent")) {
        this.shadowRoot.querySelector("#select-agent").value = this.requestData.auth.selectedAgent;
        this.shadowRoot.querySelector("#select-agent").removeAttribute("disabled");
      } else {
        this.shadowRoot.querySelector("#select-agent").setAttribute("disabled", "");
      }
    }

    /**
     * Updates the authorization checkbox (enables/disables it).
     */
    updateAuthCheckbox() {
      if(Object.keys(this.requestData.auth).length === 0) {
        this.shadowRoot.getElementById("checkAuth").checked = false;
      } else {
        this.shadowRoot.getElementById("checkAuth").checked = true;
      }
    }

    /**
     * Collapses the test request card.
     */
    collapse() {
      this.open = false;
      if(this.codeMirrorEditor) this.codeMirrorEditor.toTextArea();
    }
  
    /**
     * Expands/collapses the test request card.
     */
    expandClicked() {
      this.open = !this.open;

      if(this.open) {
        // collapse all other test requests in the test case
        this.shadowRoot.host.parentNode.querySelectorAll("test-request").forEach(testRequest => {
          if(testRequest !== this) {
            testRequest.collapse();
          }
        });

        // initialize code mirror editor for request body
        this.codeMirrorEditor = CodeMirror.fromTextArea(this.shadowRoot.getElementById("textarea-body"), {
          lineNumbers: true,
          mode: {
            name: "javascript",
            json: true
          }
        });
        setTimeout(() => this.codeMirrorEditor.refresh(), 0);
      } else {
        this.codeMirrorEditor.toTextArea();
      }
    }

    /**
     * Enables or disables the edit mode for the test request type.
     * If edit mode is disabled, the updated test request type is sent to the parent element.
     */
    changeTypeEditModeOn() {
      this.typeEditModeOn = !this.typeEditModeOn;

      if (this.typeEditModeOn) {
        this.shadowRoot.getElementById("select-request-type").value = this.requestData.type;
      } else {
        // edit mode is disabled now => update test request type
        this.requestData.type = this.shadowRoot.getElementById("select-request-type").value;

        this.sendTestRequestUpdatedEvent();
      }
    }
}

customElements.define('test-request', TestRequest);