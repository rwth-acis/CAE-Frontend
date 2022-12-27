import AssertionDifference from "./assertion-difference";

/**
 * Represents an assertion that was added to a request.
 */
export default class AssertionAddition extends AssertionDifference {

  /**
   * Constructor for assertion that was added to a request.
   * @param {*} assertion Assertion that was added.
   * @param {*} request Request, that the assertion belongs to.
   * @param {*} testCase Test case, that the assertion belongs to.
   */
  constructor(assertion, request, testCase) {
    super(assertion, request, testCase);
  }

  /**
  * Creates the HTML representation of the added assertion.
  * @param checkboxListener Only set when checkbox should be displayed.
  * @returns {HTMLDivElement} HTML representation of the added assertion.
  */
  toHTMLElement(checkboxListener) {
    const base = super.toHTMLElement(checkboxListener);
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "add";
    icon.style.setProperty("color", "#0F9D58");

    return base;
  }

  /**
   * Applies the addition of the assertion to the given test model.
   * @param {*} model Test model that the addition should be applied to.
   */
  applyToTestModel(model) {
    const testCaseInModel = model.testCases.find(testCase => testCase.id == this.testCase.id);
    const requestInModel = testCaseInModel.requests.find(request => request.id == this.request.id);
    requestInModel.assertions.push(this.assertion);
  }
}