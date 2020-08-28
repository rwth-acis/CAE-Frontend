import Static from "../static.js";

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
   * Key used to store whether the dialog (which should verify that an updated
   * semantic version number is justified) should be shown or not.
   * Note: This might not be set to anything, then the dialog should always be displayed.
   * @type {string}
   */
  static KEY_DISABLE_SEMVER_VERIFY_DIALOG = "disable_semver_verify_dialog";

  /**
   * Creates the name for the Yjs room for a specific versioned model.
   * This then will be the main Yjs room used for modeling the versioned model.
   *
   * For viewing previous versions of the model, different Yjs rooms are used.
   * Therefore, have a look at getYjsRoomNameForSpecificCommit().
   * @param versionedModelId Id of the versioned model
   * @returns {string} Name of the Yjs room for the specific versioned model.
   */
  static getYjsRoomNameForVersionedModel(versionedModelId, isDependency) {
    let name =  "versionedModel-" + versionedModelId;
    if(isDependency) name = name + "-dependency";
    return name;
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
  static getYjsRoomNameForSpecificCommit(versionedModelId, commitId, isDependency) {
    let name = "versionedModel-" + versionedModelId + "-" + commitId;
    if(isDependency) name = name + "-dependency";
    return name;
  }

  /**
   * Sets the current Yjs room name to the one of the given versioned model.
   * Therefore, the parent.caeRoom variable gets set and it also gets stored
   * to the localStorage by calling storeYjsRoomName.
   * @param versionedModelId Id of the versioned model
   */
  static setCaeRoom(versionedModelId, isDependency) {
    parent.caeRoom = this.getYjsRoomNameForVersionedModel(versionedModelId, isDependency);
  }

  /**
   * Stores the information about the connected Requirements Bazaar
   * category to localStorage.
   * @param selectedProjectId Id of the selected Requirements Bazaar project
   * @param selectedCategoryId Id of the selected Requirements Bazaar category
   */
  static storeRequirementsBazaarProject(versionedModelId, selectedProjectId, selectedCategoryId) {
    const content = {
      selectedProjectId: selectedProjectId,
      selectedCategoryId: selectedCategoryId
    };

    if(!localStorage.getItem(this.KEY_REQ_BAZ_WIDGET)) {
      let item = {};
      item[versionedModelId] = content;
      localStorage.setItem(this.KEY_REQ_BAZ_WIDGET, JSON.stringify(item));
    } else {
      const item = JSON.parse(localStorage.getItem(this.KEY_REQ_BAZ_WIDGET));
      item[versionedModelId] = content;
      localStorage.setItem(this.KEY_REQ_BAZ_WIDGET, JSON.stringify(item));
    }
  }

  /**
   * Returns the information about the currently logged in user.
   * @returns {string}
   */
  static getUserInfo() {
    return JSON.parse(localStorage.getItem(this.KEY_USER_INFO));
  }

  /**
   * Stores the information about the currently logged in user.
   * @param userInfo Info to store in localStorage.
   */
  static storeUserInfo(userInfo) {
    localStorage.setItem(this.KEY_USER_INFO, JSON.stringify(userInfo));
  }

  /**
   * Updates the GitHub access token stored in the user info in localStorage.
   * @param gitHubAccessToken GitHub access token.
   */
  static storeUserInfoGitHubAccessToken(gitHubAccessToken) {
    if(this.getUserInfo()) {
      const userInfo = this.getUserInfo();
      userInfo.gitHubAccessToken = gitHubAccessToken;
      this.storeUserInfo(userInfo);
    }
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
   * Updates the GitHub username stored in localStorage.
   * @param gitHubUsername
   */
  static storeGitHubUsername(gitHubUsername) {
    if(this.getUserInfo()) {
      const userInfo = this.getUserInfo();
      userInfo.gitHubUsername = gitHubUsername;
      this.storeUserInfo(userInfo);
    }
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
   * Loads the modeling info of the currently opened component type from localStorage.
   * @returns {*} Modeling info of the currently opened component type from localStorage.
   */
  static getCurrentlyOpenedModelingInfo() {
    return Common.getModelingInfo()[Common.getComponentTypeByVersionedModelId(Common.getVersionedModelId())];
  }

  static getComponentTypeByVersionedModelId(versionedModelId) {
    const modelingInfo = this.getModelingInfo();
    if(modelingInfo.frontend != null) if(modelingInfo.frontend.versionedModelId == versionedModelId) return "frontend";
    if(modelingInfo.microservice != null) if(modelingInfo.microservice.versionedModelId == versionedModelId) return "microservice";
    if(modelingInfo.application != null) if(modelingInfo.application.versionedModelId == versionedModelId) return "application";
  }

  static getComponentNameByVersionedModelId(versionedModelId) {
    const modelingInfo = this.getModelingInfo();
    const componentType = Common.getComponentTypeByVersionedModelId(versionedModelId);
    return modelingInfo[componentType].name;
  }

  static isCurrentComponentDependency() {
    const type = Common.getComponentTypeByVersionedModelId(Common.getVersionedModelId());
    if(type == "frontend") return Common.getModelingInfo().frontend.isDependency;
    else if(type == "microservice") return Common.getModelingInfo().microservice.isDependency;
    else return Common.getModelingInfo().application.isDependency;
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
   * This then gets used by the LiveCodeEditor to fetch the files and by the versioning widget
   * to link commits to GitHub commits.
   * @param gitHubRepoName Name of the GitHub repository of the currently opened component.
   */
  static setGitHubRepoName(gitHubRepoName) {
    localStorage.setItem(this.KEY_GITHUB_REPO_NAME, gitHubRepoName);
  }

  /**
   * Returns the name of the GitHub repo which corresponds to the currently
   * opened component.
   * @returns {string}
   */
  static getGitHubRepoName() {
    return localStorage.getItem(this.KEY_GITHUB_REPO_NAME);
  }

  /**
   * Returns true, when the semantic versioning update verification dialog is disabled; false otherwise.
   * @returns {boolean} True, when the semantic versioning update verification dialog is disabled; false otherwise.
   */
  static semVerVerifyDialogDisabled() {
    return localStorage.getItem(this.KEY_DISABLE_SEMVER_VERIFY_DIALOG) == "true";
  }

  /**
   * Stores the information, that the dialog to verify that a version update is justified, should be disabled
   * and never shown again.
   */
  static disableSemVerVerifyDialog() {
    localStorage.setItem(this.KEY_DISABLE_SEMVER_VERIFY_DIALOG, "true");
  }
}

