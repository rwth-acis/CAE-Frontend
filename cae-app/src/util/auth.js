/**
 * Helper class for user auth.
 */
export default class Auth {

  static KEY_ACCESS_TOKEN = "access_token";
  static KEY_USERINFO_ENDPOINT = "userinfo_endpoint";

  /**
   * Helper method for creating header for HTTP requests.
   * Sets access token for las2peer OIDC auth to the access token
   * stored in localeStorage.
   * Also adds a "fake" basic auth since las2peer seems to need a password.
   */
  static getAuthHeader() {
    return {
      "access-token": localStorage.getItem(this.KEY_ACCESS_TOKEN),
      "Authorization": "Basic OnRlc3Q=",
      "Content-Type": "application/json"}
  }

  /**
   * Loads the access token stored in localStorage.
   * @returns {string} Access token which is stored in localStorage.
   */
  static getAccessToken() {
    return localStorage.getItem(this.KEY_ACCESS_TOKEN);
  }

  /**
   * Removes the access token and userinfo endpoint
   * from localStorage.
   * This can be used after user has logged out or when the access
   * token expired.
   */
  static removeAuthDataFromLocalStorage() {
    localStorage.removeItem(this.KEY_ACCESS_TOKEN);
    localStorage.removeItem(this.KEY_USERINFO_ENDPOINT);
  }

  /**
   * Stores the given access token and the userinfo endpoint to localStorage.
   * @param access_token Access token to store.
   */
  static setAuthDataToLocalStorage(access_token) {
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("userinfo_endpoint", "https://api.learning-layers.eu/o/oauth2/userinfo");
  }

  /**
   * Checks if access token is stored in localStorage.
   * @returns {boolean} Whether access token is stored in localStorage.
   */
  static isAccessTokenAvailable() {
    return localStorage.getItem(this.KEY_ACCESS_TOKEN) !== null;
  }
}
