import TestModelDifference from "./test-model-difference";
import TestCaseAddition from "./test/test-case-addition";
import TestCaseDeletion from "./test/test-case-deletion";
import TestCaseUpdate from "./test/test-case-update";
import TestCaseDifference from "./test/test-case-difference";
import RequestDifference from "./test/request-difference";
import RequestAddition from "./test/request-addition";
import RequestDeletion from "./test/request-deletion";
import RequestUpdate from "./test/request-update";
import AssertionDifference from "./test/assertion-difference";
import AssertionAddition from "./test/assertion-addition";
import AssertionDeletion from "./test/assertion-deletion";

/**
 * Class used for calculating the differences between two versions of a test model.
 */
export default class TestModelDifferencing {

  /**
   * Calculates the differences between the given test case lists.
   * Note: model2TestCases gets used as the "newer" one.
   * @param {*} model1TestCases List of test cases from the old test model.
   * @param {*} model2TestCases List of test cases from the updated test model.
   * @returns List of differences between the two given test case lists.
   */
  static getDifferences(model1TestCases, model2TestCases) {
    let differences = [];

    // test case changes
    differences = differences.concat(TestModelDifferencing.getTestCaseAdditions(model1TestCases, model2TestCases));
    differences = differences.concat(TestModelDifferencing.getTestCaseDeletions(model1TestCases, model2TestCases));
    differences = differences.concat(TestModelDifferencing.getUpdatedTestCases(model1TestCases, model2TestCases));

    // request changes
    differences = differences.concat(TestModelDifferencing.getRequestAdditions(model1TestCases, model2TestCases));
    differences = differences.concat(TestModelDifferencing.getRequestDeletions(model1TestCases, model2TestCases));
    differences = differences.concat(TestModelDifferencing.getUpdatedRequests(model1TestCases, model2TestCases));

    // assertion changes
    differences = differences.concat(TestModelDifferencing.getAssertionAdditions(model1TestCases, model2TestCases));
    differences = differences.concat(TestModelDifferencing.getAssertionDeletions(model1TestCases, model2TestCases));

    return differences;
  }

  /**
   * Calculates the changes that were applied to the given test case list (compared to an empty list).
   * @param {*} model2TestCases List of the test cases from the current test model state.
   * @returns List of differences between the given test case list and an empty list.
   */
  static getDifferencesOfSingleModel(model2TestCases) {
    return this.getDifferences([], model2TestCases);
  }

  /**
   * Applies the given differences to the given test model.
   * @param {*} modelStart Test model to apply the differences to.
   * @param {*} differences Differences that should be applied to the test model.
   * @returns Updated test model.
   */
  static createTestModelFromDifferences(modelStart, differences) {
    modelStart = JSON.parse(JSON.stringify(modelStart));
    // apply differences to modelStart, i.e. to the previous stored model
    for(let difference of differences) {
      // only apply differences to the test model (not the model itself)
      if(difference instanceof TestModelDifference) {
        difference.applyToTestModel(modelStart);
      }
    }

    return modelStart;
  }

  /**
   * Searches for test cases that got added to the test model.
   * @param {*} model1TestCases Previous state of the test case list.
   * @param {*} model2TestCases Current state of the test case list.
   * @returns List of TestCaseAddition objects.
   */
  static getTestCaseAdditions(model1TestCases, model2TestCases) {
    const additions = [];
    for(let testCase of model2TestCases) {
      // check if test case already exists in model1
      if(!model1TestCases.find(testCase1 => testCase1.id == testCase.id)) {
        additions.push(new TestCaseAddition(testCase));
      }
    }
    return additions;
  }

  /**
   * Searches for requests that got added to a test case.
   * @param {*} model1TestCases Previous state of the test case list.
   * @param {*} model2TestCases Current state of the test case list.
   * @returns List of RequestAddition objects.
   */
  static getRequestAdditions(model1TestCases, model2TestCases) {
    const testCaseAdditions = TestModelDifferencing.getTestCaseAdditions(model1TestCases, model2TestCases);
    const requestAdditions = [];

    for(let testCase of model2TestCases) {
      // check if test case was added => then we do not take the requests into account
      const testCaseAddition = testCaseAdditions.find(t => t.updatedTestCase.id == testCase.id);
      if(!testCaseAddition) {
        // test case was not added, so check if its requests were updated
        const oldTestCase = model1TestCases.find(t => t.id == testCase.id);
        for(let request of testCase.requests) {
          if(!oldTestCase.requests.find(r => r.id == request.id)) {
            // this request was added
            requestAdditions.push(new RequestAddition(request, testCase));
          }
        }
      }
    }

    return requestAdditions;
  }

