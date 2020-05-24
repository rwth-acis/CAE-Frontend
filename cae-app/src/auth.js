/**
 * Helper class for user auth.
 */
export default class Auth {

  /**
   * Helper method for creating header for HTTP requests.
   * Sets access token for las2peer OIDC auth to the access token
   * stored in localeStorage.
   * Also adds a "fake" basic auth since las2peer seems to need a password.
   */
  static getAuthHeader() {
    return {
      "access-token": localStorage.getItem("access_token"),
      "Authorization": "Basic OnRlc3Q=",
      "Content-Type": "application/json"}
  }

  /**
   * Removes the access token and userinfo endpoint
   * from localStorage.
   * This can be used after user has logged out or when the access
   * token expired.
   */
  static removeAuthDataFromLocalStorage() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("userinfo_endpoint");
  }
}
