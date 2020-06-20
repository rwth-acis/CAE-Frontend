import NodeDifference from "./node-difference";

export default class NodeDeletion extends NodeDifference {

  /**
   * Constructor for NodeDifferences of type deletion.
   * @param nodeKey Key of the node that got deleted, i.e. the SyncMeta id of it.
   * @param nodeValue Value of the node that got deleted.
   */
  constructor(nodeKey, nodeValue) {
    super(nodeKey, nodeValue);
  }

  toHTMLElement() {
    const base = super.toHTMLElement();
    // set correct icon
    const icon = base.getElementsByTagName("iron-icon")[0];
    icon.icon = "remove";
    icon.style.setProperty("color", "#DB4437");
    return base;
  }
}
