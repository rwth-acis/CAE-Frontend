import EdgeDifference from "./edge-difference";

export default class EdgeDeletion extends EdgeDifference {

  constructor(edgeKey, edgeValue, edgeSource, edgeTarget) {
    super(edgeKey, edgeValue, edgeSource, edgeTarget);
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
