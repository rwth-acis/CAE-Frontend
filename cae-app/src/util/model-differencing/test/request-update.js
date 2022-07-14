import RequestDifference from "./request-difference";

/**
 * Represents a request that got updated between two model versions.
 */
export default class RequestUpdate extends RequestDifference {

  /**
   * Constructor for updated request.
   * @param {*} oldRequest Previous state of the request.
   * @param {*} updatedRequest Current state of the request.
   * @param {*} testCase Test case, that the request belongs to.
   * @param {*} relevantKeys Keys of the request JSON object that are relevant for the differences.
   * @param {*} updatedKeys Keys for which the value changed.
   */
  constructor(oldRequest, updatedRequest, testCase, relevantKeys, updatedKeys) {
    super(oldRequest, updatedRequest, testCase);
    this.relevantKeys = relevantKeys;
    this.updatedKeys = updatedKeys;
  }

  /**
   * Creates the HTML representation of the updated request.
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the updated request.
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
   * Creates a HTML element displaying the attributes of the request.
   * @returns {HTMLDivElement} HTML element displaying the attributes of the request.
   */
  attributesToHTMLElement() {
    const div = document.createElement("div");
    for (const key of this.relevantKeys) {
      const p = document.createElement("p");
      const value = this.updatedRequest[key];
      if(key == "auth") {
        p.innerText = key + ": " + JSON.stringify(value);
      } else {
        p.innerText = key + ": " + value;
      }
      p.style.setProperty("margin-right", "1.5em");

      // check if attribute got updated
      if (this.updatedKeys.includes(key)) {
        p.style.setProperty("background", "#e1e1e1");
      }

      div.appendChild(p);
    }
    return div;
  }

  /**
   * Applies the request update to the given model.
   * @param {*} model Model to which the request update should be applied.
   */
  applyToTestModel(model) {
    const testCase = model.testCases.find(testCase => testCase.id == this.testCase.id);
    const request = testCase.requests.find(request => request.id == this.updatedRequest.id);
    for (const key of this.updatedKeys) {
      request[key] = this.updatedRequest[key];
    }
  }
}