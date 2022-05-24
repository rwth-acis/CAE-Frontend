import TestCaseDifference from "./test-case-difference";

/**
 * Represents a test case that got updated (i.e., an attribute, other than the requests, changed) between two test model versions.
 */
export default class TestCaseUpdate extends TestCaseDifference {

  /**
   * Constructor for updated test case.
   * @param {*} oldTestCase Previous state of the test case.
   * @param {*} updatedTestCase Current state of the test case.
   * @param {*} relevantKeys Keys of the test case JSON object that are relevant for the differences (i.e., id and requests not included here).
   * @param {*} updatedKeys Keys for which the value changed.
   */
  constructor(oldTestCase, updatedTestCase, relevantKeys, updatedKeys) {
    super(oldTestCase, updatedTestCase);
    this.relevantKeys = relevantKeys;
    this.updatedKeys = updatedKeys;
  }

  /**
   * Creates the HTML representation of the updated test case.
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the updated test case.
   */
   toHTMLElement(checkboxListener) {
    const base = super.toHTMLElement(checkboxListener);
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "create";
    icon.style.setProperty("color", "#dba027");

    // details div should include test case attributes
    const detailsDiv = base.getElementsByClassName("details")[0];
    detailsDiv.appendChild(this.attributesToHTMLElement());

    return base;
  }

  /**
   * Creates a HTML element displaying the attributes of the test case.
   * @returns {HTMLDivElement} HTML element displaying the attributes of the test case.
   */
  attributesToHTMLElement() {
    const div = document.createElement("div");
    for (const key of this.relevantKeys) {
      const p = document.createElement("p");
      const value = this.updatedTestCase[key];
      p.innerText = key + ": " + value;
      p.style.setProperty("margin-right", "1.5em");

      // check if attribute got updated
      if(this.updatedKeys.includes(key)) {
        p.style.setProperty("background", "#e1e1e1");
      }

      div.appendChild(p);
    }
    return div;
  }

  /**
   * Applies the test case update to the given model.
   * @param {*} model Model to which the test case update should be applied.
   */
  applyToTestModel(model) {
    const testCase = model.testCases.find(testCase => testCase.id == this.oldTestCase.id);
    for(const key of this.updatedKeys) {
      testCase[key] = this.updatedTestCase[key];
    }
  }
}