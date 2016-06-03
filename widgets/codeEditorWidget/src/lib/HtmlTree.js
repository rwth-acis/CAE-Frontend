import {EventEmitter} from 'events';
/**
 *  A class representing a HTML Tree to reorder HTML elements. It is an abstraction to the jstree jquery plugin
 *  @extends EventEmitter
 */

export default class HtmlTree extends EventEmitter{

  /**
   * Creates a new HTML Tree
   */

  constructor(){
    super();
    this.isEnabled = false;
  }

  /**
   *  Get the jquery element containing the HTML Tree
   *  @return {object} The jquery element
   */

  getPanel(){
    return $("#orderableSegments");
  }

  /**
   *  Initializes the HTML Tree
   */

  init(){
    this.getPanel().jstree({
      "core" : {
        "check_callback" : function (op, node, par, pos, more) {
          if(more && more.dnd) {
            return more.pos !== "i" && par.id == node.parent;
          }
          return true;
        },
        "themes":{
          "name" :"default",
          "icons":false
        },
        "data" : []
      },
      "plugins" : ["dnd"],
      "dnd":{
        "copy" : false
      }
    }).bind("move_node.jstree", (e,data) => {
       if(this.isEnabled){
         this.emit("change",e,data);
       }
    });
  }

  /**
   *  Updates the HTML Tree
   *  @param {Object[]} data  - The new tree nodes to display
   */

  updateTree(data){
    let tree = this.getPanel();
    tree.jstree(true).settings.core.data = data;
    tree.jstree(true).refresh();
  }

  /**
   *  Hides the HTML Tree panel
   */

  hide(){
    this.isEnabled = false;
    this.getPanel().hide();
  }

  /**
   *  Shows the HTML Tree panel
   */

  show(){
    this.isEnabled = true;
    this.getPanel().show();
  }

  /**
   *  Creates the jquery element of the HTML Tree
   */

  createPanel(){
    return $('<div id="orderableSegments"></div>');
  }

  /**
   *  Adds a change listener to the HTML Tree
   *  @param {callback} listener  - The listener, called when the HTML Tree is reordered
   */

  addChangeListener( listener ){
    this.on("change", listener);
  }

  /**
   *  Deletes a change listener from the HTML Tree
   *  @param {callback} listener  - The change listener to delete
   */

  removeChangeListener( listener ){
    this.removeListener("change", listener);
  }
}
