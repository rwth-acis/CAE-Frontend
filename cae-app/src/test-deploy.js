import { LitElement, html } from "lit-element";
import "./versioning/versioning-element.js";
import Common from "./util/common.js";
import Static from "./static.js";
import "../node_modules/@polymer/iron-icon/iron-icon.js";
import { valid, clean, satisfies, gt, lt, coerce } from "es-semver";
import Auth from "./util/auth";
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
      <div id="Deployment">
        <div class="middle" style="display:flex">
          <div class="input-fields" style="flex-grow: 1;">
            <h4>Release your application</h4>
            <!-- Name -->
            <!-- <span class="textbox">
              <input
                type="text"
                id="country"
                name="country"
                value="${this.namespacePrefixDefaultValue}"
                readonly
              />
              <input
                id="nameDefaultValue"
                type="text"
                @input="${this.nameDefaultValueInput}"
                .value="${this.nameDefaultValue}"
              />
            </span> -->
            <!-- URL
            <input
              id="urlDefaultValue"
              type="text"
              @input="${this.urlDefaultValueInput}"
              .value="${this.urlDefaultValue}"
            /> -->
            <div style="display:flex; flex-direction: row;">
              <div style="display:flex; flex-direction: column;">
                <div>Existing Releases</div>
                <paper-dropdown-menu>
                  <paper-listbox slot="dropdown-content">
                    ${this.applicationReleases.map(
                      (release) =>
                        html`
                          <paper-item>${release.supplement.version}</paper-item>
                        `
                    )}
                  </paper-listbox>
                </paper-dropdown-menu>
              </div>
              <div style="display:flex; flex-direction: column;">
                <!-- <div id="version-number-div" style="display: show"> -->
                <div
                  id="semver-number-div"
                  style="display: flex; height: 2em; margin-top: 0.5em"
                >
                  <input
                    id="input-version-number-1"
                    type="number"
                    step="1"
                    min="0"
                    value="0"
                    class="input input-version-number"
                    style="width:40px"
                  />
                  <span style="margin-top: 0.85em">.</span>
                  <input
                    id="input-version-number-2"
                    type="number"
                    step="1"
                    min="0"
                    value="0"
                    class="input input-version-number"
                    style="width:40px"
                  />
                  <span style="margin-top: 0.85em">.</span>
                  <input
                    id="input-version-number-3"
                    type="number"
                    step="1"
                    min="1"
                    value="1"
                    class="input input-version-number"
                    style="width:40px"
                  />
                </div>
                <!-- </div> -->
                <paper-button
                  id="release-application"
                  @click=${this._onReleaseApplicationButtonClicked}
                  class="paper-button-blue"
                  >Release</paper-button
                >
              </div>
            </div>
          </div>
          <div style="flex-grow: 4;">
            <h4>Deploy a release</h4>

            <div>
              <div style="margin-right:20px;">
                Selected Release:
                <paper-dropdown-menu label="Select Release">
                  <paper-listbox slot="dropdown-content" id="mydropdown">
                    ${this.applicationReleases.map(
                      (release) =>
                        html`
                          <paper-item>${release.supplement.version}</paper-item>
                        `
                    )}
                  </paper-listbox>
                </paper-dropdown-menu>
              </div>
              <div style="display:flex; flex-direction: column; flex-grow: 4;">
                <div style="display:flex; flex-direction: column;">
                  Name
                  <span
                    class="textbox"
                    style="display:flex; flex-direction: row;"
                  >
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value="${this.namespacePrefixDefaultValue}"
                      readonly
                    />
                    <input
                      id="nameDefaultValue"
                      type="text"
                      @input="${this.nameDefaultValueInput}"
                      .value="${this.nameDefaultValue}"
                    />
                  </span>
                </div>
                <div style="display:flex; flex-direction: column;">
                  URL
                  <input
                    id="urlDefaultValue"
                    type="text"
                    @input="${this.urlDefaultValueInput}"
                    .value="${this.urlDefaultValue}"
                  />
                </div>
              </div>
            </div>
            <paper-button
              id="deploy-release"
              @click=${this._onDeployReleaseButtonClicked}
              class="paper-button-blue"
              >Deploy your release</paper-button
            >
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
      <paper-button @click=${this.testfunction}>HEHIEIH</paper-button>
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
      applicationName: {
        type: String,
      },
      applicationId: {
        type: String,
      },
      applicationReleases: {
        type: Array,
      },
      highestApplicationReleaseVersion: {
        type: String,
      },
      projectUsers: {
        type: Object,
      },
      deploymentStatus: {
        type: String,
      },
      wordList: {
        type: Array,
      },
      map: {
        type: String,
        observer: "_activeChanged",
      },
      y: {
        type: Object,
      },
      versionNumber1: {
        type: String,
      },
      versionNumber2: {
        type: String,
      },
      versionNumber3: {
        type: String,
      },
    };
  }
  showManagement() {
    this.releaseButtonStatus = "DEPLOYED";
    this.shadowRoot.getElementById("app").style.pointerEvents = "all";
  }
  showDeployment() {
    this.releaseButtonStatus = "DEPLOY";
    this.shadowRoot.getElementById("app").style.pointerEvents = "none";
  }
  showCheckNameAvailable() {
    this.releaseButtonStatus = "Check name availability";
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
    var pathname = window.location.pathname.split("/");
    super();
    this.wordList = this.returnWordList();
    self = this;
    // setInterval(function () {
    //   self.checkIfApplicationIsDeploying();
    //   console.log("djsndjnsknjkds");
    // }, 5000);
    Y({
      db: {
        name: "memory",
      },
      connector: {
        name: "websockets-client",
        room: pathname[pathname.length - 1],
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
            self.deployButtonStatus = "DEPLOY";
            self.deploymentStatus = "setDeploying";
            self.getDeployButton().disabled = true;
            self.shadowRoot.getElementById("nameDefaultValue").disabled = true;
            self.shadowRoot.getElementById("urlDefaultValue").disabled = true;
          } else if (event.value == "setNotDeploying") {
            self.deploymentStatus = "setNotDeploying";
            self.getDeployButton().disabled = false;
            self.shadowRoot.getElementById("nameDefaultValue").disabled = false;
            self.shadowRoot.getElementById("urlDefaultValue").disabled = false;
            self.showDeployment();
          } else if (event.value == "setAlreadyDeployed") {
            self.deploymentStatus = "setAlreadyDeployed";
            self.getDeployButton().disabled = true;
            self.shadowRoot.getElementById("nameDefaultValue").disabled = true;
            self.shadowRoot.getElementById("urlDefaultValue").disabled = true;
            self.showManagement();
          } else if (event.value == "setCheckNameAvailable") {
            self.deploymentStatus = "setCheckNameAvailable";
            self.getDeployButton().disabled = false;
            self.shadowRoot.getElementById("nameDefaultValue").disabled = false;
            self.shadowRoot.getElementById("urlDefaultValue").disabled = false;
            self.showCheckNameAvailable();
          }
        }
      });
    });
    this.applicationReleases = [];
    this.highestApplicationReleaseVersion = "0.0.1";
    this.pendingDots = 0;
    this.nameDefaultValue =
      this.wordList[Math.floor(Math.random() * this.wordList.length)] +
      "-" +
      this.wordList[Math.floor(Math.random() * this.wordList.length)];
    this.getProjectInfo();
    this.urlDefaultValue =
      "https://cae.tech4comp.dbis.rwth-aachen.de/deployment/";
    this.deploymentStatus = "setNotDeploying";
    this.versionNumber1 = "0";
    this.versionNumber2 = "0";
    this.versionNumber3 = "1";

    this.requestUpdate().then((_) => {
      this.getReleaseButton().disabled = false;
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
    this.setNotReleasing();
    console.log(this.getProjectInfo());
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
    this.getReleaseButton().disabled = false;
  }
  async _getReleasesOfApplication() {
    var allServices = [];
    var releaseVersions = [];
    await fetch("http://localhost:8012/las2peer/services/services", {
      method: "GET",
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        allServices = data;
      });
    allServices.forEach((service) => {
      Object.keys(service.releases).forEach((releaseVersion) => {
        if (
          service.releases[releaseVersion].supplement.name ==
            "cae-app-" + this.projectName &&
          service.releases[releaseVersion].supplement.id ==
            this.applicationId &&
          service.releases[releaseVersion].supplement.type == "cae-application"
        ) {
          releaseVersions.push(releaseVersion);
          this.applicationReleases.push(service.releases[releaseVersion]);
        }
      });
    });
    releaseVersions.forEach((version) => {
      if (gt(version, this.highestApplicationReleaseVersion)) {
        this.highestApplicationReleaseVersion = version;
      }
    });
    var highestVersion = this.highestApplicationReleaseVersion.split(".");
    this.setEnteredVersion(
      highestVersion[0],
      highestVersion[1],
      highestVersion[2]
    );
    this.requestUpdate();
  }

  async checkIfVersionValid() {
    var allServices = [];
    var releaseVersions = [];
    await fetch("http://localhost:8012/las2peer/services/services", {
      method: "GET",
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        allServices = data;
      });
    allServices.forEach((service) => {
      Object.keys(service.releases).forEach((releaseVersion) => {
        if (
          service.releases[releaseVersion].supplement.name ==
            "cae-app-" + this.projectName &&
          service.releases[releaseVersion].supplement.id ==
            this.applicationId &&
          service.releases[releaseVersion].supplement.type == "cae-application"
        ) {
          releaseVersions.push(releaseVersion);
        }
      });
    });
    releaseVersions.forEach((version) => {
      if (gt(version, this.highestApplicationReleaseVersion)) {
        this.highestApplicationReleaseVersion = version;
      }
    });

    var currentVersion =
      this.getVersionNumberInput(1).value +
      "." +
      this.getVersionNumberInput(2).value +
      "." +
      this.getVersionNumberInput(3).value;
    var versionNumberValid = await gt(
      currentVersion,
      this.highestApplicationReleaseVersion
    );
    if (!versionNumberValid) {
      this.showToast(
        "Version should be higher than " + this.highestApplicationReleaseVersion
      );
      return false;
    } else {
      return true;
    }
  }
  getVersionNumberInput(part) {
    return this.shadowRoot.getElementById("input-version-number-" + part);
  }

  setEnteredVersion(major, minor, patch) {
    this.getVersionNumberInput(1).value = major;
    this.getVersionNumberInput(2).value = minor;
    this.getVersionNumberInput(3).value = patch;
  }

  getVersion() {
    return (
      this.getVersionNumberInput(1).value +
      "." +
      this.getVersionNumberInput(2).value +
      "." +
      this.getVersionNumberInput(3).value
    );
  }
  _toHumanDate(epochSeconds) {
    return new Date(epochSeconds * 1000).toLocaleString();
  }
  async checkIfNameAvailable() {
    this.setCheckNameAvailable();
    var services = [];
    await fetch("http://localhost:8012/las2peer/services/services", {
      method: "GET",
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        services = data;
      });
    var nameAvailable = true;
    await services.forEach((service) => {
      if (
        service.name.normalize() ==
        (
          this.namespacePrefixDefaultValue.normalize() +
          this.nameDefaultValue.normalize()
        ).normalize()
      ) {
        nameAvailable = false;
      }
    });
    return nameAvailable;
  }

  async checkIfDeploymentNameAvailable() {
    var deployments = [];
    await fetch("http://localhost:8012/las2peer/services/deployments", {
      method: "GET",
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        deployments = data;
      });
    var nameAvailable = true;
    Object.keys(deployments).forEach((release) => {
      deployments[release].forEach((deployment) => {
        if (
          deployment.clusterName.normalize() ==
          this.namespacePrefixDefaultValue.normalize() +
            "-" +
            +this.nameDefaultValue.normalize()
        ) {
          nameAvailable = false;
        }
      });
    });
    return nameAvailable;
  }

  async _onReleaseApplicationButtonClicked() {
    var releaseNameAvailable = true;
    releaseNameAvailable = await this.checkIfNameAvailable();

    var versionValid = true;
    versionValid = await this.checkIfVersionValid();

    if (versionValid == true) {
      if (releaseNameAvailable == true) {
        // disable button until release has finished
        this.getReleaseButton().disabled = true;

        // show status input field and textarea for deployment status
        this.getStatusInput().style.removeProperty("display");
        // send deploy request
        this.getStatusInput().value = "Releasing CAE application ...";
        this.releaseRequest("Build");
      } else {
        this.setNotReleasing();
        this.showToast("Name already taken, choose another one");
      }
    } else {
      this.setNotReleasing();
    }
  }

  async _onDeployReleaseButtonClicked() {
    var deployNameAvailable = true;
    deployNameAvailable = await this.checkIfDeploymentNameAvailable();

    if (deployNameAvailable == true) {
      // disable button until release has finished
      // this.getDeploymentButton().disabled = true;

      // show status input field and textarea for deployment status
      this.getStatusInput().style.removeProperty("display");
      // send deploy request
      this.getStatusInput().value = "Releasing CAE application ...";
      console.log("shoudl deploy");
    } else {
      this.setNotDeploying();
      this.showToast("Name already taken, choose another one");
    }
  }

  async _onReleaseApplicationButtonClickedOLD() {
    //check if  value of name is valid
    var validName = /^([a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*)$/.test(
      this.namespacePrefixDefaultValue
    );
    if (validName == false) {
      console.log("Name invalid, only use low letters and -, _ if needed");
      this.showToast("Name invalid, only use low letters and -, _ if needed");
    } else {
      var nameAvailable = true;
      nameAvailable = await this.checkIfNameAvailable();
      var versionValid = true;
      versionValid = await this.checkIfVersionValid();
      if (versionValid == true) {
        if (nameAvailable == true) {
          // disable button until deployment has finished
          this.getReleaseButton().disabled = true;

          // show status input field and textarea for deployment status
          this.getStatusInput().style.removeProperty("display");
          // send deploy request
          this.getStatusInput().value = "Sending deploy request...";

          this.releaseRequest("Build");
        } else {
          this.setNotReleasing();
          this.showToast("Name already taken, choose another one");
        }
      } else {
        this.setNotReleasing();
      }
    }
  }

  releaseRequest(jobAlias) {
    this.setDeploying();
    var pathname = window.location.pathname.split("/");
    console.log(Auth.getAuthHeader()["Authorization"].split(" ")[1]);
    var aut = Auth.getAuthHeader()["Authorization"].split(" ")[1];
    fetch(
      Static.ModelPersistenceServiceURL +
        "/deploy/" +
        pathname[pathname.length - 1] +
        "/" +
        jobAlias,
      {
        method: "POST",
        body: `{"name":"${this.namespacePrefixDefaultValue}","id":"${
          pathname[pathname.length - 1]
        }","deployStatus":"DEPLOYING","Authorization":"${aut}","version":"${this.getVersion()}","type":"cae-application"}`,
      }
    )
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        if (data.indexOf("Error") > -1) {
          console.error(data);
        } else {
          this.updateDeployStatus("DEPLOYING");
          this.getStatusInput().value = "Starting release";
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
          "Release in progress" + Array(this.pendingDots + 1).join(".");
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
              this.releaseRequest("Docker");
              break;
            case "Docker":
              this.getStatusInput().value =
                "Your CAE application has been released";
              this.getDeployStatusTextarea().style.setProperty(
                "display",
                "none"
              );
              this.getOpenDeploymentLink().style.removeProperty("display");
              // allow to deploy again by activating the deploy button
              this.getReleaseButton().disabled = false;
              break;
          }
        } else if (data.indexOf("Finished: FAILURE") > -1) {
          console.log("Deployment: Error during release!");
        } else {
          this.pollJobConsoleText(queueItem, jobAlias);
        }
      });
  }

  changeRoute() {
    this.set("route.path", "/test-deploy/" + Common.getVersionedModelId());
  }
  getReleaseButton() {
    return this.shadowRoot.getElementById("release-application");
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

  async getProjectInfo() {
    var pathname = window.location.pathname.split("/");
    var id = pathname[pathname.length - 1];
    this.applicationId = String(id);
    var nameofProject = "";
    var users = [];
    this.namespacePrefixDefaultValue = "cae-app-" + "projectName";
    var selectedProject;

    await fetch(` http://localhost:8081/project-management/projects`, {
      method: "GET",
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        data.forEach((project) => {
          project.components.forEach((component) => {
            if (component.id == id) {
              selectedProject = project;
            }
          });
        });
      });
    console.log(selectedProject);

    // await fetch(` http://localhost:8081/project-management/projects/` + id, {
    //   method: "GET",
    // })
    //   .then((response) => {
    //     return response.text();
    //   })
    //   .then((data) => {
    //     nameofProject = JSON.parse(data).name;
    //     users = JSON.parse(data).users;

    //     this.namespacePrefixDefaultValue =
    //       "cae-app-" + JSON.parse(data).name + "-";
    //     // return JSON.parse(data).name;
    //   });
    // this.projectUsers = [];
    // for (let index = 0; index < users.length; index++) {
    //   this.projectUsers.push(users[index].loginName);
    // }

    this.projectName = selectedProject.name;
    nameofProject = selectedProject.name;
    this.namespacePrefixDefaultValue = "cae-app-" + this.projectName;

    console.log(this.projectName);
    console.log(nameofProject);
    await this._getReleasesOfApplication();
    this.requestUpdate();
    return nameofProject;
  }
  //
  async checkIfApplicationIsDeploying() {
    var pathname = window.location.pathname.split("/");
    await fetch(
      // `http://localhost:8012/las2peer/services/deployments`,
      Static.ModelPersistenceServiceURL + `/checkDeployStatus`,
      // pathname[pathname.length - 1],
      {
        method: "POST",
        body: `{"name":"${
          this.namespacePrefixDefaultValue + this.nameDefaultValue
        }","id":"${pathname[pathname.length - 1]}","author": "[${
          this.projectUsers
        }]" ,"statusUpdate":"DEPLOYING"}`,
      }
    )
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        console.log(data);
        // var deployments = JSON.parse(data.toString());
        var inf = data;
        // Object.keys(deployments).forEach((item) => {
        //   if (
        //     item ==
        //     this.namespacePrefixDefaultValue + this.nameDefaultValue
        //   ) {
        //     inf = "DEPLOYING";
        //   } else {
        //     inf = "NOT DEPLOYED";
        //   }
        // });
        if (inf == "DEPLOYING") {
          this.setDeploying();
          console.log("OK DEPLOYING");
        } else if (inf == "NOT DEPLOYED") {
          console.log("OK NOT DEPL");
          this.setNotReleasing();
        } else if (inf == "DEPLOYED") {
          console.log("OK DEPLOYED");
          this.setAlreadyDeployed();
        } else if (inf == "") {
          console.log("OK NOT DEPLOYED");
          this.setNotReleasing();
        }
      });
  }
  async updateDeployStatus(statusUpdate) {
    var pathname = window.location.pathname.split("/");
    var id = pathname[pathname.length - 1];

    fetch(`http://localhost:8081/CAE/updateDeployStatus`, {
      method: "POST",
      body: `{
          "name": "${this.namespacePrefixDefaultValue + this.nameDefaultValue}",
          "namespace": "default",
          "port": "${this.portDefaultValue}",
          "url": "${this.urlDefaultValue}",
          "statusUpdate": "${statusUpdate}",
          "id":"${id}"
        }`,
    })
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        console.log("UPDATE DATA");
        console.log(data);
      });
  }

  deleteDeployment() {
    var pathname = window.location.pathname.split("/");
    var id = pathname[pathname.length - 1];

    fetch(`http://localhost:8081/CAE/deleteDeployment/`, {
      method: "POST",
      body: `{"name":"${
        this.namespacePrefixDefaultValue + this.nameDefaultValue
      }","id":"${pathname[pathname.length - 1]}","author": "[${
        this.projectUsers
      }]" ,"deployStatus":"DELETED"}`,
    })
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        // this.updateDeployStatus("NOT DEPLOYED");
        this.showToast("Deleted deployment successfully");
      });
  }

  setDeploying() {
    this.y.share.data.set("deploymentStatus", "setDeploying");
  }
  setCheckNameAvailable() {
    this.y.share.data.set("deploymentStatus", "setCheckNameAvailable");
  }
  setAlreadyDeployed() {
    this.y.share.data.set("deploymentStatus", "setAlreadyDeployed");
  }
  setNotReleasing() {
    this.y.share.data.set("deploymentStatus", "setNotDeploying");
  }
  showToast(text) {
    const toastElement = this.shadowRoot.getElementById("toast");
    toastElement.text = text;
    toastElement.show();
  }

  returnWordList() {
    return [
      "chug",
      "port",
      "agal",
      "redo",
      "esth",
      "goon",
      "hopi",
      "conn",
      "vico",
      "dime",
      "hols",
      "dual",
      "juba",
      "slut",
      "safi",
      "puca",
      "yodh",
      "dyke",
      "exam",
      "prov",
      "brim",
      "boob",
      "math",
      "coed",
      "heal",
      "zeta",
      "bias",
      "napa",
      "heap",
      "stew",
      "pair",
      "chem",
      "guns",
      "ceyx",
      "glyn",
      "bard",
      "hall",
      "loun",
      "rote",
      "axle",
      "yean",
      "kung",
      "pale",
      "mage",
      "ymha",
      "purr",
      "cast",
      "ivar",
      "lion",
      "fyke",
      "ache",
      "thor",
      "quod",
      "genl",
      "sect",
      "tana",
      "prut",
      "wait",
      "send",
      "frug",
      "form",
      "bury",
      "raff",
      "cohn",
      "clea",
      "alar",
      "conk",
      "rego",
      "nysa",
      "cete",
      "gybe",
      "auto",
      "mina",
      "oryx",
      "lati",
      "hone",
      "nurl",
      "lalu",
      "lean",
      "idly",
      "nave",
      "poon",
      "alfa",
      "sour",
      "zond",
      "alep",
      "sage",
      "greg",
      "opus",
      "ibis",
      "laic",
      "pier",
      "crow",
      "cove",
      "tike",
      "nerc",
      "glob",
      "jamb",
      "atys",
      "dita",
    ];
  }
}

window.customElements.define("test-deploy", TestDeploy);
