import TestCaseDifference from "./test-case-difference";

/**
 * Represents a test case that got deleted from the test model.
 */
export default class TestCaseDeletion extends TestCaseDifference {

  /**
   * Constructor for a test case that got deleted from the test model.
   * @param {*} testCase Test case that got deleted.
   */
  constructor(testCase) {
    super(testCase, {});
  }

  /**
   * Creates the HTML representation of the deleted test case.
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the deleted test case.
   */
  toHTMLElement(checkboxListener) {
    const base = super.toHTMLElement(checkboxListener);
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "remove";
    icon.style.setProperty("color", "#DB4437");

    // set text value
    const textElement = base.getElementsByClassName("text")[0];
    textElement.innerText = this.oldTestCase.name;

    // remove button for expanding/collapsing details
    base.getElementsByClassName("button-expand-collapse")[0].remove();
    // set margin right to text, because when removing the button, this is needed
    base.getElementsByClassName("text")[0].style.setProperty("margin-right", "1.5em");

    return base;
  }

  /**
   * Applied the deletion of the test case to the given test model.
   * @param {*} model Test model that the deletion should be applied to.
   */
  applyToTestModel(model) {
    model.testCases = model.testCases.filter(testCase => testCase.id != this.oldTestCase.id);
  }
}