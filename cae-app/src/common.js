import Static from "./static.js";

/**
 * Helper class used for managing Yjs rooms and for storing the information
 * used by the Requirements Bazaar widget in the modeling space and for storing
 * user information.
 *
 * When entering the modeling space of a component, then
 * there needs to be a Yjs room that all the modelers of the
 * component join. Therefore, the name of the Yjs room of a
 * component needs to be the same for every modeler/user of the component.
 *
 * Note: the variable parent.caeRoom gets used by all the modeling and SyncMeta widgets
 * to get the name of the Yjs room which they need to "join" in order to access the metamodel,
 * users lists etc.
 */
export default class Common {

  /**
   * Key used to store the current Yjs room name into localStorage.
   * @type {string}
   */
  static KEY_YJS_ROOM_NAME = "yjsRoomName";

  /**
   * Key used to store the id of the currently used versioned model.
   * @type {string}
   */
  static KEY_VERSIONED_MODEL_ID = "versionedModelId";

  /**
   * Key used to store the information for the requirements bazaar
   * widget.
   * @type {string}
   */
  static KEY_REQ_BAZ_WIDGET = "requirements-bazaar-widget";

  /**
   * Key used to store the information about the currently logged in user.
   * @type {string}
   */
  static KEY_USER_INFO = "userInfo";

  /**
   * Creates the name for the Yjs room for a specific component in a project.
   * @param projectId Id of the project
   * @param componentId Id of the component, where the Yjs room name should be created for
   * @returns {string} Name of the Yjs room for the specific component.
   */
  static getYjsRoomNameForComponent(projectId, componentId) {
    return "project" + projectId + "-component" + componentId;
  }

  /**
   * Sets the current Yjs room name to the one of the given component.
   * Therefore, the parent.caeRoom variable gets set and it also gets stored
   * to the localStorage by calling storeYjsRoomName.
   * @param projectId Id of the project that the component belongs to.
   * @param componentId Id of the component, which should be set as the Yjs room.
   */
  static setCaeRoom(projectId, componentId) {
    parent.caeRoom = this.getYjsRoomNameForComponent(projectId, componentId);
    this.storeYjsRoomName(parent.caeRoom);
  }

  /**
   * Loads the Yjs room name from localStorage into the
   * parent.caeRoom variable.
   */
  static loadCaeRoom() {
    parent.caeRoom = this.getYjsRoomName();
  }

  /**
   * Stores the given room name into localStorage.
   * @param caeRoomName Room name that should be saved to localStorage.
   */
  static storeYjsRoomName(caeRoomName) {
    localStorage.setItem(this.KEY_YJS_ROOM_NAME, caeRoomName);
  }

  /**
   * Returns the Yjs room name which is currently stored in
   * localStorage.
   * @returns {string}
   */
  static getYjsRoomName() {
    return localStorage.getItem(this.KEY_YJS_ROOM_NAME);
  }

  /**
   * Stores the id of the currently used versioned model into localStorage.
   * @param versionedModelId Id of the versioned model which should be stored.
   */
  static setVersionedModelId(versionedModelId) {
    localStorage.setItem(this.KEY_VERSIONED_MODEL_ID, versionedModelId);
  }

  /**
   * Returns the versioned model id which is currently stored in localStorage.
   * @returns {string}
   */
  static getVersionedModelId() {
    return localStorage.getItem(this.KEY_VERSIONED_MODEL_ID);
  }

  /**
   * Tries to load the model from the given Yjs room.
   * @param roomName Room name of the Yjs room where the model should be loaded from.
   * @returns {Promise<unknown>}
   */
  static getModelFromYjsRoom(roomName) {
    return new Promise((resolve) => {
      Y({
        db: {
          name: "memory" // store the shared data in memory
        },
        connector: {
          name: "websockets-client", // use the websockets connector
          room: roomName,
          options: { resource: Static.YjsResourcePath},
          url: Static.YjsAddress
        },
        share: { // specify the shared content
          data: 'Map'
        }
      }).then(function(y) {
        // retrieve current model from the yjs room
        if (y.share.data.get('model')) {
          const data = y.share.data.get('model');

          // check if wireframe model exists (this should only be the case for frontend components)
          const wireframeModel = y.share.data.get('wireframe');
          if(wireframeModel) {
            data.wireframe = wireframeModel;
          }

          resolve(data);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Stores the information about the connected Requirements Bazaar
   * category to localStorage.
   * @param selectedProjectId Id of the selected Requirements Bazaar project
   * @param selectedCategoryId Id of the selected Requirements Bazaar category
   */
  static storeRequirementsBazaarProject(selectedProjectId, selectedCategoryId) {
    localStorage.setItem(this.KEY_REQ_BAZ_WIDGET, JSON.stringify({
      selectedProjectId: selectedProjectId,
      selectedCategoryId: selectedCategoryId
    }));
  }

  /**
   * Stores the information about the currently logged in user.
   * @param userInfo Info to store in localStorage.
   */
  static storeUserInfo(userInfo) {
    localStorage.setItem(this.KEY_USER_INFO, JSON.stringify(userInfo));
  }

  /**
   * Reads out the GitHub username which is stored to localStorage.
   * Attention: The GitHub username might be null, if none is stored in the database.
   * @returns {*}
   */
  static getUsersGitHubUsername() {
    return JSON.parse(localStorage.getItem(this.KEY_USER_INFO)).gitHubUsername;
  }
}

