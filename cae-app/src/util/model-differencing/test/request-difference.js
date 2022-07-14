import TestModelDifference from "../test-model-difference";

/**
 * Represents a request that has changed between two test model versions.
 * This does not include changes to the assertions of a request.
 */
export default class RequestDifference extends TestModelDifference {
  
  /**
   * Constructor for RequestDifference.
   * Stores the previous and updated state of the request.
   * Depending on the type of the difference, one of the two states might be {}.
   * @param {*} oldRequest 
   * @param {*} updatedRequest 
   * @param {*} testCase Test case that the request belongs to.
   */
  constructor(oldRequest, updatedRequest, testCase) {
    super();
    this.oldRequest = oldRequest;
    this.updatedRequest = updatedRequest;
    this.testCase = testCase;
  }

  /**
   * Creates the HTML representation of the changed request.
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the changed request.
   */
  toHTMLElement(checkboxListener) {
    const element = super.toHTMLElement(checkboxListener);

    // set text value
    const textElement = element.getElementsByClassName("text")[0];
    textElement.innerText = this.updatedRequest.type + " " + this.updatedRequest.url + " (" + this.testCase.name + ")";

    return element;
  }

  /**
   * Returns the id of the request that got changed.
   * @returns Id of the request that got changed.
   */
  getRequestId() {
    if(this.oldRequest && this.oldRequest.id) {
      return this.oldRequest.id;
    } else {
      return this.updatedRequest.id;
    }
  }
}