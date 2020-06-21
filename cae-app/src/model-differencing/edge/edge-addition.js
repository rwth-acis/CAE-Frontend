import EdgeDifference from "./edge-difference";

/**
 * Represents an edge that got added to the model.
 */
export default class EdgeAddition extends EdgeDifference {

  /**
   * Constructor for edge that got added to the model.
   * @param edgeKey Key of the added edge, i.e. a SyncMeta id.
   * @param edgeValue Value of the added edge.
   * @param edgeSource Source node of the edge.
   * @param edgeTarget Target node of the edge.
   */
  constructor(edgeKey, edgeValue, edgeSource, edgeTarget) {
    super(edgeKey, edgeValue, edgeSource, edgeTarget);
  }

  /**
   * Creates the HTML representation of the added edge.
   * @param displayCheckbox Whether a checkbox should appear on the left or not. This may be used to select the difference.
   * @returns {HTMLDivElement} HTML representation of the added edge.
   */
  toHTMLElement(displayCheckbox) {
    const base = super.toHTMLElement(displayCheckbox);
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "add";
    icon.style.setProperty("color", "#0F9D58");
    return base;
  }
}
