import {html, LitElement} from 'lit-element';
import './test-case';
import TestEditorYjsSync from './test-editor-yjs-sync';
import Static from '../static';
import Common from '../util/common';

class TestEditor extends LitElement {
    render() {
      return html`
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
      </head>
      <style>
        :host {
          font-family: Roboto;
        }
        .bordered {
          border-width: 2px;
          border-style: solid;
          border-color: #dddddd;
          overflow: hidden;
          height: 100% !important;
          display: flex;
          flex-flow: column;
        }
        .test-case-container {
            margin-left: 1em;
            margin-right: 1em;
        }
      </style>

      <div class="bordered">
        <h3>Test Editor</h3>
        <div class="separator"></div>

        <div style="display: flex">
          <div id="spinner-coverage" class="spinner-border text-primary" style="margin-left: auto; visibility: hidden">
            <span class="visually-hidden">Loading...</span>
          </div>
          <button id="button-coverage" type="button" class="btn btn-primary" @click=${this.onChangeCoverageVisibilityClicked} style="margin-left: 1em; margin-bottom: 0.5em">
            ${this.coverageVisible ? "Hide coverage" : "Show coverage"}
          </button>
          <button type="button" class="btn btn-primary" @click=${this.onAddTestClicked} style="margin-left: 1em; margin-right: 1em; margin-bottom: 0.5em">
            Add test
          </button>
        </div>

        <!-- Test Cases -->
        <div class="test-case-container" style="overflow: auto;">
          ${this.testData.testCases.map(testCase => html`
            <test-case testData=${JSON.stringify(testCase)} 
              availableAgents=${JSON.stringify(this.testData.agents)}
              @test-case-name-updated=${(e) => this.onTestCaseNameUpdated(testCase.id, e.detail)}
              @test-case-delete=${(e) => this.onTestCaseDelete(testCase.id)}
              @test-request-updated=${(e) => this.onTestRequestUpdated(testCase.id, e.detail.request)}
              @add-test-case-request=${(e) => this.onAddTestCaseRequest(testCase.id)}
              @test-request-delete=${(e) => this.onTestRequestDelete(e.detail.testCaseId, e.detail.requestId)}></test-case>
          `)}
        </div>
      </div>
      `;
    }

    static get properties() {
      return {
        coverageVisible: { type: Boolean }
      }
    };

    constructor() {
      super();
      this.coverageVisible = false;

      const agents = [
        {
          name: "Anonymous",
          type: "anonymous_agent",
          id: 0
        },
        {
          name: "Alice",
          type: "user_agent",
          id: 1
        },
        {
          name: "Bob",
          type: "user_agent",
          id: 2
        },
        {
          name: "Chris",
          type: "user_agent",
          id: 3
        }
      ];

      this.testData = {
        testCases: [],
        agents: agents
      }

      // wait for commits to be loaded
      this.waitForCommits();
    }

    updated() {
      this.shadowRoot.querySelectorAll("test-case").forEach(testCase => testCase.setYjsSync(this.yjsSync));
    }

    firstUpdated() {
      // listen for node selects in the model
      Y({
        db: {
          name: "memory" // store the shared data in memory
        },
        connector: this.getModelYjsRoomConnectorInfo(),
        share: {
          data: "Map",
          select: "Map"
        },
      }).then(function (y) {
        y.share.select.observe(function (event) {
          if (event.value) {
            // entity selected
            const entityId = event.value;

            // check if entity is a node
            const model = y.share.data.get("model");
            if(Object.keys(model.nodes).includes(entityId)) {
              // entity is a node
              const node = model.nodes[entityId];

              // check if node is HTTP Method
              if(node.type == "HTTP Method") {
                // get path
                const path = Object.values(node.attributes).find(attr => attr.name == "path").value.value;

                // notify test-request elements
                const event = new CustomEvent("path-selected", { detail: path });
                window.dispatchEvent(event);
              }
            }
          }
        }.bind(this));
      }.bind(this));
    }

