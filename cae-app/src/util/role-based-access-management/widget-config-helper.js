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
            widget.setAttribute("hidden", "true");
            //widget.style.setProperty("display", "none");
          } else {
            widget.removeAttribute("hidden");
            //widget.style.removeProperty("display");
          }
        }
      });
    }
  }
}
