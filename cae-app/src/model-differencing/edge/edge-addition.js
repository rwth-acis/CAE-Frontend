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
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the added edge.
   */
  toHTMLElement(checkboxListener) {
    const base = super.toHTMLElement(checkboxListener);
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "add";
    icon.style.setProperty("color", "#0F9D58");
    return base;
  }

  applyToModel(model) {
    model.edges[this.key] = this.value;
  }
}