    waitForCommits() {
      if(!parent.commits) {
        setTimeout(this.waitForCommits.bind(this), 500);
      } else {
        // get latest commit
        const latestCommit = parent.commits[0];
        const testCases = latestCommit.testModel.testCases;

        this.yjsSync = new TestEditorYjsSync(testCases, this.onYjsTestCaseUpdated.bind(this), this.onYjsTestCaseAdded.bind(this), this.onYjsTestCaseDeleted.bind(this), this.onInitialYjsSyncFinished.bind(this));
      }
    }

    onInitialYjsSyncFinished() {
      
      if(parent.intervalIdTestStatus) {
        clearInterval(parent.intervalIdTestStatus);
      }

      const intervalId = window.setInterval(function () {
        // get test status from GitHub Actions
        const repoName = localStorage.getItem("githubRepoName");
        const latestPushedCommit = parent.commits.length > 1 ? parent.commits[1] : parent.commits[0];
        const sha = latestPushedCommit.sha;
        let testModelId;
        if(latestPushedCommit.commitType == 1) {
          // code editor commit => no model contained
          // find latest commit with model
          for(const commit of parent.commits) {
            if(commit.commitType == 0) {
              testModelId = commit.testModel.id;
              break;
            }
          }
        } else {
          testModelId = latestPushedCommit.testModel.id;
        }

        const queryParams = {
          repoName: repoName,
          sha: sha
        };

        fetch(Static.ModelPersistenceServiceURL + "/testmodel/" + testModelId + "/status?" + new URLSearchParams(queryParams)).then(response => response.json()).then(data => {
          const testCasesWithStatus = data.testCases;
          for (const testCase of this.testData.testCases) {
            const testCaseWithStatus = testCasesWithStatus.find(t => t.id == testCase.id);
            if (testCaseWithStatus) {
              testCase.status = testCaseWithStatus.status;

              for (const request of testCase.requests) {
                const requestWithStatus = testCaseWithStatus.requests.find(r => r.id == request.id);

                if(requestWithStatus.lastResponse) {
                  request.lastResponse = requestWithStatus.lastResponse;
                }

                for (const assertion of request.assertions) {
                  // get status for assertion
                  if (requestWithStatus) {
                    const assertionWithStatus = requestWithStatus.assertions.find(a => a.id == assertion.id);
                    if (assertionWithStatus) {
                      assertion.status = assertionWithStatus.status;
                      if(assertion.status == "failed") {
                        assertion.errorMessage = assertionWithStatus.errorMessage;
                      } else {
                        delete assertion.errorMessage;
                      }
                    }
                  }
                }
              }

              this.yjsSync.updateTestCase(testCase);
            }
          }
        });
      }.bind(this), 15000);

      parent.intervalIdTestStatus = intervalId;
    }

    /**
     * Gets called by Yjs if a test case got updated in the Yjs room.
     * @param {*} updatedTestCase 
     */
    onYjsTestCaseUpdated(updatedTestCase) {
      const testCase = this.getTestCaseById(updatedTestCase.id);
      Object.keys(testCase).forEach(key => {
        testCase[key] = updatedTestCase[key];
      });
      this.requestUpdate();

      this.notifyVersioningSystem();
    }

    /**
     * Gets called by Yjs if a new test case got added in the Yjs room.
     * @param {*} newTestCase 
     */
    onYjsTestCaseAdded(newTestCase) {
      this.testData.testCases.push(newTestCase);
      this.requestUpdate();

      this.notifyVersioningSystem();
    }

    /**
     * Gets called by Yjs if a test case got deleted in the Yjs room.
     * @param {*} deletedTestCaseId Id of the test case that was deleted.
     */
    onYjsTestCaseDeleted(deletedTestCaseId) {
      this.testData.testCases = this.testData.testCases.filter(testCase => testCase.id.toString() !== deletedTestCaseId.toString());
      this.requestUpdate();

      this.notifyVersioningSystem();
    }