  /**
   * Searches for assertions that got added to a request.
   * @param {*} model1TestCases Previous state of the test case list.
   * @param {*} model2TestCases Current state of the test case list.
   * @returns List of AssertionAddition objects.
   */
  static getAssertionAdditions(model1TestCases, model2TestCases) {
    const additions = [];

    for(let testCase of model2TestCases) {
      // check if test case already existed in model1
      const oldTestCase = model1TestCases.find(testCase1 => testCase1.id == testCase.id);
      if(oldTestCase) {
        // test case exists in both model versions
        for(let request of testCase.requests) {
          // check if request already existed in oldTestCase
          const oldRequest = oldTestCase.requests.find(r => r.id == request.id);
          if(oldRequest) {
            // request exists in both model versions
            for(let assertion of request.assertions) {
              // check if assertion already existed in oldRequest
              const oldAssertion = oldRequest.assertions.find(a => a.id == assertion.id);
              if(!oldAssertion) {
                // assertion was added
                additions.push(new AssertionAddition(assertion, request, testCase));
              }
            }
          }
        }
      }
    }

    return additions;
  }

  /**
   * Searches for test cases that got removed from the test model.
   * @param {*} model1TestCases Previous state of the test case list.
   * @param {*} model2TestCases Current state of the test case list.
   * @returns List of TestCaseDeletion objects.
   */
  static getTestCaseDeletions(model1TestCases, model2TestCases) {
    const deletions = [];
    for(let testCase of model1TestCases) {
      // check if test case got removed in model2
      if(!model2TestCases.find(testCase2 => testCase2.id == testCase.id)) {
        deletions.push(new TestCaseDeletion(testCase));
      }
    }
    return deletions;
  }

  /**
   * Searches for requests that got removed from a test case.
   * @param {*} model1TestCases Previous state of the test case list.
   * @param {*} model2TestCases Current state of the test case list.
   * @returns List of RequestDeletion objects.
   */
  static getRequestDeletions(model1TestCases, model2TestCases) {
    // deleted test cases do not need to be taken into account
    const deletions = [];
    for(let testCase of model2TestCases) {
      // check if test case already existed in model1
      const oldTestCase = model1TestCases.find(t => t.id == testCase.id);
      if(oldTestCase) {
        // test case already existed in model1
        // check if a request got removed
        for(let request of oldTestCase.requests) {
          if(!testCase.requests.find(r => r.id == request.id)) {
            // this request got removed
            deletions.push(new RequestDeletion(request, testCase));
          }
        }
      }
    }
    return deletions;
  }

  /**
   * Searches for assertions that got removed from a request.
   * @param {*} model1TestCases Previous state of the test case list.
   * @param {*} model2TestCases Current state of the test case list.
   * @returns List of AssertionDeletion objects.
   */
  static getAssertionDeletions(model1TestCases, model2TestCases) {
    const deletions = [];

    for(let testCase of model2TestCases) {
      // check if test case already existed in model1
      const oldTestCase = model1TestCases.find(testCase1 => testCase1.id == testCase.id);
      if(oldTestCase) {
        // test case exists in both model versions
        for(let request of testCase.requests) {
          // check if request already existed in oldTestCase
          const oldRequest = oldTestCase.requests.find(r => r.id == request.id);
          if(oldRequest) {
            // request exists in both model versions
            for(let assertion of oldRequest.assertions) {
              // check if assertion got removed
              const updatedAssertion = request.assertions.find(a => a.id == assertion.id);
              if(!updatedAssertion) {
                // assertion was removed
                deletions.push(new AssertionDeletion(assertion, request, testCase));
              }
            }
          }
        }
      }
    }

    return deletions;
  }

  /**
   * Searches for test cases that are included in both lists but got updated.
   * @param {*} model1TestCases Previous state of the test case list.
   * @param {*} model2TestCases Current state of the test case list.
   * @returns List of TestCaseUpdate objects.
   */
  static getUpdatedTestCases(model1TestCases, model2TestCases) {
    const updatedTestCases = [];

    // check for test cases which are part of both lists
    for(let testCase1 of model1TestCases) {
      const testCase2 = model2TestCases.find(testCase => testCase.id == testCase1.id);
      if(testCase2) {
        // test case is available in both lists
        // check if test case really changed
        const updatedKeys = TestModelDifferencing.getTestCaseUpdatedKeys(testCase1, testCase2);
        if(updatedKeys.length > 0) {
          updatedTestCases.push(new TestCaseUpdate(testCase1, testCase2, TestModelDifferencing.getTestCaseRelevantKeys(testCase1), updatedKeys));
        }
      }
    }

    return updatedTestCases;
  }

