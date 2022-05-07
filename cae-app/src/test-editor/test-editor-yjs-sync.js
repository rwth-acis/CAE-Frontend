import Static from "../static";

export default class TestEditorYjsSync {
  constructor(testData, testCaseUpdated, testCaseAdded, testCaseDeleted) {
    const yjsRoomName = "test-room-versionedModel-1";

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
        testData: 'Map'
      },
      type: ["Map"]
    }).then(function (y) {
      console.log("test editor: yjs connected");
      this.y = y;

      // store current test data
      testData.forEach(testCase => {
        this.y.share.testData.set(testCase.id, testCase);
      });

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

    }.bind(this));
  }

  /**
   * Updates the given test case in the Yjs room.
   * @param {*} updatedTestCase Updated test case.
   */
  updateTestCase(updatedTestCase) {
    this.y.share.testData.set("" + updatedTestCase.id, updatedTestCase);
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
