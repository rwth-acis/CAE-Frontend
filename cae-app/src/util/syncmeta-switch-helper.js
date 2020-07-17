import Static from "../static";

/**
 * The SyncMetaSwitchHelper is used in the different modeling pages to handle
 * the switching between the main modeling (which uses the main Yjs room) of the components
 * and the view-mode for previous model versions.
 * Therefore it switches some SyncMeta widgets, e.g. the Canvas.
 * This switching should be used after the parent.caeRoom variable has changed.
 * Then the new SyncMeta widgets automatically use the new caeRoom.
 *
 * Since the code is the same for the different modeling pages, it gets
 * bundled here. Calling the SyncMetaSwitchHelper constructor is enough and then
 * the events coming from the commit-list when a user selects a commit are
 * automatically handled.
 *
 * Therefore, the modeling pages need to fulfill the following requirements:
 * - The versioning element must be included and needs to have the id set to "versioning-widget".
 * - There must exist an iFrame used for the main Canvas whose id is "Canvas".
 * - This Canvas iFrame must be element of a div with the id "div-canvas". This div then also gets used
 * for the second Canvas.
 * - There must exist an iFrame with the id "Property Browser" inside a div with the id "div-pb".
 */
export default class SyncMetaSwitchHelper {

  constructor(shadowRoot) {
    this.shadowRoot = shadowRoot;

    const versioningWidget = this.shadowRoot.getElementById("versioning-widget");
    versioningWidget.addEventListener("show-main-canvas", function() {
      // check if main canvas is already shown
      if(this.isMainCanvasShown()) {
        // nothing to do
      } else {
        // first, remove second canvas
        this.removeSecondCanvas();
        this.removePropertyBrowser();

        // now show main canvas again
        this.showMainCanvas();
        this.addNewPropertyBrowser();
        parent.caeFrames = this.shadowRoot.querySelectorAll("iframe");
      }

    }.bind(this));

    versioningWidget.addEventListener("show-commit-canvas", function() {
      if(this.isMainCanvasShown()) {
        // currently, main canvas is shown
        // hide main canvas and add second canvas used for the specific commit
        this.hideMainCanvas();
        this.removePropertyBrowser();
        // since parent.caeRoom already got changed by the versioning widget, this new
        // canvas will use a different Yjs room than the main canvas
        this.addSecondCanvas();
        this.addNewPropertyBrowser();
      } else {
        // main canvas is not shown, thus another commit is shown currently
        // i.e. a second canvas is shown
        // remove the second canvas and add a new one (otherwise, the used Yjs room will not changed)
        this.removeSecondCanvas();
        this.removePropertyBrowser();
        this.addSecondCanvas();
        this.addNewPropertyBrowser();
      }
      parent.caeFrames = this.shadowRoot.querySelectorAll("iframe");
    }.bind(this));
  }

  /**
   * Whether the main modeling Canvas is shown.
   * @returns {boolean} Whether the main modeling Canvas is shown.
   */
  isMainCanvasShown() {
    return this.getMainCanvasIFrame().style.getPropertyValue("display") != "none";
  }

  /**
   * Hides the main modeling Canvas.
   */
  hideMainCanvas() {
    this.getMainCanvasIFrame().style.setProperty("display", "none");
  }

  /*
   * Removes the current Property Browser iFrame.
   */
  removePropertyBrowser() {
    this.getPropertyBrowserIFrame().remove();
  }

  /**
   * Shows the main modeling Canvas.
   */
  showMainCanvas() {
    this.getMainCanvasIFrame().style.removeProperty("display");
  }

  /**
   * Adds a second Canvas to the Canvas div.
   * This Canvas then can be used to show the model at a different state, i.e.
   * showing a different model version than the main Canvas does.
   * Therefore, the Yjs room (parent.caeRoom) needs to be changed before calling this method.
   */
  addSecondCanvas() {
    const secondCanvas = document.createElement("iframe");
    secondCanvas.setAttribute("id", "SecondCanvas");
    secondCanvas.setAttribute("src", Static.WebhostURL + "/syncmeta/widget.html");
    this.getCanvasDiv().appendChild(secondCanvas);
  }

  /**
   * Adds a new Property Browser to the Property Browser div.
   */
  addNewPropertyBrowser() {
    const newPB = document.createElement("iframe");
    newPB.setAttribute("id", "Property Browser");
    newPB.setAttribute("src", Static.WebhostURL + "/syncmeta/attribute.html");
    this.getPropertyBrowserDiv().appendChild(newPB);
  }

  /**
   * Removes the second Canvas.
   * This can be used, when the main modeling Canvas should be shown again.
   */
  removeSecondCanvas() {
    this.shadowRoot.getElementById("SecondCanvas").remove();
  }

  /**
   * Returns the HTML Element of the iFrame used for the main modeling Canvas.
   * This is the Canvas which gets used for the actual modeling of the component.
   * @returns {HTMLElement} HTML Element of the iFrame used for the main modeling Canvas.
   */
  getMainCanvasIFrame() {
    return this.shadowRoot.getElementById("Canvas");
  }

  /**
   * Returns the HTML Element of the iFrame used for the main modeling Property Browser.
   * This is the Property Browser which gets used for the actual modeling of the component.
   * @returns {HTMLElement} HTML Element of the iFrame used for the main modeling Property Browser.
   */
  getPropertyBrowserIFrame() {
    return this.shadowRoot.getElementById("Property Browser");
  }

  /**
   * Returns the HTML Element of the div where the Canvas iFrames are added to.
   * @returns {HTMLElement} Returns the HTML Element of the div where the Canvas iFrames are added to.
   */
  getCanvasDiv() {
    return this.shadowRoot.getElementById("div-canvas");
  }

  /**
   * Returns the HTML Element of the div where the Property Browser iFrames are added to.
   * @returns {HTMLElement} Returns the HTML Element of the div where the Property Browser iFrames are added to.
   */
  getPropertyBrowserDiv() {
    return this.shadowRoot.getElementById("div-pb");
  }


}
