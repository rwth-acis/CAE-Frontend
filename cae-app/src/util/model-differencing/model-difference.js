import Common from "../common";
import Static from "../../static";
import Difference from "./difference";

/**
 * Class used as a base for all differences that appear between two
 * model versions.
 */
export default class ModelDifference extends Difference {

  /**
   * Constructor setting key and value.
   * @param key Key of the element that has changed, i.e. a SyncMeta id.
   * @param value Value of the element that has changed.
   */
  constructor(key, value, type) {
    super();
    this.key = key;
    this.value = value;
    this.type = type;
  }

  /**
   * Returns the key of the element that has changed.
   * @returns {*} Key of element that has changed.
   */
  getKey() {
    return this.key;
  }

  /**
   * Returns the value of the element that has changed.
   * @returns {*} Value of the element that has changed.
   */
  getValue() {
    return this.value;
  }

  highlight(y) {
    // first, unhighlight every entity
    this.unhighlightAll(y);

    // now, highlight the node/edge belonging to this difference element
    const key = this.getKey();
    y.share.canvas.set("highlight", {
      entities: [key],
      color : "yellow",
      label: "Selected in versioning system",
      userId: Common.getUserInfo().sub,
      remote: false,
      moveCanvasToEntity: key
    });
  }

  unhighlightAll(y) {
    y.share.canvas.set("unhighlight", {
      entities: this.getEntityIdsFromModel(y.share.data.get("model")),
      userId: Common.getUserInfo().sub,
      remote: false
    });
  }

  /**
   * Returns a list containing the ids of every node and edge entity in the given model.
   * @param model Model given from Yjs room.
   * @returns {[]} A list containing the ids of every node and edge entity in the given model.
   */
  getEntityIdsFromModel(model) {
    const nodes = model.nodes;
    const edges = model.edges;

    const entityIds = [];

    for(const [key, value] of Object.entries(nodes)) {
      entityIds.push(key);
    }
    for(const [key, value] of Object.entries(edges)) {
      entityIds.push(key);
    }
    return entityIds;
  }

  /**
   * Compares the two given difference objects.
   * @param diff1
   * @param diff2
   * @returns {boolean} Whether the two given difference objects are equals (content equals).
   */
  static equals(diff1, diff2) {
    if(!diff1 && !diff2) return true;
    if(!diff1 || !diff2) return false;
    if(diff1.type != diff2.type) return false;
    if (diff1.type === "NodeUpdate") {
      return (diff1.key == diff2.key) && (diff1.attributeKey == diff2.attributeKey);
    } else {
      return diff1.key == diff2.key;
    }
  }
}
