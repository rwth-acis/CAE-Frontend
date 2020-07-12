import NodeAddition from "./node/node-addition";
import NodeDeletion from "./node/node-deletion";
import NodeUpdate from "./node/node-update";
import EdgeAddition from "./edge/edge-addition";
import EdgeDeletion from "./edge/edge-deletion";

/**
 * Class used for calculating the differences between two versions of a model.
 * Note, that some differences are not considered, i.e. position changes of a node.
 */
export default class ModelDifferencing {

  /**
   * Calculates the node and edge differences between the given models.
   * Note: model2 gets used as the "newer" one.
   * @param model1 Model as JSON (given from the database).
   * @param model2 Model as JSON (given from the database).
   */
  static getDifferences(model1, model2) {
    const nodeDifferences = this.getNodeDifferences(model1, model2);
    const edgeDifferences = this.getEdgeDifferences(model1, model2);

    let differences = [];
    differences = differences.concat(nodeDifferences, edgeDifferences);
    return differences;
  }

  /**
   * Calculates the nodes and edges that the given model consists of.
   * This may be used to calculate the differences of the initial commit.
   * @param model2
   * @returns {[]}
   */
  static getDifferencesOfSingleModel(model2) {
    return this.getDifferences(this.getEmptyModel(), model2);
  }

  static getEmptyModel() {
    // just put the empty model in here, do not load it from another file
    // then crazy bugs seem to occur
    return {
      "nodes": {},
      "wireframe": null,
      "edges": {},
      "attributes": {
        "top": "0",
        "left": "0",
        "width": "0",
        "attributes": {},
        "label": {
          "name": "Label",
          "id": "modelAttributes[label]",
          "value": {
            "name": "Label",
            "id": "modelAttributes[label]",
            "value": "NAME DOES NOT EXIST ANYMORE"
          }
        },
        "type": "ModelAttributesNode",
        "height": "0",
        "zIndex": "0"
      }
    };
  }

  static createModelFromDifferences(modelStart, differences, currentModel) {
    // apply differences to modelStart, i.e. to the previous stored model
    for(let i in differences) {
      const difference = differences[i];
      difference.applyToModel(modelStart);
    }

    // changes regarding the position or size of nodes are not part of the differences array
    // thus, we need to get these changes from the currentModel and apply them too
    const currentNodes = currentModel.nodes;
    const currentNodeKeys = Object.keys(currentNodes);
    for(const [key, value] of Object.entries(modelStart.nodes)) {
      if(currentNodeKeys.includes(key)) {
        // node still exists in current model
        // apply position/size changes to node in modelStart
        const currentNode = currentNodes[key];
        value.top = currentNode.top;
        value.left = currentNode.left;
        value.width = currentNode.width;
        value.height = currentNode.height;
        value.zIndex = currentNode.zIndex;
      }
    }

    return modelStart;
  }

  /**
   * Calculates the differences between the two given models regarding their edges.
   * Note: model2 gets used as the "newer" one, i.e. if one edge exists in model2 which does
   * not exist in model1, then it gets seen as an addition and not as a deletion.
   * @param model1
   * @param model2
   */
  static getEdgeDifferences(model1, model2) {
    const edges1 = model1.edges;
    const edges2 = model2.edges;

    // nodes are also needed to get source and target of edges that changed
    const nodes1 = model1.nodes;
    const nodes2 = model2.nodes;

    // edges might be an empty json object: {}
    // otherwise it contains a "map" where the edges are identified by their SyncMeta id

    let additions = [];
    let deletions = [];
    // check if edges got added
    // iterate through all the edges in model2 and check if they already existed in model1
    for(const [key, value] of Object.entries(edges2)) {
      if(!edges1[key]) {
        // edge does not exist in model1, thus it must be a new edge
        // add the edge to nodeDifferences and mark it as an addition
        // find out source and target nodes
        const source = nodes2[value.source];
        const target = nodes2[value.target];

        additions.push(new EdgeAddition(key, value, value.source, source, value.target, target));
      }
    }

    // check if edges got deleted
    // iterate through all the edges in model1 and check if they are still included in model2
    for(const [key, value] of Object.entries(edges1)) {
      if(!edges2[key]) {
        // edge does not exist in model2 anymore, thus it got deleted
        // add the edge to nodeDifferences and mark it as an deletion
        // find out source and target nodes
        const source = nodes1[value.source];
        const target = nodes1[value.target];

        deletions.push(new EdgeDeletion(key, value, value.source, source, value.target, target));
      }
    }

    let edgeDifferences = [];
    edgeDifferences = edgeDifferences.concat(additions, deletions);
    return edgeDifferences;
  }

