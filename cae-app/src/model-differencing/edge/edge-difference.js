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
    super(edgeKey, edgeValue);
    this.edgeSource = edgeSource;
    this.edgeTarget = edgeTarget;
  }

  /**
   * Creates the HTML representation of the changed edge.
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the changed edge.
   */
  toHTMLElement(checkboxListener) {
    const element = super.toHTMLElement(checkboxListener);

    // set text value
    const textElement = element.getElementsByClassName("text")[0];
    textElement.innerText = "Edge from " + this.edgeSource.type + " to " + this.edgeTarget.type;

    // remove button for expanding/collapsing details (because they are currently not used for edges)
    element.getElementsByClassName("button-expand-collapse")[0].remove();
    // set margin right to text, because when removing the button, this is needed
    element.getElementsByClassName("text")[0].style.setProperty("margin-right", "1.5em");

    return element;
  }

}
