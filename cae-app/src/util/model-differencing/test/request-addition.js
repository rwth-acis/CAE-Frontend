import RequestDifference from "./request-difference";

/**
 * Represents a request that got added to a test case.
 */
export default class RequestAddition extends RequestDifference {

  /**
   * Constructor for request that got added to a test case.
   * @param {*} request Request that got added.
   * @param {*} testCase Test case, to which the request got added.
   */
  constructor(request, testCase) {
    super({}, request, testCase);
  }

  /**
   * Creates the HTML representation of the added request.
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the added request.
   */
  toHTMLElement(checkboxListener) {
    const base = super.toHTMLElement(checkboxListener);
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "add";
    icon.style.setProperty("color", "#0F9D58");

    // remove button for expanding/collapsing details
    base.getElementsByClassName("button-expand-collapse")[0].remove();
    // set margin right to text, because when removing the button, this is needed
    base.getElementsByClassName("text")[0].style.setProperty("margin-right", "1.5em");

    return base;
  }

  /**
   * Adds the request to the test case in the given test model.
   * @param {*} model Test model, that the request should be added to.
   */
  applyToTestModel(model) {
    // find test case in model
    const testCaseInModel = model.testCases.find(t => t.id == this.testCase.id);
    testCaseInModel.requests.push(this.updatedRequest);
  }
}