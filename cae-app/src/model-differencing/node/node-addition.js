import NodeDifference from "./node-difference";

export default class NodeAddition extends NodeDifference {

  /**
   * Constructor for NodeDifferences of type addition.
   * @param nodeKey Key of the node that got added, i.e. the SyncMeta id of it.
   * @param nodeValue Value of the node that got added.
   */
  constructor(nodeKey, nodeValue) {
    super(nodeKey, nodeValue);
  }

  toHTMLElement() {
    const base = super.toHTMLElement();
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "add";
    icon.style.setProperty("color", "#0F9D58");
    return base;
  }

}
