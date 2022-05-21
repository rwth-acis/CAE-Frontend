import {html, LitElement} from 'lit-element';
import Static from '../static';
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
        <div id="test-request-card-top" class="card-body" @click=${(e) => this.expandClicked(e)}>
          <div style="display: flex">
            <!-- Request type -->
            <span id="request-type-badge" class="badge bg-primary" @click=${this.changeTypeEditModeOn} style="display: ${this.typeEditModeOn ? 'none' : ''};">${this.requestData.type}</span>
            <select id="select-request-type" @focusout=${this.changeTypeEditModeOn} class="form-select form-select-sm w-auto" style="display: ${this.typeEditModeOn ? '' : 'none'};">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            
            <!-- Request url -->
            <input id="input-test-request-url" type="text" class="form-control" @focusout=${this.changeUrlEditModeOn} style="display: ${this.urlEditModeOn ? '' : 'none'}; margin-left: 0.5em; margin-top: auto; margin-bottom: auto">
            <h6 id="test-request-url" @click=${this.changeUrlEditModeOn} style="display: ${this.urlEditModeOn ? 'none' : ''}; margin-left: 0.5em; margin-top: auto; margin-bottom: auto">${this.requestData.url}</h6>

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
                <button type="button" @click=${this.onAddAssertionClicked} class="btn btn-primary" style="margin-left: auto;">Add assertion</button>
              </div>
              <div>
                ${this.requestData.assertions.map(assertion => html`
                  <test-request-assertion assertionData=${JSON.stringify(assertion)}
                    @discard-assertion=${(e) => this.onDiscardAssertion(assertion.id)}
                    @request-assertion-updated=${(e) => this.onRequestAssertionUpdated(e.detail.assertionData)}></test-request-assertion>
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
        urlEditModeOn: { type: Boolean },
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
      this.urlEditModeOn = false;
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

    setYjsSync(yjsSync) {
      this.yjsSync = yjsSync;
    }
  
    /**
     * Expands/collapses the test request card.
     */
    expandClicked(e) {
      // if the click was on the request url or request type badge, then don't react to this click event
      const elementId = e.path[0].id;
      if(["test-request-url", "input-test-request-url", "request-type-badge", "select-request-type"].includes(elementId)) {
        return;
      }

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
        
        this.yjsSync.bindRequestBodyCodeMirror(this.testCaseId, this.requestData.id, this.codeMirrorEditor);
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

    /**
     * Enables or disables the edit mode for the test request url.
     * If edit mode is disabled, the updated test request url is sent to the parent element.
     */
    changeUrlEditModeOn() {
      this.urlEditModeOn = !this.urlEditModeOn;

      if (this.urlEditModeOn) {
        // edit mode is enabled now => focus on the input
        window.setTimeout(() => this.shadowRoot.getElementById("input-test-request-url").focus(), 0);
      } else {
        // edit mode is disabled now => update test request url
        this.requestData.url = this.shadowRoot.getElementById("input-test-request-url").value;

        this.sendTestRequestUpdatedEvent();
      }

      this.shadowRoot.getElementById("input-test-request-url").value = this.requestData.url;
      this.shadowRoot.getElementById("test-request-url").value = this.requestData.url;
    }

    /**
     * Click event handler for button to add a new assertion to the request.
     */
    onAddAssertionClicked() {
      this.requestData.assertions.push({
        id: Math.floor(Math.random() * 999999),
        status: "undefined",
        assertionType: null,
        editModeOn: true
      });
      this.sendTestRequestUpdatedEvent();
    }

    /**
     * Event handler for the "discard-assertion" event fired by a test-request-assertion element.
     * Removes the assertion from the request.
     * @param {*} assertionId Id of the assertion, that should be removed.
     */
    onDiscardAssertion(assertionId) {
      this.requestData.assertions = this.requestData.assertions.filter(assertion => assertion.id !== assertionId);
      this.sendTestRequestUpdatedEvent();
    }

    /**
     * Event handler for the "request-assertion-updated" event fired by a test-request-assertion element.
     * Updates the assertion in the requestData and sends the updated requestData to the parent element.
     * @param {*} assertionData Updated assertion data.
     */
    onRequestAssertionUpdated(assertionData) {
      const index = this.requestData.assertions.findIndex(a => a.id == assertionData.id);
      this.requestData.assertions[index] = assertionData;
      this.sendTestRequestUpdatedEvent();
    }
}

customElements.define('test-request', TestRequest);