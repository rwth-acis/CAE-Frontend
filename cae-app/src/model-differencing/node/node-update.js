import NodeDifference from "./node-difference";

export default class NodeUpdate extends NodeDifference {

  /**
   * Constructor for NodeDifferences of type update.
   * @param nodeKey Key of the node that got added, i.e. the SyncMeta id of it.
   * @param nodeValue Value of the node.
   * @param attributeKey Key of the attribute that got updated.
   */
  constructor(nodeKey, nodeValue, attributeKey) {
    super(nodeKey, nodeValue);
    this.attributeKey = attributeKey;
  }

  getAttributeKey() {
    return this.attributeKey;
  }

  toHTMLElement() {
    const base = super.toHTMLElement();
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "create";
    icon.style.setProperty("color", "#dba027");
    return base;
  }
}
