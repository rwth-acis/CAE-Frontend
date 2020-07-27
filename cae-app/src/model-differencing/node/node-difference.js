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
  constructor(nodeKey, nodeValue, type) {
    super(nodeKey, nodeValue, type);
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
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the changed node.
   */
  toHTMLElement(checkboxListener) {
    const element = super.toHTMLElement(checkboxListener);

    // set text value
    const textElement = element.getElementsByClassName("text")[0];
    textElement.innerText = this.getType();

    if(this.hasNonEmptyAttributes()) {
      // details div should include node attributes
      const detailsDiv = element.getElementsByClassName("details")[0];
      detailsDiv.appendChild(this.attributesToHTMLElement());
    } else {
      // remove button for expanding/collapsing details (because no details/non-empty attributes exist)
      element.getElementsByClassName("button-expand-collapse")[0].remove();
      // set margin right to text, because when removing the button, this is needed
      element.getElementsByClassName("text")[0].style.setProperty("margin-right", "1.5em");
    }

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
      if(value.toString() != "") {
        const p = document.createElement("p");
        // set key as class, this will then be used to highlight the attribute which got edited (if its a node-update)
        p.setAttribute("class", key);
        p.innerText = key + ": " + value;
        p.style.setProperty("margin-right", "1.5em");
        div.appendChild(p);
      }
    }
    return div;
  }

  /**
   * Checks if one of the attribute values of the node is not the empty string.
   * @returns {boolean} Whether at least one node attribute exists where the value is not the empty string.
   */
  hasNonEmptyAttributes() {
    let hasNonEmptyAttributes = false;

    for(const [key, value] of Object.entries(this.getAttributes())) {
      if(value != "") {
        hasNonEmptyAttributes = true;
        break;
      }
    }

    return hasNonEmptyAttributes;
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
