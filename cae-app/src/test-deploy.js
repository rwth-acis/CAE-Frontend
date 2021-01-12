import { LitElement, html } from "lit-element";
import "./versioning/versioning-element.js";
import Common from "./util/common.js";
import Static from "./static.js";
import "@polymer/iron-icon/iron-icon.js";

/**
 * @customElement
 * @polymer
 */
class TestDeploy extends LitElement {
  render() {
    return html`
      <style>
        paper-button {
          height: 2.5em;
        }
        .paper-button-blue {
          color: rgb(240, 248, 255);
          background: rgb(30, 144, 255);
          height: 2.5em;
        }
        .paper-button-blue:hover {
          color: rgb(240, 248, 255);
          background: rgb(65, 105, 225);
        }
        paper-button[disabled] {
          background: #e1e1e1;
        }
        textarea#deploy-status {
          background-color: #000000;
          color: #ffffff;
        }
        .right-right {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .middle {
          display: flex;
          flex-direction: row;
          justify-content: space-around;
        }
        .input-fields {
          flex-grow: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
        }
        .selectDeployment {
          display: flex;
          flex-direction: row;
          justify-content: space-around;
        }
        .dropdown-right {
          display: flex;
          flex-direction: row;
        }
        span.textbox {
          background-color: #fff;
          color: #888;
          line-height: 20px;
          height: 20px;
          padding: 3px;
          border: 1px #888 solid;
          font-size: 9pt;
        }

        span.textbox input {
          border: 0px;
          background-color: #fff;
        }
        /* Style the tab */
        .tab {
          overflow: hidden;
          border: 1px solid #ccc;
          background-color: #f1f1f1;
        }

        /* Style the buttons that are used to open the tab content */
        .tab button {
          background-color: inherit;
          margin: auto;
          border: none;
          outline: none;
          cursor: pointer;
          padding: 14px 16px;
          transition: 0.3s;
        }

        /* Change background color of buttons on hover */
        .tab button:hover {
          background-color: #ddd;
        }

        /* Create an active/current tablink class */
        .tab button.active {
          background-color: #ccc;
        }

        /* Style the tab content */
        .tabcontent {
          display: none;
          padding: 6px 12px;
          border: 1px solid #ccc;
          border-top: none;
        }
        .app {
          display: flex; /* or inline-flex */
          justify-content: space-between;
          align-items: baseline;
          background-color: #ccf;
          padding: 6px 12px;
          border: 1px solid #ccf;
          border-top: none;
        }
        .app:hover {
          background-color: #e4e4ec;
        }
        .App {
          /* pointer-events: none; */
          display: flex; /* or inline-flex */
          justify-content: space-between;
          background-color: #ccffdd;
          padding: 6px 12px;
          border: 1px solid #ccfff0;
          border-top: none;
        }
        .delete_button:hover {
          color: #000000;
          background: #fa0b0b;
        }
        .retry_button:hover {
          color: #000000;
          background: #00ff55;
        }
      </style>
      <div id="Deployment" style="hidden: false;">
        <div class="middle">
          <div class="input-fields">
            <h4>Application Name</h4>
            Name
            <span class="textbox">
              <input
                type="text"
                id="country"
                name="country"
                value="cae-app-"
                readonly
              />
              <input
                id="nameDefaultValue"
                type="text"
                @input="${this.nameDefaultValueInput}"
                .value="${this.nameDefaultValue}"
              />
            </span>
            URL
            <input
              id="urlDefaultValue"
              type="text"
              @input="${this.urlDefaultValueInput}"
              .value="${this.urlDefaultValue}"
            />
            <paper-button
              id="deploy-model"
              @click=${this._onDeployButtonClicked}
              class="paper-button-blue"
              >${this.deployButtonStatus}</paper-button
            >
          </div>
          <div class="right-side">
            <h4>Management</h4>
            <div id="Management" style="hidden: true;">
              <div class="app" id="app">
                <div style="margin-right:20px;">
                  Application: ${this.projectName}
                </div>
                <!-- <iron-icon
                  icon="arrow-drop-down"
                  class="icon-no icon"
                ></iron-icon> -->
                <div class="App" style="hidden: false;">
                  <div>
                    <iron-icon
                      icon="block"
                      class="delete_button"
                      @click="${() => this.deleteDeployment()}"
                    ></iron-icon>
                    <iron-icon icon="redo" class="retry_button"></iron-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div
            style="display: flex; margin-left: 4px; margin-right: 4px; margin-top: 4px;"
          >
            <a
              id="open-deployment"
              target="_blank"
              href=${Static.DeploymentURL}
              style="margin-left: auto; margin-top: auto; margin-bottom: auto"
              >Open deployment</a
            >
          </div>

          <div
            class="form-group"
            style="margin-left: 4px; margin-right: 4px; margin-top: 4px; height: 150px"
          >
            <input
              type="text"
              class="form-control"
              id="status"
              style="width: 100%"
              placeholder="Status.."
            />
            <br />
            <textarea
              id="deploy-status"
              style="width: 100%;"
              class="form-control"
              readonly
            ></textarea>
          </div>
        </div>
      </div>
      <paper-toast id="toast" text="Will be changed later."></paper-toast>
    `;
  }

