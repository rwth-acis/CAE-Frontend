import Difference from "../difference";

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

  getType() {
    return this.getValue()["type"];
  }

  toHTMLElement() {
    const element = super.toHTMLElement();

    // set text value
    const textElement = element.getElementsByClassName("text")[0];
    textElement.innerText = this.getType();

    // details div should include node attributes
    const detailsDiv = element.getElementsByClassName("details")[0];
    detailsDiv.appendChild(this.attributesToHTMLElement());

    return element;
  }

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
