import TestCaseDifference from "./test-case-difference";

/**
 * Represents a test case that got added to the test model.
 */
export default class TestCaseAddition extends TestCaseDifference {

  /**
   * Constructor for test case that got added to the test model.
   * @param {*} testCase Test case that got added.
   */
  constructor(testCase) {
    super({}, testCase);
  }

  /**
   * Creates the HTML representation of the added test case.
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the added test case.
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
   * Adds the test case to the given test model.
   * @param {*} model Test model, that the test case should be added to.
   */
  applyToTestModel(model) {
    model.testCases.push(this.updatedTestCase);
  }
}