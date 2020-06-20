import NodeDifference from "./node-difference";

/**
 * Represents a node that got added to the model.
 */
export default class NodeAddition extends NodeDifference {

  /**
   * Constructor for node that got added to the model.
   * @param nodeKey Key of the node that got added, i.e. the SyncMeta id of it.
   * @param nodeValue Value of the node that got added.
   */
  constructor(nodeKey, nodeValue) {
    super(nodeKey, nodeValue);
  }

  /**
   * Creates the HTML representation of the added node.
   * @returns {HTMLDivElement} HTML representation of the added node.
   */
  toHTMLElement() {
    const base = super.toHTMLElement();
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "add";
    icon.style.setProperty("color", "#0F9D58");
    return base;
  }

}
