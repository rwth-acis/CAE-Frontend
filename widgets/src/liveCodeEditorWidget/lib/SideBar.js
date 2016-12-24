/**
 *  A class representing the sidebar of the editor.
 *  @extends EventEmitter
 */

export default class SideBar{

  /**
   *  Creates a sidebar that shows the given panel
   *  @param {panel} panel  - A panel to show in the sidebar
   */

  constructor( panel ){
    this.setPanel( panel );
  }

  /**
   *  Set a new panel for the sidebar
   *  @param {panel} panel  - The new panel to show in the sidebar
   */

  setPanel( panel ){
    this.panel = panel;
    this.getSideBar().find("#sidebar-panel").html( panel.createPanel() );
    this.panel.init();
  }

  /**
   *  Get the jquery element of the sidebar
   */

  getSideBar(){
      return $("div#sidebar");
  }

  /**
   *  Sets the height of the side sidebar
   *  @param {number} height  - The new height
   */

  height( height ){
    this.panel.getPanel().height( height );
  }

  /**
   *  Hides the sidebar panel from the editor
   */

  hide(){
    this.getSideBar().hide();
    this.panel.hide();
  }

  /**
   *  Shows the sidebar panel in the editor
   */

  show(){
    this.panel.show();
    this.getSideBar().show();
  }
}