    /**
     * Notifies the versioning system about the current test model.
     */
    notifyVersioningSystem() {
      const currentTestModel = JSON.parse(JSON.stringify(this.yjsSync.getTestModelFromYjsRoom()));

      // remove assertions that have "editModeOn" flag
      currentTestModel.testCases.forEach(testCase => {
        testCase.requests.forEach(request => {
          request.assertions = request.assertions.filter(assertion => !Object.keys(assertion).includes("editModeOn"));
        });
      });

      // notify versioning system
      this.dispatchEvent(new CustomEvent("test-model-updated", {
        detail: {
          testModel: currentTestModel
        },
        bubbles: true,
        composed: true
      }));
    }

    /**
     * Gets called when the "Add test" button gets clicked.
     * Adds a new test case into the Yjs room.
     */
    onAddTestClicked() {
      this.yjsSync.addTestCase({
        id: Math.floor(Math.random() * 999999),
        name: "New Test Case",
        status: "undefined",
        requests: []
      });
    }

    /**
     * Gets called when the name of a test case got updated by the current user.
     * @param {Number} testCaseId Id of the test case where the name got updated.
     * @param {Object} eventDetail Event detail object containing the new name.
     */
    onTestCaseNameUpdated(testCaseId, eventDetail) {
      const testCase = this.getTestCaseById(testCaseId);
      testCase.name = eventDetail.newTestCaseName;
      this.yjsSync.updateTestCase(testCase);
    }

    /**
     * Event handler for the test-case-delete event.
     * Deletes the test case in the Yjs room.
     * @param {*} testCaseId Id of the test case that got deleted.
     */
    onTestCaseDelete(testCaseId) {
      this.yjsSync.deleteTestCase(testCaseId);
    }

    /**
     * Event handler for the test-request-updated event.
     * Updates the test request in the Yjs room.
     * @param {*} testCaseId Id of the test case that the request belongs to.
     * @param {*} requestData Updated request data.
     */
    onTestRequestUpdated(testCaseId, requestData) {
      this.yjsSync.updateTestRequest(testCaseId, requestData);
    }

    /**
     * Event handler for the add-test-case-request event.
     * Adds a new test request to the test case in the Yjs room.
     * @param {*} testCaseId Id of the test case where the request should be added to.
     */
    onAddTestCaseRequest(testCaseId) {
      this.yjsSync.addTestCaseRequest(testCaseId, {
        id: Math.floor(Math.random() * 999999),
        type: "GET",
        url: "/",
        auth: {},
        assertions: []
      });
    }

    /**
     * Event handler for the test-request-delete event.
     * Deletes the test request from the Yjs room.
     * @param {*} testCaseId Id of the test case that the request belongs to.
     * @param {*} requestId Id of the request that should be deleted.
     */
    onTestRequestDelete(testCaseId, requestId) {
      this.yjsSync.deleteTestRequest(testCaseId, requestId);
    }

    /**
     * Returns the test case with the given id.
     * @param {Number} testCaseId Id of the test case to get.
     * @returns Test case JSON object.
     */
    getTestCaseById(testCaseId) {
      return this.testData.testCases.find(testCase => testCase.id == testCaseId);
    }

    /**
     * Returns the test request with the given requestId from the test case with the given testCaseId.
     * @param {*} testCaseId Id of the test case that the request belongs to.
     * @param {*} requestId Id of the request to get.
     * @returns 
     */
    getRequestById(testCaseId, requestId) {
      return this.getTestCaseById(testCaseId).requests.find(request => request.id == requestId);
    }

    onChangeCoverageVisibilityClicked() {
      this.coverageVisible = !this.coverageVisible;
  
      if (this.coverageVisible) this.showTestCoverage();
      else this.unhighlightNodesInModel();
    }