  static get properties() {
    return {
      pendingDots: {
        type: Number,
      },
      portDefaultValue: {
        type: String,
      },
      namespaceDefaultValue: {
        type: String,
      },
      deployButtonStatus: {
        type: String,
      },
      namespacePrefixDefaultValue: {
        type: String,
      },
      urlDefaultValue: {
        type: String,
      },
      nameDefaultValue: {
        type: String,
      },
      projectName: {
        type: String,
      },
      deploymentStatus: {
        type: String,
      },
      map: {
        type: String,
        observer: "_activeChanged",
      },
      y: {
        type: Object,
      },
    };
  }
  showManagement() {
    this.deployButtonStatus = "DEPLOYED"
    this.shadowRoot.getElementById("app").style.pointerEvents = "all";
  }
  showDeployment() {
    this.deployButtonStatus = "DEPLOY"
    this.shadowRoot.getElementById("app").style.pointerEvents = "none";
  }
  nameDefaultValueInput() {
    var temp = this.shadowRoot.getElementById("nameDefaultValue");
    this.y.share.data.set("nameDefaultValue", temp.value);
  }

  portDefaultValueInput() {
    var temp = this.shadowRoot.getElementById("portDefaultValue");
    this.y.share.data.set("portDefaultValue", temp.value);
  }
  namespaceDefaultValueInput() {
    var temp = this.shadowRoot.getElementById("namespaceDefaultValue");
    this.y.share.data.set("namespaceDefaultValue", temp.value);
  }
  urlDefaultValueInput() {
    var temp = this.shadowRoot.getElementById("urlDefaultValue");
    this.y.share.data.set("urlDefaultValue", temp.value);
  }
  updateDefaultValue(newDefaultValue, defaultValue) {
    switch (defaultValue) {
      case "portDefaultValue":
        this.portDefaultValue = newDefaultValue;
        this.requestUpdate("newDefaultValue", newDefaultValue);
        break;
      case "nameDefaultValue":
        this.nameDefaultValue = newDefaultValue;
        this.requestUpdate("newDefaultValue", newDefaultValue);
        break;
      case "namespaceDefaultValue":
        this.namespaceDefaultValue = newDefaultValue;
        this.requestUpdate("newDefaultValue", newDefaultValue);
        break;
      case "urlDefaultValue":
        this.urlDefaultValue = newDefaultValue;
        this.requestUpdate("newDefaultValue", newDefaultValue);
        break;

      default:
        break;
    }
  }

