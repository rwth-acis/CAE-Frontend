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
}
