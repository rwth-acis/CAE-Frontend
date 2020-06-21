/**
 * Class used as a base for all differences that appear between two
 * model versions.
 */
export default class Difference {

  /**
   * Constructor setting key and value.
   * @param key Key of the element that has changed, i.e. a SyncMeta id.
   * @param value Value of the element that has changed.
   */
  constructor(key, value) {
    this.key = key;
    this.value = value;
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

  /**
   * Creates the HTML representation of the model difference.
   * @param checkboxListener Only set when checkbox should be displayed.
   * @returns {HTMLDivElement} HTML representation of the model difference.
   */
  toHTMLElement(checkboxListener) {
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

    if(checkboxListener) {
      // add checkbox to top div (for selecting if the difference should be included in a commit)
      const checkbox = document.createElement("paper-checkbox");
      checkbox.style.setProperty("margin-top", "auto");
      checkbox.style.setProperty("margin-bottom", "auto");
      checkbox.addEventListener("change", _ => checkboxListener(checkbox.checked));
      topDiv.appendChild(checkbox);
    }

    // add icon to top div (this will be +,-, or an edit icon)
    const ironIcon = document.createElement("iron-icon");
    // ensure that none of the icons shrinks (because then some icons are smaller than others)
    ironIcon.style.setProperty("flex-shrink", "0");
    ironIcon.style.setProperty("margin-top", "auto");
    ironIcon.style.setProperty("margin-bottom", "auto");
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
    // ensure that none of the icons shrinks (because then some icons are smaller than others)
    buttonExpandCollapse.style.setProperty("flex-shrink", "0");
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
