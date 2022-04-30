
export default class GitHubHelper {

  static GITHUB_ACCESS_TOKEN_URL = "https://api.learning-layers.eu/auth/realms/main/broker/github/token";

  static validGitHubRepoURL(url) {
    return new RegExp("^https://(www.){0,1}github.com/(\\w|\\-){1,}/(\\w|\\-){1,}(\\.git|\/){0,1}$", "g").test(url);
  }

  static getGitHubAccessToken(keycloakToken) {
    return new Promise((resolve, reject) => fetch(GitHubHelper.GITHUB_ACCESS_TOKEN_URL, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + keycloakToken
      }
    }).then(response => {
      if(response.status == 200) {
        return response.text();
      } else {
        reject();
      }
    }).then(text => {
      const gitHubAccessToken = text.split("access_token=")[1].split("&")[0];
      resolve(gitHubAccessToken);
    }));
  }
}
