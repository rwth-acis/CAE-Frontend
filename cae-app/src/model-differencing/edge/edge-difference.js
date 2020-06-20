import Difference from "../difference";

export default class EdgeDifference extends Difference {

  constructor(edgeKey, edgeValue, edgeSource, edgeTarget) {
    super();
    this.edgeKey = edgeKey;
    this.edgeValue = edgeValue;
    this.edgeSource = edgeSource;
    this.edgeTarget = edgeTarget;
  }

  toHTMLElement() {
    const element = super.toHTMLElement();

    // set text value
    const textElement = element.getElementsByClassName("text")[0];
    textElement.innerText = "Edge from " + this.edgeSource.type + " to " + this.edgeTarget.type;

    return element;
  }

}