  constructor() {
    super();
    self = this;
    setInterval(function () {
      self.checkIfApplicationIsDeploying();
    }, 5000);
    Y({
      db: {
        name: "memory",
      },
      connector: {
        name: "websockets-client",
        room: "example",
        options: { resource: Static.YjsResourcePath },
        url: Static.YjsAddress,
      },
      share: {
        map: "Map",
        data: "Map",
      },
    }).then(function (y) {
      self.y = y;

      /// nameDefaultValue
      if (y.share.data.get("nameDefaultValue") == undefined) {
        y.share.data.set("nameDefaultValue", self.nameDefaultValue);
      } else {
        self.nameDefaultValue = y.share.data.get("nameDefaultValue");
      }
      /// urlDefaultValue
      if (y.share.data.get("urlDefaultValue") == undefined) {
        y.share.data.set("urlDefaultValue", self.urlDefaultValue);
      } else {
        self.urlDefaultValue = y.share.data.get("urlDefaultValue");
      }
      // deploymentStatus
      if (y.share.data.get("deploymentStatus") == undefined) {
        y.share.data.set("deploymentStatus", self.deploymentStatus);
      } else {
        self.deploymentStatus = y.share.data.get("deploymentStatus");
        y.share.data.set("deploymentStatus", "setNotDeploying");
      }

      y.share.data.observe((event) => {
        if (event.name == "urlDefaultValue") {
          if (event.value != event.oldValue) {
            self.updateDefaultValue(event.value, "urlDefaultValue");
          }
        } else if (event.name == "nameDefaultValue") {
          if (event.value != event.oldValue) {
            self.updateDefaultValue(event.value, "nameDefaultValue");
          }
        } else if (event.name == "deploymentStatus") {
          if (event.value == "setDeploying") {
            self.deployButtonStatus = "DEPLOY"
            self.deploymentStatus = "setDeploying";
            self.getDeployButton().disabled = true;
            self.shadowRoot.getElementById("nameDefaultValue").disabled = true;
            self.shadowRoot.getElementById("urlDefaultValue").disabled = true;
          } else if (event.value == "setNotDeploying") {
            console.log("setNotDeploying");
            self.deploymentStatus = "setNotDeploying";
            self.getDeployButton().disabled = false;
            self.shadowRoot.getElementById("nameDefaultValue").disabled = false;
            self.shadowRoot.getElementById("urlDefaultValue").disabled = false;
            // self.showDeployment();
            self.showDeployment();
          } else if (event.value == "setAlreadyDeployed") {
            self.deploymentStatus = "setAlreadyDeployed";
            self.getDeployButton().disabled = true;
            self.shadowRoot.getElementById("nameDefaultValue").disabled = true;
            self.shadowRoot.getElementById("urlDefaultValue").disabled = true;
            self.showManagement();
          }
        }
      });
    });
    this.deployButtonStatus = "DEPLOY"
    this.pendingDots = 0;
    this.nameDefaultValue = "cae-app-";
    this.getProjectNameById();
    this.urlDefaultValue =
      "https://cae.tech4comp.dbis.rwth-aachen.de/deployment/";
    this.deploymentStatus = "setNotDeploying";
    this.requestUpdate().then((_) => {
      this.getDeployButton().disabled = false;
      this.getStatusInput().style.setProperty("display", "none");
      this.getDeployStatusTextarea().style.setProperty("display", "none");
      this.getOpenDeploymentLink().style.setProperty("display", "none");
    });
  }
  updated() {
    this.y.share.data.set("deploymentStatus", this.deploymentStatus);
    // this.checkIfApplicationIsDeploying();
  }
  ///
  ///
  ///
  ///
  ///
  testfunction() {
    this.updateDeployStatus("NOT DEPLOYED");
  }
  ///
  ///
  ///
  ///
  /**
   * Gets called by application-modeling.js when at least one commit exists (and code got generated)
   * and deployment can get started.
   */

  enableWidget() {
    this.getDeployButton().disabled = false;
  }

