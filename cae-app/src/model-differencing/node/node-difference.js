import Difference from "../difference";

/**
 * Represents a node that has changed between two model versions.
 */
export default class NodeDifference extends Difference {

  /**
   * Constructor for NodeDifference objects.
   * Sets key of the node that the difference belongs to.
   * @param nodeKey Key of the node, i.e. the SyncMeta id of it.
   * @param nodeValue Value of the node.
   */
  constructor(nodeKey, nodeValue) {
    super(nodeKey, nodeValue);
  }

  /**
   * Getter for the type of the node which has changed.
   * @returns {*} Type of the node which has changed.
   */
  getType() {
    return this.getValue()["type"];
  }

  /**
   * Creates the HTML representation of the changed node.
   * @param displayCheckbox Whether a checkbox should appear on the left or not. This may be used to select the difference.
   * @returns {HTMLDivElement} HTML representation of the changed node.
   */
  toHTMLElement(displayCheckbox) {
    const element = super.toHTMLElement(displayCheckbox);

    // set text value
    const textElement = element.getElementsByClassName("text")[0];
    textElement.innerText = this.getType();

    // details div should include node attributes
    const detailsDiv = element.getElementsByClassName("details")[0];
    detailsDiv.appendChild(this.attributesToHTMLElement());

    return element;
  }

  /**
   * Creates a HTML element displaying the attributes of the node.
   * @returns {HTMLDivElement} HTML element displaying the attribute of the node.
   */
  attributesToHTMLElement() {
    const div = document.createElement("div");
    const attributes = this.getAttributes();
    for(const [key, value] of Object.entries(attributes)) {
      // only show those attributes that are set to something
      if(value != "") {
        const p = document.createElement("p");
        p.innerText = key + ": " + value;
        div.appendChild(p);
      }
    }
    return div;
  }

  /**
   * Returns a map where the name of an attribute gets mapped to the value of the attribute.
   * @returns {Object} Map where the name of an attribute gets mapped to the value of the attribute.
   */
  getAttributes() {
    const nodeValue = this.getValue();
    const syncMetaAttributeMap = nodeValue.attributes;
    let attributeMap = new Object();
    for(const value of Object.values(syncMetaAttributeMap)) {
      const attributeName = value.name;
      const attributeValue = value.value.value;
      attributeMap[attributeName] = attributeValue;
    }
    return attributeMap;
  }
}
