import NodeDifference from "./node-difference";

/**
 * Represents a node that got deleted from the model.
 */
export default class NodeDeletion extends NodeDifference {

  /**
   * Constructor for node that got deleted to the model.
   * @param nodeKey Key of the node that got deleted, i.e. the SyncMeta id of it.
   * @param nodeValue Value of the node that got deleted.
   */
  constructor(nodeKey, nodeValue) {
    super(nodeKey, nodeValue);
  }

  /**
   * Creates the HTML representation of the deleted node.
   * @param displayCheckbox Whether a checkbox should appear on the left or not. This may be used to select the difference.
   * @returns {HTMLDivElement} HTML representation of the deleted node.
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
