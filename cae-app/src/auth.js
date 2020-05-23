/**
 * Helper class for creating header for HTTP requests.
 * Sets access token for las2peer OIDC auth to the access token
 * stored in localeStorage.
 * Also adds a "fake" basic auth since las2peer seems to need a password.
 */
export default class Auth {
  static getAuthHeader() {
    return {
      "access-token": localStorage.getItem("access_token"),
      "Authorization": "Basic OnRlc3Q=",
      "Content-Type": "application/json"}
  }
}
