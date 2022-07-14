import RequestDifference from "./request-difference";

/**
 * Represents a request that got removed from a test case.
 */
export default class RequestDeletion extends RequestDifference {

  /**
   * Constructor for request that got deleted from a test case.
   * @param {*} request Request that got deleted.
   * @param {*} testCase Test case that the request got deleted from.
   */
  constructor(request, testCase) {
    super(request, {}, testCase);
  }

  /**
   * Creates the HTML representation of the deleted request.
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the deleted request.
   */
  toHTMLElement(checkboxListener) {
    const base = super.toHTMLElement(checkboxListener);
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "remove";
    icon.style.setProperty("color", "#DB4437");

    // set text value
    const textElement = base.getElementsByClassName("text")[0];
    textElement.innerText = this.oldRequest.type + " " + this.oldRequest.url + " (" + this.testCase.name + ")";

    // remove button for expanding/collapsing details
    base.getElementsByClassName("button-expand-collapse")[0].remove();
    // set margin right to text, because when removing the button, this is needed
    base.getElementsByClassName("text")[0].style.setProperty("margin-right", "1.5em");

    return base;
  }

  /**
   * Removes the request from the test case in the given test model.
   * @param {*} model Test model, that the request should be removed from.
   */
  applyToTestModel(model) {
    // find test case in model
    const testCaseInModel = model.testCases.find(t => t.id == this.testCase.id);
    testCaseInModel.requests = testCaseInModel.requests.filter(request => request.id != this.oldRequest.id);
  }
}