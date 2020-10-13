/**
 * Helper class for checking if a model is valid.
 */
export default class ModelValidator {

  /**
   * Checks if for all edges, the source and target nodes are also included
   * in the given model.
   * @param model
   * @returns {boolean}
   */
  static edgesValid(model) {
    const edges = model.edges;

    const nodes = model.nodes;
    const nodeKeys = Array.from(Object.keys(nodes));

    let valid = true;

    for(const [edgeKey, edgeValue] of Object.entries(edges)) {
      const sourceNode = edgeValue.source;
      const targetNode = edgeValue.target;
      if(!nodeKeys.includes(sourceNode) || !nodeKeys.includes(targetNode)) {
        // edge is part of the model, but one of the nodes (source or target) is not
        // thus, the model is not valid
        valid = false;
        break;
      }
    }
    return valid;
  }

}