    /**
     * Shows the test coverage in the model.
     */
    showTestCoverage() {
      this.shadowRoot.getElementById("spinner-coverage").style.visibility = "visible";
      this.shadowRoot.getElementById("button-coverage").disabled = true;

      const repoName = localStorage.getItem("githubRepoName");
      const latestPushedCommit = parent.commits.length > 1 ? parent.commits[1] : parent.commits[0];
      const sha = latestPushedCommit.sha;

      const queryParams = { repoName: repoName, sha: sha };

      Y({
        db: {
          name: "memory" // store the shared data in memory
        },
        connector: this.getModelYjsRoomConnectorInfo(),
        share: { // specify the shared content
          data: 'Map',
          canvas: 'Map'
        }
      }).then(function (y) {
        const model = y.share.data.get("model");

        // fetch API test coverage data
        fetch(Static.ModelPersistenceServiceURL + "/models/coverage?" + new URLSearchParams(queryParams), {
          method: "POST",
          body: JSON.stringify(model)
        }).then(response => response.json()).then(data => {
          // iterate over model nodes
          for (let nodeKey of Object.keys(data.nodes)) {
            const node = data.nodes[nodeKey];

            this.showNodeCoverageInfo(y, node, nodeKey);
          }

          this.shadowRoot.getElementById("spinner-coverage").style.visibility = "hidden";
          this.shadowRoot.getElementById("button-coverage").removeAttribute("disabled");

          // disconnect from the Yjs room
          setTimeout(_ => {
            y.connector.disconnect();
          }, 3000);
        });
      }.bind(this));
    }

    /**
     * Shows coverage info for the given node in the model, if available.
     */
    showNodeCoverageInfo(y, node, nodeKey) {
      // check if coverage info is available for this node
      if (node.attributes.coverage) {
        const coverage = node.attributes.coverage.value.value;
        const color = coverage == 100 ? "green" : "red";
        let label = this.getNodeTestCoverageLabel(node, coverage);

        // show coverage info in model
        y.share.canvas.set("highlight", {
          entities: [nodeKey],
          color: color,
          label: label,
          userId: Common.getUserInfo().sub,
          remote: false
        });
      }
    }

    /**
     * Returns the label with coverage info for the given node.
     */
    getNodeTestCoverageLabel(node, coverage) {
      let label = "Coverage: " + coverage;
      if (node.type == "HTTP Response") {
        label = coverage == 100 ? "covered" : "not covered";
      } else if (node.type == "HTTP Method") {
        label = coverage == 100 ? "Path covered" : "Path not covered";
      } else if (node.type == "HTTP Payload") {
        label = coverage == 100 ? "covered" : "not covered";
      }
      return label;
    }

    /**
     * Removes the highlighting of all nodes in the model.
     */
    unhighlightNodesInModel() {
      Y({
        db: {
          name: "memory" // store the shared data in memory
        },
        connector: this.getModelYjsRoomConnectorInfo(),
        share: { // specify the shared content
          data: 'Map',
          canvas: 'Map'
        }
      }).then(function (y) {
        const model = y.share.data.get("model");

        // unhighlight all nodes
        y.share.canvas.set("unhighlight", {
          entities: Object.keys(model.nodes),
          userId: Common.getUserInfo().sub,
          remote: false
        });

        // disconnect from the Yjs room
        setTimeout(_ => {
          y.connector.disconnect();
        }, 3000);
      });
    }

    /**
     * Returns the connector info for the Yjs room where the model is stored.
     * @returns Connector info for the Yjs room where the model is stored.
     */
    getModelYjsRoomConnectorInfo() {
      return {
        name: "websockets-client", // use the websockets connector
        room: Common.getYjsRoomNameForVersionedModel(Common.getVersionedModelId(), Common.isCurrentComponentDependency()),
        options: { resource: Static.YjsResourcePath },
        url: Static.YjsAddress
      };
    }
}

customElements.define('test-editor', TestEditor);