import Difference from "../difference";

/**
 * Represents an edge that has changed between two model versions.
 */
export default class EdgeDifference extends Difference {

  /**
   * Constructor for edge that has changed.
   * @param edgeKey Key of the changed edge, i.e. a SyncMeta id.
   * @param edgeValue Value of the changed edge.
   * @param edgeSource Source node of the edge.
   * @param edgeTarget Target node of the edge.
   */
  constructor(edgeKey, edgeValue, edgeSource, edgeTarget) {
    super();
    this.edgeKey = edgeKey;
    this.edgeValue = edgeValue;
    this.edgeSource = edgeSource;
    this.edgeTarget = edgeTarget;
  }

  /**
   * Creates the HTML representation of the changed edge.
   * @param displayCheckbox Whether a checkbox should appear on the left or not. This may be used to select the difference.
   * @returns {HTMLDivElement} HTML representation of the changed edge.
   */
  toHTMLElement(displayCheckbox) {
    const element = super.toHTMLElement(displayCheckbox);

    // set text value
    const textElement = element.getElementsByClassName("text")[0];
    textElement.innerText = "Edge from " + this.edgeSource.type + " to " + this.edgeTarget.type;

    return element;
  }

}
