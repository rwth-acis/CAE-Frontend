export default class Difference {

  constructor(key, value) {
    this.key = key;
    this.value = value;
  }

  getKey() {
    return this.key;
  }

  getValue() {
    return this.value;
  }

  toHTMLElement() {
    // create an outer div with some padding to all sides
    const outerDiv = document.createElement("div");
    outerDiv.style.setProperty("width", "100%");
    outerDiv.style.setProperty("padding-left", "0.5em");
    outerDiv.style.setProperty("padding-right", "0.5em");
    outerDiv.style.setProperty("padding-top", "0.5em");
    outerDiv.style.setProperty("padding-bottom", "0.5em");

    // the top div is the one thats always visible
    const topDiv = document.createElement("div");
    topDiv.style.setProperty("display", "flex");

    // add icon to top div (this will be +,-, or an edit icon)
    const ironIcon = document.createElement("iron-icon");
    topDiv.appendChild(ironIcon);

    // add text to top div (small description of what has changed)
    const text = document.createElement("p");
    text.setAttribute("class", "text");
    text.style.setProperty("margin-top", "auto");
    text.style.setProperty("margin-bottom", "auto");
    topDiv.appendChild(text);

    // add button to expand/collapse details (containing more information on the changed element)
    const buttonExpandCollapse = document.createElement("iron-icon");
    buttonExpandCollapse.icon = "icons:expand-more";
    buttonExpandCollapse.addEventListener("click", _ => {
      console.log("clicked");
      if(buttonExpandCollapse.icon == "icons:expand-more") {
        // expand details
        buttonExpandCollapse.icon = "icons:expand-less";
        const detailsElement = outerDiv.getElementsByClassName("details")[0];
        detailsElement.style.removeProperty("display");
      } else {
        // collapse details
        buttonExpandCollapse.icon = "icons:expand-more";
        const detailsElement = outerDiv.getElementsByClassName("details")[0];
        detailsElement.style.setProperty("display", "none");
      }
    });
    buttonExpandCollapse.style.setProperty("margin-left", "auto");
    buttonExpandCollapse.style.setProperty("margin-right", "0.5em");
    topDiv.appendChild(buttonExpandCollapse);

    outerDiv.appendChild(topDiv);

    const detailsDiv = document.createElement("div");
    detailsDiv.setAttribute("class", "details");
    detailsDiv.style.setProperty("display", "none");
    detailsDiv.style.setProperty("padding-left", "24px");
    outerDiv.appendChild(detailsDiv);

    return outerDiv;
  }
}
