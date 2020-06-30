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
   * Key used to store the name of the GitHub repository which belongs to the
   * currently opened component.
   * @type {string}
   */
  static KEY_GITHUB_REPO_NAME = "githubRepoName";

  /**
   * Creates the name for the Yjs room for a specific versioned model.
   * This then will be the main Yjs room used for modeling the versioned model.
   *
   * For viewing previous versions of the model, different Yjs rooms are used.
   * Therefore, have a look at getYjsRoomNameForSpecificCommit().
   * @param versionedModelId Id of the versioned model
   * @returns {string} Name of the Yjs room for the specific versioned model.
   */
  static getYjsRoomNameForVersionedModel(versionedModelId) {
    return "versionedModel-" + versionedModelId;
  }

  /**
   * Creates the name for the Yjs room for a specific commit of a versioned model.
   * This then will be the Yjs room for viewing a previous version of a model.
   *
   * For viewing and modeling the current state of the versioned model, a different
   * Yjs room is used. Therefore, have a look at getYjsRoomNameForVersionedModel().
   * @param versionedModelId Id of the versioned model
   * @param commitId Id of the commit, whose model version should be shown in the Yjs room.
   * @returns {string} Name of the Yjs room for the specific commit of the versioned model.
   */
  static getYjsRoomNameForSpecificCommit(versionedModelId, commitId) {
    return "versionedModel-" + versionedModelId + "-" + commitId;
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
   * Removes the userInfo from localStorage.
   * This method may be used when user has logged out.
   */
  static removeUserInfoFromStorage() {
    localStorage.removeItem(this.KEY_USER_INFO);
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

  static getComponentTypeByVersionedModelId(versionedModelId) {
    const modelingInfo = this.getModelingInfo();
    if(modelingInfo.frontend != null) if(modelingInfo.frontend.versionedModelId == versionedModelId) return "frontend";
    if(modelingInfo.microservice != null) if(modelingInfo.microservice.versionedModelId == versionedModelId) return "microservice";
    if(modelingInfo.application != null) if(modelingInfo.application.versionedModelId == versionedModelId) return "application";
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
   * Stores the name of the GitHub repository which belongs to the
   * currently opened component into localStorage.
   * This then gets used by the LiveCodeEditor to fetch the files.
   * @param gitHubRepoName Name of the GitHub repository of the currently opened component.
   */
  static setGitHubRepoName(gitHubRepoName) {
    localStorage.setItem(this.KEY_GITHUB_REPO_NAME, gitHubRepoName);
  }
}

