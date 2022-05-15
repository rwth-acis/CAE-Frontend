import {html, LitElement} from 'lit-element';
import BootstrapUtil from '../util/bootstrap-util';
import Assertions from './assertions';
import './body-assertion-part';

class TestRequestAssertion extends LitElement {
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
        .status-badge {
          min-width: 5em;
          margin-top: 0.4rem;
          margin-bottom: auto;
        }
      </style>

      <div class="main" style="display: flex">
        <!-- Status Badge -->
        <span class="badge status-badge ${this.assertionData.status === "success" ? "bg-success" : (this.assertionData.status === "failed" ? "bg-danger" : "bg-secondary")}" 
          data-bs-toggle="tooltip" data-bs-placement="top" title=${this.getAssertionStatusTooltipText()}>
          ${this.assertionData.status === "success" ? "Success" : (this.assertionData.status === "failed" ? "Failed" : "-")}
        </span>

        <div style="display: flex; flex-wrap: wrap; row-gap: 0.5em">

        <!-- Assertion Type Selection -->
        <select id="select-assertion-type" class="form-select form-select-sm w-auto" style="margin-left: 0.5em" ?disabled=${!this.editModeOn}>
          <option value="-1">Select</option>
          ${Object.values(Assertions.ASSERTION_TYPE).map(assertionType => html`
            <option value=${assertionType.id}>
              ${assertionType.value}
            </option>
          `)}
        </select>

        <!-- Status Code Assertion -->
        ${this.assertionData.assertionType == Assertions.ASSERTION_TYPE.STATUS_CODE.id ? html`
          <!-- Select for comparison operator -->
          <select id="select-assertion-operator" class="form-select form-select-sm w-auto" style="margin-left: 0.5em" ?disabled=${!this.editModeOn}>
            ${Object.values(Assertions.STATUS_CODE_COMPARISON_OPERATORS).map(operator => html`
              <option value=${operator.id}>
                ${operator.value}
              </option>
            `)}
          </select>

          <!-- Select for status code -->
          <select id="select-assertion-value" class="form-select form-select-sm w-auto" style="margin-left: 0.5em" ?disabled=${!this.editModeOn}>
            ${Object.values(Assertions.STATUS_CODES).map(statusCode => html`
              <option value=${statusCode}>
                ${statusCode}
              </option>
            `)}
          </select>
        ` : html``}

        <!-- Response Body Assertion -->
        ${this.assertionData.assertionType === Assertions.ASSERTION_TYPE.RESPONSE_BODY.id ? html`
          <body-assertion-part id="first-body-assertion-part" 
            selectableOperatorIds=${JSON.stringify(Object.values(Assertions.RESPONSE_BODY_OPERATORS).map(operator => operator.id))}
            currentOperator=${JSON.stringify(this.assertionData.operator)}
            ?editModeOn=${this.editModeOn}
            @operator-updated=${(e) => this.onBodyAssertionOperatorUpdated(e.detail.operator)}
            style="display: contents"></body-assertion-part>
        ` : html``}

        ${this.editModeOn ? html`	
          ${this.assertionData.assertionType != null ? html`
            <button type="button" class="btn btn-success" style="margin-left: 0.5em; margin-top: auto; margin-bottom: auto"
              @click=${this.onCompleteEditingClicked}
              data-bs-toggle="tooltip" data-bs-placement="top" title="Complete editing"><i class="bi bi-check"></i></button>
          `: html``}

          <button type="button" class="btn btn-danger" style="margin-left: 0.5em; margin-top: auto; margin-bottom: auto"
            @click=${this.onDiscardAssertionClicked}
            data-bs-toggle="tooltip" data-bs-placement="top" title="Discard assertion"><i class="bi bi-x"></i></button>
        ` : html``}

        </div>

      </div>
      `;
    }

    static get properties() {
      return {
        assertionData: { type: Object },
        editModeOn: { type: Boolean }
      };
    }

    constructor() {
      super();
      this.editModeOn = false;
    }

    firstUpdated() {
      this.setupAssertionTypeSelection();
    }

    updated() {
      BootstrapUtil.setupBootstrapTooltips(this.shadowRoot);

      // update assertion type selection value
      const selectAssertionTypeValue = (this.assertionData.assertionType == null) ? "-1" : this.assertionData.assertionType;
      this.shadowRoot.getElementById("select-assertion-type").value = selectAssertionTypeValue;

      // check if edit mode is enabled
      this.editModeOn = Object.keys(this.assertionData).includes("editModeOn");
    }

    /**
     * Click event handler for button to complete editing of this assertion.
     * Removes the editModeOn "flag" from the assertion data.
     */
    onCompleteEditingClicked() {
      delete this.assertionData.editModeOn;
      this.sendRequestAssertionUpdatedEvent();
    }

    /**
     * Click event handler for button to discard the current assertion.
     * Notifies parent element that the assertion should be removed.
     */
    onDiscardAssertionClicked() {
      this.dispatchEvent(new CustomEvent("discard-assertion", {
        detail: {}
      }));
    }

    /**
     * Sets up the change event handler for the assertion type selection.
     */
    setupAssertionTypeSelection() {
      // event listener for value change
      this.shadowRoot.getElementById("select-assertion-type").addEventListener("change", (e) => {
        const value = e.target.value;

        // value -1 means "select" / the default value
        if(value === "-1") {
          this.assertionData.assertionType = null;
        } else if(value == Assertions.ASSERTION_TYPE.STATUS_CODE.id) {
          this.assertionData.assertionType = Assertions.ASSERTION_TYPE.STATUS_CODE.id;
        } else if(value == Assertions.ASSERTION_TYPE.RESPONSE_BODY.id) {
          this.assertionData.assertionType = Assertions.ASSERTION_TYPE.RESPONSE_BODY.id;
          // create operator data
          this.assertionData.operator = {
            id: 0
          };
        }

        this.sendRequestAssertionUpdatedEvent();
        this.requestUpdate();
      });
    }

    /**
     * Fires an event to notify the parent element that the assertion data has been updated.
     */
    sendRequestAssertionUpdatedEvent() {
      this.dispatchEvent(new CustomEvent("request-assertion-updated", {
        detail: {
          assertionData: this.assertionData
        }
      }));
    }

    /**
     * Event handler for "operator-updated" event from body-assertion-part.
     * Updates the operator within the assertionData and fires an event to notify about the change.
     * @param {*} operator Updated operator.
     */
    onBodyAssertionOperatorUpdated(operator) {
      this.assertionData.operator = operator;
      this.sendRequestAssertionUpdatedEvent();
    }

    getAssertionStatusTooltipText() {
      if(this.assertionData.status === "success") {
        return "Last run: Successful";
      } else if(this.assertionData.status === "failed") {
        return "Last run: Failed";
      } else {
        return "Test never ran";
      }
    }
}

customElements.define('test-request-assertion', TestRequestAssertion);