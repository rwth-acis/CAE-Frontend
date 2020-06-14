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
   * Key used to store the information about the currently opened tabs in the modeling space.
   * @type {string}
   */
  static KEY_MODELING_INFO = "modelingInfo";

  /**
   * Key used to store the id of the currently used versioned model.
   * @type {string}
   */
  static KEY_VERSIONED_MODEL_ID = "versionedModelId";

  /**
   * Creates the name for the Yjs room for a specific versioned model.
   * @param versionedModelId Id of the versioned model
   * @returns {string} Name of the Yjs room for the specific versioned model.
   */
  static getYjsRoomNameForVersionedModel(versionedModelId) {
    return "versionedModel-" + versionedModelId;
  }

  /**
   * Sets the current Yjs room name to the one of the given versioned model.
   * Therefore, the parent.caeRoom variable gets set and it also gets stored
   * to the localStorage by calling storeYjsRoomName.
   * @param versionedModelId Id of the versioned model
   */
  static setCaeRoom(versionedModelId) {
    parent.caeRoom = this.getYjsRoomNameForVersionedModel(versionedModelId);
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

  /**
   * Stores the modeling info to localStorage.
   * @param modelingInfo
   */
  static storeModelingInfo(modelingInfo) {
    localStorage.setItem(this.KEY_MODELING_INFO, JSON.stringify(modelingInfo));
  }

  /**
   * Loads the modeling info from localStorage.
   * @returns {string}
   */
  static getModelingInfo() {
    return JSON.parse(localStorage.getItem(this.KEY_MODELING_INFO));
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
}

