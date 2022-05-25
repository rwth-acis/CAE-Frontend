import Assertions from "../../../test-editor/assertions";
import TestModelDifference from "../test-model-difference";

/**
 * Represents an assertion that has changed between two test model versions.
 */
export default class AssertionDifference extends TestModelDifference {

  /**
   * Constructor for AssertionDifference.
   * @param {*} assertion Assertion that was added or removed.
   * @param {*} request Request, that the assertion belongs to.
   * @param {*} testCase Test case, that the assertion belongs to.
   */
  constructor(assertion, request, testCase) {
    super();
    this.assertion = assertion;
    this.request = request;
    this.testCase = testCase;
  }

  /**
   * Creates the HTML representation of the changed assertion.
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the changed assertion.
   */
  toHTMLElement(checkboxListener) {
    const element = super.toHTMLElement(checkboxListener);

    // set text value
    const textElement = element.getElementsByClassName("text")[0];

    let text = "";
    if(this.assertion.assertionType == Assertions.ASSERTION_TYPE.STATUS_CODE.id) {
      text = "Status code assertion";
    } else {
      text = "Body assertion";
    }
    text = text + " (" + this.request.type  + " " + this.request.url + ")";
    textElement.innerText = text;

    // details div should include assertion details
    const detailsDiv = element.getElementsByClassName("details")[0];
    detailsDiv.appendChild(this.assertionDetailsToHTMLElement());

    return element;
  }

  assertionDetailsToHTMLElement() {
    const div = document.createElement("div");

    const p = document.createElement("p");
    if(this.assertion.assertionType == Assertions.ASSERTION_TYPE.STATUS_CODE.id) { 
      const operatorId = this.assertion.operator.id;

      // get status code comparison operator and value
      const comparisonOperator = Assertions.STATUS_CODE_COMPARISON_OPERATORS.find(operator => operator.id == operatorId).value;
      const comparisonValue = this.assertion.operator.input.value;

      p.innerText = "Status code " + comparisonOperator + " " + comparisonValue;
    } else {
      let currentOperator = this.assertion.operator;
      let text = "";

      // iterate through operators
      while(currentOperator) {
        const operatorId = currentOperator.operatorId;
        const operator = Assertions.RESPONSE_BODY_OPERATORS.find(o => o.id == operatorId);
        text = text + " " + operator.value;
        // check if operator has input
        if(currentOperator.input && Object.keys(currentOperator.input).includes("id")) {
          let input;
          if(currentOperator.input.id == Assertions.INPUT_FIELD.id) {
            input = currentOperator.input; 
          } else {
            input = Assertions.INPUTS.find(i => i.id == currentOperator.input.id);
          }
          text = text + " " + input.value;
        }
        currentOperator = currentOperator.followedBy;
      }
      p.innerText = text;
    }
    p.style.setProperty("margin-right", "1.5em");
    div.appendChild(p);

    return div;
  }

  /**
   * Returns the id of the assertion that got changed.
   * @returns Id of the assertion that got changed.
   */
  getAssertionId() {
    return this.assertion.id;
  }
}