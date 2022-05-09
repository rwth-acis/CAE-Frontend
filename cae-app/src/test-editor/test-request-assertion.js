import {html, LitElement} from 'lit-element';

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
      </div>
      `;
    }

    static get properties() {
      return {
        assertionData: { type: Object }
      };
    }
    setupBootstrapTooltips() {
      const tooltipTriggerList = [].slice.call(this.shadowRoot.querySelectorAll('[data-bs-toggle="tooltip"]'))
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
    }

    firstUpdated() {
      this.setupBootstrapTooltips();
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