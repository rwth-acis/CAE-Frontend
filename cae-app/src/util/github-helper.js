export default class GitHubHelper {


  static validGitHubRepoURL(url) {
    return new RegExp("^https://(www.){0,1}github.com/(\\w|\\-){1,}/(\\w|\\-){1,}(\\.git|\/){0,1}$", "g").test(url);
  }
}