  /**
   * Calculates the differences between the two given models regarding their nodes.
   * Note: model2 gets used as the "newer" one, i.e. if one node exists in model2 which does
   * not exist in model1, then it gets seen as an addition and not as a deletion.
   * @param model1
   * @param model2
   */
  static getNodeDifferences(model1, model2) {
    const nodes1 = model1.nodes;
    const nodes2 = model2.nodes;

    // nodes might be an empty json object: {}
    // otherwise it contains a "map" where the nodes are identified by their SyncMeta id

    let additions = [];
    let deletions = [];
    // check if nodes got added
    // iterate through all the nodes in model2 and check if they already existed in model1
    for(const [key, value] of Object.entries(nodes2)) {
      if(!nodes1[key]) {
        // node does not exist in model1, thus it must be a new node
        // add the node to nodeDifferences and mark it as an addition
        additions.push(new NodeAddition(key, value));
      }
    }

    // check if nodes got deleted
    // iterate through all the nodes in model1 and check if they are still included in model2
    for(const [key, value] of Object.entries(nodes1)) {
      if(!nodes2[key]) {
        // node does not exist in model2 anymore, thus it got deleted
        // add the node to nodeDifferences and mark it as an deletion
        deletions.push(new NodeDeletion(key, value));
      }
    }

    // now we have found the nodes that got added or removed
    // now we have a look at the nodes of model2 that are no additions, which means
    // that they are possible candidates for nodes that got updated
    let additionsKeys = additions.map(addition => addition.getKey());
    let updates = [];
    for(const [key, value] of Object.entries(nodes2)) {
      if(!additionsKeys.includes(key)) {
        // the entry of nodes2 is no addition, thus it is a possible candidate for an
        // updated node
        const nodeInModel1 = nodes1[key];
        const nodeInModel2 = nodes2[key];
        // check if one of the attributes has changed
        const attributes1 = this.getAttributeValueMap(nodeInModel1["attributes"]);
        const attributes2 = this.getAttributeValueMap(nodeInModel2["attributes"]);

        for(const [attributeKey, attributeValue] of Object.entries(attributes2)) {
          if(attributeValue !== attributes1[attributeKey]) {
            // the value of the attribute in model1 is not the same as in model2
            updates.push(new NodeUpdate(key, value, attributeKey));
          }
        }
      }
    }

    let nodeDifferences = [];
    nodeDifferences = nodeDifferences.concat(additions, deletions, updates);
    return nodeDifferences;
  }

  /**
   * Given an attributes list from the database or SyncMeta,
   * it creates a new map which maps the SyncMeta id of the attributes
   * to the actual value.
   * @param attributes
   */
  static getAttributeValueMap(attributes) {
    const attributeValueMap = new Object();
    for(const [key, value] of Object.entries(attributes)) {
      attributeValueMap[key] = attributes[key]["value"]["value"];
    }
    return attributeValueMap;
  }

  /**
   * Restricts the wireframe to the nodes that the model contains.
   * Removes nodes from the wireframe, if the are not part of the model.
   * @param model
   * @returns {boolean} False, if the wireframe would not be valid after restriction. True, otherwise.
   */
  static restrictWireframeToModel(model) {
    const wireframe = model.wireframe;
    const parser = new DOMParser();
    const dom = parser.parseFromString(wireframe, "application/xml");

    // get all uiObjs
    const uiObjs = dom.getElementsByTagName("uiObj");

    // get list of ids of nodes of model
    const modelNodeIds = this.getNodeIds(model);

    const remainingUiObjIdList = [];
    const uiObjsToRemove = [];

    // iterate over all uiObjs
    for(const uiObj of uiObjs) {
      // get id of uiObj - this id corresponds to a node id in the model
      const uiObjId = uiObj.id;

      // check if the model contains a node with the given id
      if(!modelNodeIds.includes(uiObjId)) {
        // the current uiObj (of the wireframe) is not selected in the commit (not included in the model which should be commited)
        // thus, remove it from the wireframe
        uiObjsToRemove.push(uiObj);
      } else {
        // should not be removed
        remainingUiObjIdList.push(uiObjId);
      }
    }

    // now remove the uiObjs
    for(const uiObj of uiObjsToRemove) {
      uiObj.parentNode.removeChild(uiObj);
    }

    // now the wireframe dom only contains the uiObjs which are also part of the model
    // problem: as an example, if we have a div containing another element
    // and the element is selected in the commit, but the div not, then we would add an uiObj where
    // the parent does not exist
    // thus we need to check for the remaining uiObjs, if their parent (if set) still exists in the dom
    let failed = false;
    for(const remainingUiObjId of remainingUiObjIdList) {
      // get corresponding uiObj
      const uiObj = dom.getElementById(remainingUiObjId);
      const child = uiObj.children[1];
      const parent = child.getAttribute("parent");
      if(parent != "0" && parent != "1") {
        // check if parent still exists
        if(!remainingUiObjIdList.includes(parent)) {
          failed = true;
          break;
        }
      }

    }
    if(failed) return false;

    model.wireframe = new XMLSerializer().serializeToString(dom);
    return true;
  }

  /**
   * Returns a list containing the SyncMeta ids of the nodes of the given model.
   * @param model
   * @returns {[]} List containing the SyncMeta ids of the nodes of the given model.
   */
  static getNodeIds(model) {
    const nodeIds = [];
    for(const [key, value] of Object.entries(model.nodes)) {
      nodeIds.push(key);
    }
    return nodeIds;
  }
}
