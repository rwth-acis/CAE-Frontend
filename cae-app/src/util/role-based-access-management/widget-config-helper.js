import Common from "../common";

/**
 * Helper class for widget config objects.
 */
export default class WidgetConfigHelper {

  /**
   * A standard widget config object contains the config for all views, i.e. Frontend Modeling,
   * Microservice Modeling and Application Mashup. In the side menu where the user can edit the
   * widget config, it is not needed to display all of these three views, because as an example the
   * side menu in the Frontend Modeling should only show the widget config for the frontend modeling.
   * Therefore, this helper method may be used to remove the "not needed" views from a given widget
   * config object.
   * @param widgetConfig
   */
  static removeNotOpenedViewsFromConfig(widgetConfig) {
    const currentlyOpened = Common.getComponentTypeByVersionedModelId(Common.getVersionedModelId());
    if(currentlyOpened == "frontend") {
      delete widgetConfig["Microservice Modeling"];
      delete widgetConfig["Application Mashup"];
    } else if(currentlyOpened == "microservice") {
      delete widgetConfig["Frontend Modeling"];
      delete widgetConfig["Application Mashup"];
    } else if(currentlyOpened == "application") {
      delete widgetConfig["Frontend Modeling"];
      delete widgetConfig["Microservice Modeling"];
    }
  }

  static getCurrentlyOpenedWidgets(widgetConfig) {
    WidgetConfigHelper.removeNotOpenedViewsFromConfig(widgetConfig);
    let widgets;
    for(const element of Object.values(widgetConfig)) {
      widgets = element.widgets;
      break;
    }
    return widgets;
  }

  static updateWidgetConfig(shadowRoot) {
    // load widget config
    const widgetConfig = JSON.parse(Common.getCurrentlyOpenedModelingInfo().widgetConfig);
    const widgets = WidgetConfigHelper.getCurrentlyOpenedWidgets(widgetConfig);

    // widget should be disabled
    const allWidgets = shadowRoot.querySelectorAll(".widget");

    for(const [widgetKey, widgetValue] of Object.entries(widgets)) {
      allWidgets.forEach(function(widget) {
        if(widget.getAttribute("widgetconfigname") == widgetKey) {
          if(!widgetValue.enabled) {
            //widget.setAttribute("hidden", "true");
            widget.style.display = "none";
          } else {
            //widget.removeAttribute("hidden");
            widget.style.removeProperty("display");
          }
        }
      });
    }


    /*
      There are some widgets which are combined in one div, e.g. the Palette, Activity and Deployment in
      the application view. When all these widgets are hidden, then still their parent container is not hidden
      and still uses the full width. Therefore, these parent elements are tagged with the class "widget-config-container".
      When all their children are hidden, they should be hidden too.
      We run the following in a loop twice, because there are exists a container in another container (in the frontend
      view we have one container containing the Palette and Activity widget which is part of another container
      together with the Property Browser.
     */
    const widgetConfigContainer = shadowRoot.querySelectorAll(".widget-config-container");

    for(let i = 0; i < 2; i++) {
      widgetConfigContainer.forEach(function (container) {
        // check if every child of the container is hidden
        // (child should be widgets)
        let allChildrenHidden = true;
        for (let i = 0; i < container.children.length; i++) {
          if (container.children[i].style.display != "none") {
            allChildrenHidden = false;
            break;
          }
        }

        if (allChildrenHidden) {
          // all children are hidden, so the parent container can be hidden too
          container.style.display = "none";
        } else {
          // at least one child is not hidden, so the parent container needs to be visible
          // note: parent container is always a flexbox
          container.style.display = "flex";
        }
      });
    }
  }
}
