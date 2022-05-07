import {html, LitElement} from 'lit-element';
import './test-request-assertion';

class TestRequest extends LitElement {
    render() {
      return html`
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
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
        <div class="card-body" @click=${this.expandClicked}>
          <div style="display: flex">
            <!-- Request type -->
            <span class="badge bg-primary">${this.requestData.type}</span>
            
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
              <div class="mb-3">
                <label for="textarea-body" class="form-label">Body:</label>
                <textarea class="form-control" id="textarea-body" rows="3"></textarea>
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
      `;
    }

    static get properties() {
      return {
        open: { type: Boolean },
        requestData: { type: Object },
        availableAgents: { type: Array }
      };
    }

    constructor() {
      super();
      this.open = false;
    }

    firstUpdated() {
      this.setupAgentSelection();
      this.setupAuthCheckbox();
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
    }
  
    /**
     * Expands/collapses the test request card.
     */
    expandClicked() {
      this.open = !this.open;
    }
}

customElements.define('test-request', TestRequest);