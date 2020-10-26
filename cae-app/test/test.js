import chai from "../node_modules/chai";

import ModelDifferencing from "../src/util/model-differencing/model-differencing";
import NodeAddition from "../src/util/model-differencing/node/node-addition";
import NodeDeletion from "../src/util/model-differencing/node/node-deletion";
import NodeUpdate from "../src/util/model-differencing/node/node-update";

// import example models
import example1 from "./examples/example1";
import example2 from "./examples/example2";
import example3 from "./examples/example3";

const assert = chai.assert;

describe("Testing ModelDifferencing", function() {
  describe("Testing method getNodeDifferences", function() {
    /**
     *
     * Testing with one addition.
     *
     */
    describe("Testing with one addition", function() {
      const nodeDifferences = ModelDifferencing.getNodeDifferences(example1, example2);
      // we expect, that only one node got added
      it("Type should be 'array'.", function() {
        assert.typeOf(nodeDifferences, "array");
      });
      it("Length of nodeDifferences should be 1.", function() {
        assert.lengthOf(nodeDifferences, 1);
      });
      const firstDifference = nodeDifferences[0];
      it("Type should be NodeAddition.", function() {
        assert.equal(firstDifference instanceof NodeAddition, true);
      });
      it("Checking key of node difference.", function() {
        assert.equal(firstDifference.getNodeKey(), "c8f1ce63dabf5be9de90773f")
      });
    });

    /**
     *
     * Testing with one deletion.
     *
     */
    describe("Testing with one deletion", function() {
      const nodeDifferences = ModelDifferencing.getNodeDifferences(example2, example1);
      // we expect, that only one node got deleted
      it("Type should be 'array'.", function() {
        assert.typeOf(nodeDifferences, "array");
      });
      it("Length of nodeDifferences should be 1.", function() {
        assert.lengthOf(nodeDifferences, 1);
      });
      const firstDifference = nodeDifferences[0];
      it("Type should be NodeDeletion.", function() {
        assert.equal(firstDifference instanceof NodeDeletion, true);
      });
      it("Checking key of node difference.", function() {
        assert.equal(firstDifference.getNodeKey(), "c8f1ce63dabf5be9de90773f")
      });
    });

    /**
     *
     * Testing with one updated node.
     *
     */
    describe("Testing with an updated node", function() {
      const nodeDifferences = ModelDifferencing.getNodeDifferences(example2, example3);
      // we expect, that only one node got deleted
      it("Type should be 'array'.", function() {
        assert.typeOf(nodeDifferences, "array");
      });
      it("Length of nodeDifferences should be 1.", function() {
        assert.lengthOf(nodeDifferences, 1);
      });
      const firstDifference = nodeDifferences[0];
      it("Type should be NodeUpdate.", function() {
        assert.equal(firstDifference instanceof NodeUpdate, true);
      });
    });
  });
});
