import {html, LitElement} from 'lit-element';
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
          margin-top: auto;
          margin-bottom: auto;
        }
      </style>

      <div class="main" style="display: flex">
        <!-- Status Badge -->
        <span class="badge status-badge ${this.assertionData.status === "success" ? "bg-success" : (this.assertionData.status === "failed" ? "bg-danger" : "bg-secondary")}" 
          data-bs-toggle="tooltip" data-bs-placement="top" title=${this.getAssertionStatusTooltipText()}>
          ${this.assertionData.status === "success" ? "Success" : (this.assertionData.status === "failed" ? "Failed" : "-")}
        </span>

        <!-- Assertion Type Selection -->
        <select id="select-assertion-type" class="form-select form-select-sm w-auto" style="margin-left: 0.5em">
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
          <select id="select-assertion-operator" class="form-select form-select-sm w-auto" style="margin-left: 0.5em">
            ${Object.values(Assertions.STATUS_CODE_COMPARISON_OPERATORS).map(operator => html`
              <option value=${operator.id}>
                ${operator.value}
              </option>
            `)}
          </select>

          <!-- Select for status code -->
          <select id="select-assertion-value" class="form-select form-select-sm w-auto" style="margin-left: 0.5em">
            ${Object.values(Assertions.STATUS_CODES).map(statusCode => html`
              <option value=${statusCode}>
                ${statusCode}
              </option>
            `)}
          </select>
        ` : html``}

        <!-- Response Body Assertion -->
        ${this.assertionData.assertionType === Assertions.ASSERTION_TYPE.RESPONSE_BODY.id ? html`
          <body-assertion-part operator=${JSON.stringify(Object.values(Assertions.RESPONSE_BODY_OPERATORS).map(operator => operator.id))}></body-assertion-part>
        ` : html``}

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
      this.editModeOn = true;
    }

    firstUpdated() {
      this.setupAssertionTypeSelection();
      this.setupBootstrapTooltips();
    }

    setupAssertionTypeSelection() {
      // event listener for value change
      this.shadowRoot.getElementById("select-assertion-type").addEventListener("change", (e) => {
        const value = e.target.value;
        if(value === "-1") {
          this.assertionData.assertionType = null;
        } else if(value == Assertions.ASSERTION_TYPE.STATUS_CODE.id) {
          this.assertionData.assertionType = Assertions.ASSERTION_TYPE.STATUS_CODE.id;
        } else if(value == Assertions.ASSERTION_TYPE.RESPONSE_BODY.id) {
          this.assertionData.assertionType = Assertions.ASSERTION_TYPE.RESPONSE_BODY.id;
        }

        this.requestUpdate();
      });
    }

    setupBootstrapTooltips() {
      const tooltipTriggerList = [].slice.call(this.shadowRoot.querySelectorAll('[data-bs-toggle="tooltip"]'))
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
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