  /**
   * Searches for requests that are included in both lists but got updated.
   * @param {*} model1TestCases Previous state of the test case list.
   * @param {*} model2TestCases Current state of the test case list.
   * @returns List of RequestUpdate objects.
   */
  static getUpdatedRequests(model1TestCases, model2TestCases) {
    const updatedRequests = [];

    // check for test cases which are part of both lists
    for(let testCase1 of model1TestCases) {
      const testCase2 = model2TestCases.find(testCase => testCase.id == testCase1.id);
      if(testCase2) {
        // test case is available in both lists
        // check for requests which are part of both test cases
        for(let request1 of testCase1.requests) {
          const request2 = testCase2.requests.find(r => r.id == request1.id);
          if(request2) {
            // request is available in both test cases
            // check if request has changed
            const updatedKeys = TestModelDifferencing.getRequestUpdatedKeys(request1, request2);
            if(updatedKeys.length > 0) {
              updatedRequests.push(new RequestUpdate(request1, request2, testCase2, TestModelDifferencing.getRequestRelevantKeys(request2), updatedKeys));
            }
          }
        }
      }
    }

    return updatedRequests;
  }

  /**
   * Searches for keys in the given test case objects, where the corresponding value changed.
   * @param {*} testCase1 Previous state of the test case.
   * @param {*} testCase2 Current state of the test case.
   * @returns 
   */
  static getTestCaseUpdatedKeys(testCase1, testCase2) {
    let updatedKeys = [];
    for(let key of TestModelDifferencing.getTestCaseRelevantKeys(testCase1)) {
      if(testCase1[key] != testCase2[key]) {
        updatedKeys.push(key);
      }
    }

    return updatedKeys;
  }

  /**
   * Searches for keys in the given request objects, where the corresponding value changed.
   * @param {*} request1 Previous state of the request.
   * @param {*} request2 Current state of the request.
   * @returns 
   */
  static getRequestUpdatedKeys(request1, request2) {
    let updatedKeys = [];
    for(let key of TestModelDifferencing.getRequestRelevantKeys(request2)) {
      if(key == "auth") {
        if(!Object.keys(request1.auth).includes("selectedAgent") && !Object.keys(request2.auth).includes("selectedAgent")) {
          // both requests have auth disabled
        } else if(Object.keys(request1.auth).includes("selectedAgent") && Object.keys(request2.auth).includes("selectedAgent")) {
          // both requests have auth enabled
          if(request1.auth.selectedAgent != request2.auth.selectedAgent) {
            updatedKeys.push(key);
          }
        } else {
          updatedKeys.push(key);
        }
      } else if(request1[key] != request2[key]) {
        updatedKeys.push(key);
      }
    }
    return updatedKeys;
  }

  /**
   * Filters the keys of the given test case object for the keys that are relevant for calculating the differences.
   * @param {*} testCase 
   * @returns Keys that are relevant for calculating test case differences.
   */
  static getTestCaseRelevantKeys(testCase) {
    return Object.keys(testCase).filter(key => !["id", "status", "requests"].includes(key));
  }

  /**
   * Filters the keys of the given request object for the keys that are relevant for calculating the differences.
   * @param {*} request 
   * @returns Keys that are relevant for calculating request differences.
   */
  static getRequestRelevantKeys(request) {
    return Object.keys(request).filter(key => !["id", "status", "assertions"].includes(key));
  }

  /**
   * Compares the two given difference objects.
   * @param diff1
   * @param diff2
   * @returns {boolean} Whether the two given difference objects are equals (content equals).
   */
  static equals(diff1, diff2) {
    if (!diff1 && !diff2) return true;
    if (!diff1 || !diff2) return false;
    if (diff1 instanceof TestCaseDifference && diff2 instanceof TestCaseDifference) {
      if (diff1 instanceof TestCaseAddition && diff2 instanceof TestCaseAddition) {
        return diff1.getTestCaseId() == diff2.getTestCaseId();
      }
      if (diff1 instanceof TestCaseDeletion && diff2 instanceof TestCaseDeletion) {
        return diff1.getTestCaseId() == diff2.getTestCaseId();
      }
      if (diff1 instanceof TestCaseUpdate && diff2 instanceof TestCaseUpdate) {
        return diff1.getTestCaseId() == diff2.getTestCaseId();
      }
    }
    if(diff1 instanceof RequestDifference && diff2 instanceof RequestDifference) {
      if(diff1 instanceof RequestAddition && diff2 instanceof RequestAddition) {
        return diff1.getRequestId() == diff2.getRequestId();
      }
      if(diff1 instanceof RequestDeletion && diff2 instanceof RequestDeletion) {
        return diff1.getRequestId() == diff2.getRequestId();
      }
      if(diff1 instanceof RequestUpdate && diff2 instanceof RequestUpdate) {
        return diff1.getRequestId() == diff2.getRequestId();
      }
    }
    if(diff1 instanceof AssertionDifference && diff2 instanceof AssertionDifference) {
      if(diff1 instanceof AssertionAddition && diff2 instanceof AssertionAddition) {
        return diff1.getAssertionId() == diff2.getAssertionId();
      }
      if(diff1 instanceof AssertionDeletion && diff2 instanceof AssertionDeletion) {
        return diff1.getAssertionId() == diff2.getAssertionId();
      }
    }
    return false;
  }
}