import TestModelDifference from "../test-model-difference";

/**
 * Represents a test case that has changed between two test model versions.
 * This does not include changes to the requests of a test case.
 */
export default class TestCaseDifference extends TestModelDifference {

  /**
   * Constructor for TestCaseDifference.
   * Stores the previous and updated state of the test case.
   * Depending on the type of the difference, one of the two states might be {}.
   * @param {*} oldTestCase 
   * @param {*} updatedTestCase 
   */
  constructor(oldTestCase, updatedTestCase) {
    super();
    this.oldTestCase = oldTestCase;
    this.updatedTestCase = updatedTestCase;
  }

  /**
   * Creates the HTML representation of the changed test case.
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the changed test case.
   */
  toHTMLElement(checkboxListener) {
    const element = super.toHTMLElement(checkboxListener);
  
    // set text value
    const textElement = element.getElementsByClassName("text")[0];
    textElement.innerText = this.updatedTestCase.name;
  
    return element;
  }

  /**
   * Returns the id of the test case that got changed.
   * @returns Id of the test case that got changed.
   */
  getTestCaseId() {
    if(this.oldTestCase && this.oldTestCase.id) {
      return this.oldTestCase.id;
    } else {
      return this.updatedTestCase.id;
    }
  }
}