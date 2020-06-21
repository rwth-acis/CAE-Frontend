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
    const emptyModel = {
      "nodes": {},
      "edges": {}
    };
    return this.getDifferences(emptyModel, model2);
  }

  static createModelFromDifferences(modelStart, differences) {
    for(let i in differences) {
      const difference = differences[i];
      difference.applyToModel(modelStart);
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

        additions.push(new EdgeAddition(key, value, source, target));
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

        deletions.push(new EdgeDeletion(key, value, source, target));
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
}