  _onDeployButtonClicked() {
    //check if  value of name is valid
    var validName = /^([a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*)$/.test(
      this.nameDefaultValue
    );
    if (validName == false) {
      console.log("Name invalid, only use low letters and -, _ if needed");
      this.showToast("Name invalid, only use low letters and -, _ if needed");
    } else {
      // disable button until deployment has finished
      this.getDeployButton().disabled = true;

      // show status input field and textarea for deployment status
      this.getStatusInput().style.removeProperty("display");

      // send deploy request
      this.getStatusInput().value = "Sending deploy request...";
      console.log();
      this.deployRequest("Build");
      console.log(Common.getVersionedModelId());
    }
  }

  deployRequest(jobAlias) {
    this.setDeploying();
    var pathname = window.location.pathname.split("/");
    fetch(
      Static.ModelPersistenceServiceURL +
        "/deploy/" +
        pathname[pathname.length - 1] +
        "/" +
        jobAlias,
      {
        method: "POST",
        body: `{"name":"${this.nameDefaultValue}","id":"${
          pathname[pathname.length - 1]
        }"}`,
      }
    )
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        if (data.indexOf("Error") > -1) {
          console.error(data);
        } else {
          this.getStatusInput().value = "Starting deployment";
          console.log("Deployment: Starting deployment");
          console.log("Deployment: Start polling job console text");
          this.pollJobConsoleText(data, jobAlias);
        }
      });
  }

  pollJobConsoleText(location, jobAlias) {
    this.getDeployStatusTextarea().removeAttribute("hidden");
    setTimeout(
      function () {
        var feedbackString =
          "Deployment in progess" + Array(this.pendingDots + 1).join(".");
        this.getStatusInput().value = feedbackString;
        console.log(feedbackString);
        this.getJobConsoleText(location, jobAlias);
      }.bind(this),
      1000
    );
  }

  getJobConsoleText(queueItem, jobAlias) {
    fetch(
      Static.ModelPersistenceServiceURL +
        "/deployStatus?queueItem=" +
        queueItem +
        "&jobAlias=" +
        jobAlias,
      {
        method: "GET",
      }
    )
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        if (data.indexOf("Pending") > -1) {
          data =
            jobAlias + " job pending" + Array(this.pendingDots + 1).join(".");
        }

        this.pendingDots = (this.pendingDots + 1) % 4;

        this.getDeployStatusTextarea().style.removeProperty("display");
        this.getDeployStatusTextarea().value = data;

        //$('#deploy-status').scrollTop($('#deploy-status')[0].scrollHeight);
        if (data.indexOf("Finished: SUCCESS") > -1) {
          switch (jobAlias) {
            case "Build":
              this.getStatusInput().value = "Building was successfully!";
              this.deployRequest("Docker");
              break;
            case "Docker":
              this.getStatusInput().value = "Application is now ready!";
              this.getDeployStatusTextarea().style.setProperty(
                "display",
                "none"
              );
              this.getOpenDeploymentLink().style.removeProperty("display");
              // allow to deploy again by activating the deploy button
              this.getDeployButton().disabled = false;
              break;
          }
        } else if (data.indexOf("Finished: FAILURE") > -1) {
          console.log("Deployment: Error during deployment!");
        } else {
          this.pollJobConsoleText(queueItem, jobAlias);
        }
      });
  }

  changeRoute() {
    this.set("route.path", "/test-deploy/" + Common.getVersionedModelId());
  }
  getDeployButton() {
    return this.shadowRoot.getElementById("deploy-model");
  }

  getDeployStatusTextarea() {
    return this.shadowRoot.getElementById("deploy-status");
  }

  getStatusInput() {
    return this.shadowRoot.getElementById("status");
  }

  getOpenDeploymentLink() {
    return this.shadowRoot.getElementById("open-deployment");
  }

  async getProjectNameById() {
    var pathname = window.location.pathname.split("/");
    var id = pathname[pathname.length - 1];
    var nameofProject = "";
    await fetch(` http://localhost:8081/project-management/projects/` + id, {
      method: "GET",
    })
      .then((response) => {
        console.log(response);
        return response.text();
      })
      .then((data) => {
        console.log(JSON.parse(data).name);
        nameofProject = JSON.parse(data).name;
        this.namespacePrefixDefaultValue = "cae-app-" + JSON.parse(data).name;
        // return JSON.parse(data).name;
      });
    this.projectName = nameofProject;
    console.log(nameofProject);
    this.requestUpdate();
    return nameofProject;
  }
  //
  async checkIfApplicationIsDeploying() {
    console.log("CHECKING");
    var pathname = window.location.pathname.split("/");
    await fetch(
      ` http://localhost:8081/CAE/checkDeployStatus/` +
        pathname[pathname.length - 1],
      // pathname[pathname.length - 1],
      {
        method: "POST",
      }
    )
      .then((response) => {
        console.log("RES");
        console.log(response);
        return response.text();
      })
      .then((data) => {
        console.log(data);
        if (data == "DEPLOYING") {
          this.setDeploying();
          console.log("OK DEPLOYING");
        } else if (data == "NOT DEPLOYED") {
          console.log("OK NOT DEPL");
          this.setNotDeploying();
        } else if (data == "DEPLOYED") {
          console.log("OK DEPLOYED");
          this.setAlreadyDeployed();
        }
      });
  }
  async updateDeployStatus(status) {
    console.log("TRYING UPDATE");
    var pathname = window.location.pathname.split("/");
    var id = pathname[pathname.length - 1];

    fetch(`http://localhost:8081/CAE/updateDeployStatus/` + id, {
      method: "POST",
      body: `{
          "name": "${this.nameDefaultValue}",
          "namespace": "default",
          "port": "${this.portDefaultValue}",
          "url": "${this.urlDefaultValue}",
          "status": "${status}"
        }`,
    })
      .then((response) => {
        console.log(response);
        return response.text();
      })
      .then((data) => {
        console.log(data);
      });
  }

  deleteDeployment() {
    console.log("TRYING TO DELETE");
    var pathname = window.location.pathname.split("/");
    var id = pathname[pathname.length - 1];

    fetch(`http://localhost:8081/CAE/deleteDeployment/` + id, {
      method: "POST",
      body: `{
          "name": "${this.nameDefaultValue}",
          "namespace": "default",
          "status": "${status}"
        }`,
    })
      .then((response) => {
        console.log(response);
        return response.text();
      })
      .then((data) => {
        console.log(data);
        this.showToast("Deleted deployment succesfully");
        // this.checkIfApplicationIsDeploying();
      });
  }

  setDeploying() {
    this.y.share.data.set("deploymentStatus", "setDeploying");
  }
  setAlreadyDeployed() {
    this.y.share.data.set("deploymentStatus", "setAlreadyDeployed");
  }
  setNotDeploying() {
    console.log("TRY TO NOT DEPL");
    this.y.share.data.set("deploymentStatus", "setNotDeploying");
  }
  showToast(text) {
    const toastElement = this.shadowRoot.getElementById("toast");
    toastElement.text = text;
    toastElement.show();
  }
}

window.customElements.define("test-deploy", TestDeploy);
