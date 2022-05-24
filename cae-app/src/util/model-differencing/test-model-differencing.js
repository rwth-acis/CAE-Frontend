import TestModelDifference from "./test-model-difference";
import TestCaseAddition from "./test/test-case-addition";
import TestCaseDeletion from "./test/test-case-deletion";
import TestCaseUpdate from "./test/test-case-update";
import TestCaseDifference from "./test/test-case-difference";

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

    differences = differences.concat(TestModelDifferencing.getTestCaseAdditions(model1TestCases, model2TestCases));
    differences = differences.concat(TestModelDifferencing.getTestCaseDeletions(model1TestCases, model2TestCases));
    differences = differences.concat(TestModelDifferencing.getUpdatedTestCases(model1TestCases, model2TestCases));

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
   * Filters the keys of the given test case object for the keys that are relevant for calculating the differences.
   * @param {*} testCase 
   * @returns Keys that are relevant for calculating test case differences.
   */
  static getTestCaseRelevantKeys(testCase) {
    return Object.keys(testCase).filter(key => !["id", "status", "requests"].includes(key));
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
  }
}