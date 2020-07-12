import EdgeDifference from "./edge-difference";

/**
 * Represents an edge that got deleted from the model.
 */
export default class EdgeDeletion extends EdgeDifference {

  /**
   * Constructor for edge that got deleted from the model.
   * @param edgeKey Key of the deleted edge, i.e. a SyncMeta id.
   * @param edgeValue Value of the deleted edge.
   * @param edgeSourceKey Key of the source node of the edge.
   * @param edgeSourceValue Source node of the edge.
   * @param edgeTargetKey Key of the target node of the edge.
   * @param edgeTargetValue Target node of the edge.
   */
  constructor(edgeKey, edgeValue, edgeSourceKey, edgeSourceValue, edgeTargetKey, edgeTargetValue) {
    super(edgeKey, edgeValue, edgeSourceKey, edgeSourceValue, edgeTargetKey, edgeTargetValue, "EdgeDeletion");
  }

  /**
   * Creates the HTML representation of the deleted edge.
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the deleted edge.
   */
  toHTMLElement(checkboxListener) {
    const base = super.toHTMLElement(checkboxListener);
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "remove";
    icon.style.setProperty("color", "#DB4437");
    return base;
  }

  applyToModel(model) {
    delete model.edges[this.key];
  }

}
