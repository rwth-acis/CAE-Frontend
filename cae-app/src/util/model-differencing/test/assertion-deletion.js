import AssertionDifference from "./assertion-difference";

/**
 * Represents an assertion that got deleted from a request.
 */
export default class AssertionDeletion extends AssertionDifference {

  /**
   * Constructor for an assertion that got deleted from a request.
   * @param {*} assertion Assertion that got deleted.
   * @param {*} request Request, that the assertion belongs to.
   * @param {*} testCase Test case, that the assertion belongs to.
   */
  constructor(assertion, request, testCase) {
    super(assertion, request, testCase);
  }

  /**
   * Creates the HTML representation of the removed assertion.
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the removed assertion.
   */
  toHTMLElement(checkboxListener) {
    const base = super.toHTMLElement(checkboxListener);
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "remove";
    icon.style.setProperty("color", "#DB4437");

    return base;
  }

  /**
   * Applies the deletion of the assertion to the given test model.
   * @param {*} model Test model that the deletion should be applied to.
   */
  applyToTestModel(model) {
    const testCaseInModel = model.testCases.find(testCase => testCase.id == this.testCase.id);
    const requestInModel = testCaseInModel.requests.find(request => request.id == this.request.id);
    requestInModel.assertions = requestInModel.assertions.filter(assertion => assertion.id != this.assertion.id);
  }
}