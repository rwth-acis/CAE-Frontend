import Static from "../static";
import Common from "../util/common";

export default class TestEditorYjsSync {
  constructor(testData, testCaseUpdated, testCaseAdded, testCaseDeleted, initialSyncFinished) {
    const yjsRoomName = Common.getYjsRoomNameForVersionedTestModel();

    Y({
      db: {
        name: "memory" // store the shared data in memory
      },
      connector: {
        name: "websockets-client", // use the websockets connector
        room: yjsRoomName,
        options: { resource: Static.YjsResourcePath },
        url: Static.YjsAddress
      },
      share: { // specify the shared content
        testData: 'Map',
        requestBody: 'Map'
      },
      type: ["Map", "Text"]
    }).then(function (y) {
      console.log("test editor: yjs connected");
      this.y = y;

      this.y.share.testData.observe(event => {
        const testCaseId = "" + event.name;
        const type = event.type;
        const testCase = this.y.share.testData.get(testCaseId);

        if(type === "add") {
          testCaseAdded(testCase);
        } else if(type === "update") {
          testCaseUpdated(testCase);
        } else if(type === "delete") {
          testCaseDeleted(testCaseId);
        }
      });

      // check if test model is available in yjs room
      if(this.y.share.testData.keys().length == 0) {
        // no test cases found
        if(testData.length > 0) {
          // latest commit included test cases
          // put them into the yjs room
          testData.forEach(testCase => {
            this.y.share.testData.set(testCase.id, testCase);
          });
        }
      } else {
        // test model is available in yjs room
        for(let key of this.y.share.testData.keys()) {
          testCaseAdded(this.y.share.testData.get(key));
        }
      }

      initialSyncFinished();

    }.bind(this));
  }

  getTestModelFromYjsRoom() {
    const testData = {};
    const testCases = [];
    for(let key of this.y.share.testData.keys()) {
      const testCase = JSON.parse(JSON.stringify(this.y.share.testData.get(key)));
      // iterate through all requests
      for(let request of testCase.requests) {
        const bodyKey = testCase.id + "-" + request.id;
        // check if body is shared in Yjs room
        if(this.y.share.requestBody.keys().includes(bodyKey)) {
          // body is shared in Yjs room
          request.body = this.y.share.requestBody.get(bodyKey).toString();
        }
      }
      testCases.push(testCase);
    }
    testData.testCases = testCases;

    return testData;
  }

  /**
   * Binds the code mirror editor for the request body to a Yjs text.
   * @param {*} testCaseId Id of the test case, that the request belongs to.
   * @param {*} requestId Id of the request.
   * @param {*} editor CodeMirror code editor.
   */
  bindRequestBodyCodeMirror(testCaseId, requestId, editor) {
    const key = testCaseId + "-" + requestId;
    if(!this.y.share.requestBody.keys().includes(key)) {
      this.y.share.requestBody.set(key, Y.Text);
    }

    this.y.share.requestBody.get(key).bindCodeMirror(editor);
    this.y.share.requestBody.get(key).observe(this.requestBodyObserver.bind(this, testCaseId, requestId));
  }

  unbindRequestBodyCodeMirror(testCaseId, requestId, editor) {
    const key = testCaseId + "-" + requestId;
    this.y.share.requestBody.get(key).unbindCodeMirror(editor);
    this.y.share.requestBody.get(key).unobserve(this.requestBodyObserver.bind(this, testCaseId, requestId));
  }

  requestBodyObserver(testCaseId, requestId, event) {
    const key = testCaseId + "-" + requestId;
    const body = this.y.share.requestBody.get(key).toString();
    const testCase = this.y.share.testData.get("" + testCaseId)
    testCase.requests.find(request => request.id == requestId).body = body;
    this.y.share.testData.set("" + testCaseId, testCase);
  }

  /**
   * Updates the given test case in the Yjs room.
   * @param {*} updatedTestCase Updated test case.
   */
  updateTestCase(updatedTestCase) {
    this.y.share.testData.set("" + updatedTestCase.id, updatedTestCase);
  }

  prepareRequestBodyYTexts(testCase) {
    for(const request of testCase.requests) {
      const key = testCase.id + "-" + request.id;
      if(!this.y.share.requestBody.keys().includes(key)) {
        this.y.share.requestBody.set(key, Y.Text);
        this.y.share.requestBody.get(key).insert(0, request.body);
      }
    }
  }

  /**
   * Adds the given test case into the Yjs room.
   * @param {*} newTestCase New test case that should be added to the Yjs room.
   */
  addTestCase(newTestCase) {
    this.y.share.testData.set("" + newTestCase.id, newTestCase);
  }

  /**
   * Deletes the test case with the given id from the Yjs room.
   * @param {*} testCaseId Id of the test case that should be deleted.
   */
  deleteTestCase(testCaseId) {
    this.y.share.testData.delete("" + testCaseId);
  }

  /**
   * Adds the given request to the test case with the given testCaseId in the Yjs room.
   * @param {*} testCaseId Id of the test case that the request should be added to.
   * @param {*} requestData Request that should be added to the test case.
   */
  addTestCaseRequest(testCaseId, requestData) {
    const testCase = this.y.share.testData.get("" + testCaseId);
    testCase.requests.push(requestData);
    this.y.share.testData.set("" + testCaseId, testCase);
  }

  /**
   * Deletes the test request with the given id from the test case with the given testCaseId in the Yjs room.
   * @param {*} testCaseId Id of the test case that the request belongs to.
   * @param {*} requestId Id of the request that should be deleted.
   */
  deleteTestRequest(testCaseId, requestId) {
    // get test case from Yjs room
    const testCase = this.y.share.testData.get("" + testCaseId);
    // find index of request
    const index = testCase.requests.findIndex(request => request.id === requestId);
    // delete request from Yjs room
    testCase.requests.splice(index, 1);
    this.y.share.testData.set("" + testCaseId, testCase);
  }

  /**
   * Updates the given test request corresponding to the test case with the given testCaseId in the Yjs room.
   * @param {*} testCaseId Id of the test case that the request belongs to.
   * @param {*} requestData Updated request data.
   */
  updateTestRequest(testCaseId, requestData) {
    // get test case from Yjs room
    const testCase = this.y.share.testData.get("" + testCaseId);
    // find index of request
    const index = testCase.requests.findIndex(request => request.id === requestData.id);
    // update request in Yjs room
    testCase.requests[index] = requestData;
    this.y.share.testData.set("" + testCaseId, testCase);
  }
}
