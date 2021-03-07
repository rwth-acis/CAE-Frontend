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
        .deployment-info {
          text-align: center;
          align-items: center;
        }
        .summary-see-release {
          padding: 1em;
        }
        .summary {
          padding: 1em;
        }
        .see-releases-paper {
          width: 100%;
        }
        .release-deployments-paper {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          align-content: center;
          padding: 2em;
        }
        .running-applications-paper {
          width: 100%;
          margin-top: 1em;
        }
        .running-applications {
          display: flex;
          margin-top: 1em;
          align-items: center;
          padding: 2em;
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
        .open-release-application {
          align-items: center;
          align-content: center;
          color: rgb(240, 248, 255);
          background: rgb(30, 144, 255);
        }
        .stop-release-application {
          align-items: center;
          align-content: center;
          color: rgb(240, 248, 255);
          background: red;
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
        .outer {
          display: flex;
          flex-flow: column;
          height: 100%;
        }
        .nothing-deployed {
          text-align: center;
          margin: auto;
          width: 100%;
          height: 100%;
          border: 3px solid green;
          padding: 10px;
        }
      </style>

      ${this.runningApplications.length != 0
        ? html` <div>
            ${this.runningApplications.map(
              (app) => html`
                <paper-card class="running-applications-paper">
                  <div class="running-applications">
                    <div class="running-applications-content">${app.name}</div>
                    <div class="running-applications-content">
                      Created by: ${app.authorName}
                    </div>

                    <paper-button
                      class="open-running-applications"
                      @click=${(e) => {
                        this._onOpenAppClicked(
                          app.releases[Object.keys(app.releases)[0]].supplement
                            .link
                        );
                      }}
                      >Open app</paper-button
                    >
                    <paper-button
                      class="edit-running-applications"
                      @click=${(e) => {
                        this._onEditAppClicked(
                          app.releases[Object.keys(app.releases)[0]].supplement
                            .id
                        );
                      }}
                      >Edit app</paper-button
                    >
                  </div>
                  <paper-card class="see-releases-paper">
                    <details>
                      <summary class="summary-see-release">
                        See Releases
                      </summary>
                      ${Object.keys(app.releases).map(
                        (release) => html`
                          <details>
                            <summary class="summary">
                              Deployments of release version: ${release}
                            </summary>
                            ${app.releases[release].instances.map(
                              (deployment) =>
                                html` <div>
                                  <paper-card class="release-deployments-paper">
                                    <div class="deployment-info">
                                      ${deployment.clusterName} Time:
                                      ${deployment.time}
                                    </div>
                                    <div>
                                      <paper-button
                                        class="open-release-application"
                                        @click=${(e) => {
                                          this._onOpenAppClicked(
                                            deployment.link
                                          );
                                        }}
                                        >Open app</paper-button
                                      >
                                      <paper-button
                                        class="stop-release-application"
                                        @click=${(e) => {
                                          this._onOpenAppClicked(
                                            deployment.link
                                          );
                                        }}
                                        >Stop deployment</paper-button
                                      >
                                    </div>
                                  </paper-card>
                                </div>`
                            )}
                          </details>
                        `
                      )}
                    </details>
                  </paper-card>
                </paper-card>
              `
            )}
          </div>`
        : html`<div class="outer">
            <paper-card class="nothing-deployed">Nothing deployed</paper-card>
          </div>`}

      <paper-toast id="toast" text="Will be changed later."></paper-toast>
    `;
  }

  _onOpenAppClicked(link) {
    window.open(link, "_blank");
  }
  _onEditAppClicked(id) {
    console.log(id);
    window.open(
      "http://localhost:8070/cae-deploy/test-deploy/" + id.toString(),
      "_blank"
    );
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

  async getAllRunningApplications() {
    var services = [];
    await fetch(`http://localhost:8012/las2peer/services/services`, {
      method: "GET",
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log("data");
        console.log(data);
        services = data;
        this.runningApplications = data;
        this.requestUpdate();
        if (services == []) {
          this.showToast("No deployments");
        }
      })
      .catch((_) => {
        this.showToast("Error probably down");
      });
    // var deployments;
    // await fetch(`http://localhost:8012/las2peer/services/deployments`, {
    //   method: "GET",
    // })
    //   .then((response) => {
    //     return response.json();
    //   })
    //   .then((data) => {
    //     deployments = data;
    //     if (Object.keys(deployments).length === 0) {
    //       console.log("NOOOO")
    //       this.showToast("No deployments");
    //     } else {
    //       console.log("YYEEHHHH")

    //       Object.keys(deployments).forEach((item) => {
    //         console.log("item")
    //         console.log(item)
    //         if (deployments[item].length != 0) {
    //           console.log(item)
    //           var filtered = services.filter(function (app) {
    //             return app.name == deployments[item][0].packageName;
    //           });
    //           this.runningApplications.push(filtered[0]);
    //         }
    //       });
    //       console.log(deployments)
    //       console.log(services)
    //       console.log(this.runningApplications)
    //       this.requestUpdate();
    //     }
    //   })
    //   .catch((e) => {
    //     console.log(e);
    //     this.showToast("Error probably down");
    //   });
  }

  showToast(text) {
    const toastElement = this.shadowRoot.getElementById("toast");
    toastElement.text = text;
    toastElement.show();
  }
}

window.customElements.define("all-applications", AllApplications);
