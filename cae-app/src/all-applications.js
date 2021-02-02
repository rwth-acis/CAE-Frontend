import { LitElement, html } from "lit-element";
import "./versioning/versioning-element.js";
import Common from "./util/common.js";
import Static from "./static.js";
import "@polymer/iron-icon";
import "../../node_modules/@polymer/paper-card/paper-card.js";
import "../../node_modules/@polymer/paper-button/paper-button.js";

/**
 * @customElement
 * @polymer
 */
class AllApplications extends LitElement {
  render() {
    return html`
      <style>
        .running-applications {
          display: flex;
          width: 100%;
          margin-top: 1em;
          align-items: center;
        }
        .running-applications:hover {
          background: #eeeeee;
        }
        .running-applications-content {
          width: 100%;
          height: 100%;
          align-items: flex-end;
          display: flex;
          align-content: center;
        }
        .open-running-applications {
          width: 50%;
          height: 50%;
          align-items: center;
          display: flex;
          align-content: center;
          color: rgb(240, 248, 255);
          background: rgb(30, 144, 255);
          max-height: 30px;
        }
        .open-running-applications:hover {
          color: rgb(240, 248, 255);
          background: rgb(65, 105, 225);
        }
        .edit-running-applications {
          width: 50%;
          height: 50%;
          align-items: center;
          display: flex;
          align-content: center;

          color: rgb(240, 248, 255);
          background: rgb(252, 194, 3);
          max-height: 30px;
        }
        .edit-running-applications:hover {
          color: rgb(240, 248, 255);
          background: rgb(232, 178, 0);
        }
      </style>

      ${this.runningApplications.length != 0
        ? html`<div>
            ${this.runningApplications.map(
              (app) => html`
                <paper-card class="running-applications">
                  <div class="running-applications-content">${app}</div>
                  <div class="running-applications-content">Created by:</div>

                  <paper-button class="open-running-applications"
                    >Open app</paper-button
                  >
                  <paper-button class="edit-running-applications"
                    >Edit app</paper-button
                  >
                </paper-card>
              `
            )}
          </div>`
        : html`<paper-card>Nothing deployed</paper-card>`}

      <paper-toast id="toast" text="Will be changed later."></paper-toast>
    `;
  }

  static get properties() {
    return {
      pendingDots: {
        type: Number,
      },
      runningApplications: {
        type: Array,
      },
    };
  }

  constructor() {
    super();
    this.runningApplications = [];
    this.getAllRunningApplications();
  }

  getAllRunningApplications() {
    console.log("getAllRunningApplications");

    fetch(`http://192.168.178.90:1235/verification/getRunningApplications`, {
      method: "POST",
    })
      .then((response) => {
        console.log(response);
        return response.text();
      })
      .then((data) => {
        var res = data.toString();
        console.log(data.toString());
        res = res.replace(/['"]+/g, "");
        res = res.substring(1, res.length - 1);
        console.log(res);
        this.runningApplications = res.split(",");
        this.runningApplications.shift();
        let x = this.runningApplications.filter((item, index) => this.runningApplications.indexOf(item) == index);
        this.runningApplications = x;
        console.log(this.runningApplications);
        console.log(this.runningApplications.length);
      })
      .catch((_) => {
        this.showToast("Error probably down");
      });
  }

  showToast(text) {
    const toastElement = this.shadowRoot.getElementById("toast");
    toastElement.text = text;
    toastElement.show();
  }
}

window.customElements.define("all-applications", AllApplications);
