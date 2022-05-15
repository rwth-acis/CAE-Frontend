import {html, LitElement} from 'lit-element';
import './test-case';
import TestEditorYjsSync from './test-editor-yjs-sync';

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
          <button type="button" class="btn btn-primary" @click=${this.onAddTestClicked} style="margin-left: auto; margin-right: 1em; margin-bottom: 0.5em">
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

    constructor() {
      super();

      // dummy data
      const testCases = [
        {
            id: 1,
            name: "Test Case 1",
            status: "success",
            requests: [
                {
                    id: 1,
                    type: "POST",
                    url: "/dishes/0/ratings",
                    auth: {
                      selectedAgent: 0
                    },
                    assertions: []
                }
            ]
        },
        {
            id: 2,
            name: "Test Case 2",
            status: "failed",
            requests: [
                {
                    id: 2,
                    type: "POST",
                    url: "/dishes/0/ratings",
                    auth: {
                      selectedAgent: 0
                    },
                    assertions: []
                },
                {
                    id: 3,
                    type: "GET",
                    url: "/dishes/0/ratings",
                    auth: {
                      selectedAgent: 1
                    },
                    assertions: []
                },
                {
                    id: 4,
                    type: "DELETE",
                    url: "/dishes/0/ratings",
                    auth: {},
                    assertions: []
                }
            ]
        },
        {
            id: 3,
            name: "Test Case 3",
            status: "undefined",
            requests: [
                {
                    id: 5,
                    type: "POST",
                    url: "/dishes/0/ratings",
                    auth: {},
                    assertions: [
                        {
                          id: 1,
                          status: "undefined",
                          assertionType: null,
                          editModeOn: true
                        },
                        {
                          id: 2,
                          status: "undefined",
                          assertionType: 1,
                          operator: {
                            id: 0,
                            input: {
                              id: 2
                            }
                          }
                        },
                        {
                          id: 3,
                          status: "undefined",
                          assertionType: 1,
                          operator: {
                            id: 1,
                            input: {
                              id: 1,
                              value: "userId"
                            },
                            followedBy: {
                              id: 0,
                              input: {
                                id: 4
                              }
                            }
                          }
                        }
                    ]
                }
            ]
        }
      ];

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
        testCases: testCases,
        agents: agents
      }

      this.yjsSync = new TestEditorYjsSync(this.testData.testCases, this.onYjsTestCaseUpdated.bind(this), this.onYjsTestCaseAdded.bind(this), this.onYjsTestCaseDeleted.bind(this));
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
    }

    /**
     * Gets called by Yjs if a new test case got added in the Yjs room.
     * @param {*} newTestCase 
     */
    onYjsTestCaseAdded(newTestCase) {
      this.testData.testCases.push(newTestCase);
      this.requestUpdate();
    }

    /**
     * Gets called by Yjs if a test case got deleted in the Yjs room.
     * @param {*} deletedTestCaseId Id of the test case that was deleted.
     */
    onYjsTestCaseDeleted(deletedTestCaseId) {
      this.testData.testCases = this.testData.testCases.filter(testCase => testCase.id.toString() !== deletedTestCaseId.toString());
      this.requestUpdate();
    }

    /**
     * Gets called when the "Add test" button gets clicked.
     * Adds a new test case into the Yjs room.
     */
    onAddTestClicked() {
      this.yjsSync.addTestCase({
        id: Math.random(10000,99999999),
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
        id: Math.random(10000,99999999),
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
}

customElements.define('test-editor', TestEditor);