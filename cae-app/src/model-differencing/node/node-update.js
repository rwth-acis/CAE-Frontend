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
    super(nodeKey, nodeValue, "NodeUpdate");
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
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the updated node.
   */
  toHTMLElement(checkboxListener) {
    const base = super.toHTMLElement(checkboxListener);
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "create";
    icon.style.setProperty("color", "#dba027");

    // highlight the attribute which got edited
    // we only have the attribute key, so get the attribute value first
    const attributeValue = this.getValue().attributes[this.getAttributeKey()];
    const attributeName = attributeValue.name;
    // find the element of the attributes in the details div which belongs to this attribute
    const attributeElement = base.getElementsByClassName(attributeName)[0];
    // highlight this element
    attributeElement.style.setProperty("background", "#e1e1e1");

    return base;
  }

  applyToModel(model) {
    model.nodes[this.key].attributes[this.attributeKey] = this.value.attributes[this.attributeKey];
  }
}
