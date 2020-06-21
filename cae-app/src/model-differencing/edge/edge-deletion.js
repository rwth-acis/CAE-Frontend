import EdgeDifference from "./edge-difference";

/**
 * Represents an edge that got deleted from the model.
 */
export default class EdgeDeletion extends EdgeDifference {

  /**
   * Constructor for edge that got deleted from the model.
   * @param edgeKey Key of the deleted edge, i.e. a SyncMeta id.
   * @param edgeValue Value of the deleted edge.
   * @param edgeSource Source node of the edge.
   * @param edgeTarget Target node of the edge.
   */
  constructor(edgeKey, edgeValue, edgeSource, edgeTarget) {
    super(edgeKey, edgeValue, edgeSource, edgeTarget);
  }

  /**
   * Creates the HTML representation of the deleted edge.
   * @param displayCheckbox Whether a checkbox should appear on the left or not. This may be used to select the difference.
   * @returns {HTMLDivElement} HTML representation of the deleted edge.
   */
  toHTMLElement(displayCheckbox) {
    const base = super.toHTMLElement(displayCheckbox);
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "remove";
    icon.style.setProperty("color", "#DB4437");
    return base;
  }

}
