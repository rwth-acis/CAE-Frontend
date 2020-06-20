import NodeDifference from "./node-difference";

/**
 * Represents a node that got updated (i.e. an attribute got updated) between two model versions.
 */
export default class NodeUpdate extends NodeDifference {

  /**
   * Constructor for updated node.
   * @param nodeKey Key of the node that got updated, i.e. the SyncMeta id of it.
   * @param nodeValue Value of the node.
   * @param attributeKey Key of the attribute that got updated.
   */
  constructor(nodeKey, nodeValue, attributeKey) {
    super(nodeKey, nodeValue);
    this.attributeKey = attributeKey;
  }

  /**
   * Getter for key of the attribute that got changed.
   * @returns {*} Key of the attribute that got changed.
   */
  getAttributeKey() {
    return this.attributeKey;
  }

  /**
   * Creates the HTML representation of the updated node.
   * @returns {HTMLDivElement} HTML representation of the updated node.
   */
  toHTMLElement() {
    const base = super.toHTMLElement();
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "create";
    icon.style.setProperty("color", "#dba027");
    return base;
  }
}
