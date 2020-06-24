import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import Common from './common.js';
import Static from './static.js';
import './versioning/versioning-element.js';

/**
 * @customElement
 * @polymer
 */
class FrontendModeling extends PolymerElement {
  
  static get template() {
    return html`
      <style>
        iframe {
          width: 100%;
          height: 100%;
        }

        .maincontainer { 
          display: flex;
          height: 600px;
          flex-flow: row wrap;
        }

        .innercontainerfirst {
          padding: 5px;
          margin: 5px;
          flex: 1;
        }

        .innercontainerfirst:nth-of-type(1) {
          flex: 3;
          display: flex;
          flex-flow: column;
        }

        .innercontainerfirst:nth-of-type(2) {
          flex: 3;
          display: flex;
          flex-flow: column;
        }

        .innercontainerfirst:nth-of-type(3) {
          flex: 2;
          display: flex;  
          flex-flow: column;
        }

        .innercontainersecond {
          padding: 5px;
          margin: 5px;
          flex: 1;
        }

        .innercontainersecond:nth-of-type(1) {
          flex: 4;
        }

        .innercontainersecond:nth-of-type(2) {
          flex: 2;
        }

        .innercontainersecond:nth-of-type(3) {
          flex: 4;
        }
      </style>
      <div class="maincontainer">
        <div id="div-canvas" class="innercontainersecond">
          <iframe id="Canvas" src="{{Static.WebhostURL}}/syncmeta/widget.html"> </iframe>
        </div>
        <div class="innercontainersecond" style="display:flex;flex-flow:column;">
          <div style="display:flex;flex-flow:row;flex:2;">
            <div>
              <iframe id="Palette" src="{{Static.WebhostURL}}/syncmeta/palette.html"> </iframe>
            </div>
            <div>
              <iframe id="User Activity" src="{{Static.WebhostURL}}/syncmeta/activity.html"> </iframe>
            </div>    
          </div>
          <div style="flex: 1">
            <iframe id="Property Browser" src="{{Static.WebhostURL}}/syncmeta/attribute.html"> </iframe>
          </div>
        </div>
        <div class="innercontainersecond">
          <iframe id="Wireframe Editor" src="{{Static.WebhostURL}}/wireframe/index.html"> </iframe>
        </div>
        <!--
        <div class="innercontainersecond">
          <iframe id="Requirements Bazaar Widget" src="{{Static.WebhostURL}}/cae-frontend/requirementsBazaarWidget/index.html"> </iframe>
        </div>
        -->
      </div>
      <div class="maincontainer">
        <div class="innercontainerfirst">
          <iframe id="Live Code Editor" src="{{Static.WebhostURL}}/cae-frontend/liveCodeEditorWidget/FrontendEditorWidget.html"> </iframe>
        </div>
        <div class="innercontainerfirst">
          <versioning-element id="versioning-widget"></versioning-element>
        </div>
        <div class="innercontainerfirst">
          <div style="display:flex;flex-flow:row;flex:1">
            <iframe id="Live Preview" src="{{Static.WebhostURL}}/cae-frontend/liveCodeEditorWidget/LivePreviewWidget.html"> </iframe>
          </div>
          <div style="flex:1">
            <iframe id="Requirements Bazaar Widget" src="{{Static.WebhostURL}}/cae-frontend/requirementsBazaarWidget/index.html"> </iframe>
          </div>
        </div>
      </div>
    `;
  }

  static get properties() {}

  ready() {
    super.ready();
    parent.caeFrames = this.shadowRoot.querySelectorAll("iframe");

    this.reloadCaeRoom();

    const versioningWidget = this.shadowRoot.getElementById("versioning-widget");
    versioningWidget.addEventListener("show-main-canvas", function() {
      // check if main canvas is already shown
      if(this.isMainCanvasShown()) {
        // nothing to do
      } else {
        // first, remove second canvas
        this.removeSecondCanvas();

        // now show main canvas again
        this.showMainCanvas();
      }

    }.bind(this));

    versioningWidget.addEventListener("show-commit-canvas", function() {
      if(this.isMainCanvasShown()) {
        // currently, main canvas is shown
        // hide main canvas and add second canvas used for the specific commit
        this.hideMainCanvas();
        // since parent.caeRoom already got changed by the versioning widget, this new
        // canvas will use a different Yjs room than the main canvas
        this.addSecondCanvas();
      } else {
        // main canvas is not shown, thus another commit is shown currently
        // i.e. a second canvas is shown
        // remove the second canvas and add a new one (otherwise, the used Yjs room will not changed)
        this.removeSecondCanvas();
        this.addSecondCanvas();
      }
    }.bind(this));
  }

  reloadCaeRoom() {
    // load the current Yjs room name from localStorage into
    // parent.caeRoom variable (used by modeling/SyncMeta widget)
    const modelingInfo = Common.getModelingInfo();
    Common.setCaeRoom(modelingInfo.frontend.versionedModelId);
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
   * Returns the HTML Element of the div where the Canvas iFrames are added to.
   * @returns {HTMLElement} Returns the HTML Element of the div where the Canvas iFrames are added to.
   */
  getCanvasDiv() {
    return this.shadowRoot.getElementById("div-canvas");
  }
}

window.customElements.define('frontend-modeling', FrontendModeling);
