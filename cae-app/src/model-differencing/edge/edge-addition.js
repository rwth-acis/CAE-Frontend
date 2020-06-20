import EdgeDifference from "./edge-difference";

export default class EdgeAddition extends EdgeDifference {

  constructor(edgeKey, edgeValue, edgeSource, edgeTarget) {
    super(edgeKey, edgeValue, edgeSource, edgeTarget);
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
