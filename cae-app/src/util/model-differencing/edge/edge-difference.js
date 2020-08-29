import Difference from "../difference";
import Common from "../../common";

/**
 * Represents an edge that has changed between two model versions.
 */
export default class EdgeDifference extends Difference {

  /**
   * Constructor for edge that has changed.
   * @param edgeKey Key of the changed edge, i.e. a SyncMeta id.
   * @param edgeValue Value of the changed edge.
   * @param edgeSourceKey Key of the source node of the edge.
   * @param edgeSourceValue Source node of the edge.
   * @param edgeTargetKey Key of the target node of the edge.
   * @param edgeTargetValue Target node of the edge.
   */
  constructor(edgeKey, edgeValue, edgeSourceKey, edgeSourceValue, edgeTargetKey, edgeTargetValue, type) {
    super(edgeKey, edgeValue, type);
    this.edgeSourceKey = edgeSourceKey;
    this.edgeSourceValue = edgeSourceValue;
    this.edgeTargetKey = edgeTargetKey;
    this.edgeTargetValue = edgeTargetValue;
  }

  /**
   * Creates the HTML representation of the changed edge.
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the changed edge.
   */
  toHTMLElement(checkboxListener) {
    const element = super.toHTMLElement(checkboxListener);

    // set text value
    const textElement = element.getElementsByClassName("text")[0];
    textElement.innerText = "Edge from " + this.edgeSourceValue.type + " to " + this.edgeTargetValue.type;

    // remove button for expanding/collapsing details (because they are currently not used for edges)
    element.getElementsByClassName("button-expand-collapse")[0].remove();
    // set margin right to text, because when removing the button, this is needed
    element.getElementsByClassName("text")[0].style.setProperty("margin-right", "1.5em");

    return element;
  }

  highlight(y) {
    super.unhighlightAll(y);

    // now, hightlight the edge itself and the nodes that it connects
    const key = this.getKey();
    const sourceNodeKey = this.edgeSourceKey;
    const targetNodeKey = this.edgeTargetKey;
    y.share.canvas.set("highlight", {
      entities: [key, sourceNodeKey, targetNodeKey],
      color : "yellow",
      label: "Selected in versioning system",
      userId: Common.getUserInfo().sub,
      remote: false,
      moveCanvasToEntity: key // canvas should only move once to the edge (and not to the nodes)
    });
  }

}
