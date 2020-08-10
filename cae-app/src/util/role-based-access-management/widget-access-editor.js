/**
 * Helper class for the "edit user" dialog of the project info element.
 * Can be used to create a HTML element for editing the widgets that a user will see.
 */
export default class WidgetAccessEditor {

  constructor(config, changeListener) {
    this.config = config;

    this.editor = document.createElement("div");
    this.editor.style.setProperty("display", "flex");

    // get widget config views
    const views = this.config;
    let first = true;
    for(const [viewName, viewValue] of Object.entries(views)) {
      const viewDiv = document.createElement("div");
      if(!first) {
        // not the first viewDiv, so add space to the left and draw border
        viewDiv.style.setProperty("border-left", "thin solid #e1e1e1");
        viewDiv.style.setProperty("margin-left", "1em");
        viewDiv.style.setProperty("padding-left", "1em");
      }

      /*
       * View name
       */
      const viewNameH = document.createElement("h3");
      viewNameH.innerText = viewName;
      viewDiv.appendChild(viewNameH);

      /*
       * Checkboxes for selecting visible widgets for role
       */
      const checkboxes = document.createElement("div");
      checkboxes.style.setProperty("display", "flex");
      checkboxes.style.setProperty("flex-flow", "column");

      let firstCheckbox = true;
      for(const [widgetName, widgetValue] of Object.entries(viewValue.widgets)) {
        /*
         * Create one checkbox for every widget of the view
         */
        const checkbox = document.createElement("paper-checkbox");
        if(!firstCheckbox) {
          checkbox.style.setProperty("margin-top", "0.5em");
        }
        checkbox.innerText = widgetName;
        if(widgetValue.enabled) {
          checkbox.setAttribute("checked", true);
        }
        checkbox.addEventListener("change", _ => {
          widgetValue.enabled = checkbox.checked;
          if(changeListener) changeListener();
        });
        checkboxes.appendChild(checkbox);
        firstCheckbox = false;
      }

      viewDiv.appendChild(checkboxes);

      this.editor.appendChild(viewDiv);
      first = false;
    }
  }

  /**
   * Returns the widget access editor as a HTML element which can be added to
   * the "edit-role" dialog.
   * @returns {HTMLDivElement} Editor as HTML element.
   */
  getHTMLElement() {
    return this.editor;
  }

  /**
   * Returns the current config.
   * @returns {*}
   */
  getWidgetConfig() {
    return this.config;
  }

}
