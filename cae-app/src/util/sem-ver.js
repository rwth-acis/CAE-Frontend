/**
 * Util/Helper class for Semantic Version numbers.
 */
export default class SemVer {

  /**
   * Converts the Semantic Version number from string to an object with one attribute for every number part.
   * @param versionNumber Version number as a string in the Semantic Version format.
   * @returns {{patch: *, major: *, minor: *}}
   */
  static extractSemanticVersionParts(versionNumber) {
    const major = versionNumber.split(".")[0];
    const minor = versionNumber.split(".")[1];
    const patch = versionNumber.split(".")[2];
    return {
      major: major,
      minor: minor,
      patch: patch
    };
  }

  static objectToString(versionTag) {
    return versionTag.major + "." + versionTag.minor + "." + versionTag.patch;
  }

  /**
   * Creates an object for the semantic version number.
   * @param major
   * @param minor
   * @param patch
   * @returns {{patch: *, major: *, minor: *}}
   */
  static getObject(major, minor, patch) {
    return {
      major,
      minor,
      patch
    }
  }

  /**
   * Whether the given version number is of Semantic Version format.
   * @param versionNumber Version number to check.
   * @returns {boolean} Whether the given version number is of Semantic Version format.
   */
  static isSemanticVersionNumber(versionNumber) {
    return /^\d+\.\d+\.\d+$/.test(versionNumber);
  }

  /**
   * Checks whether all the commit tags of the commits given in the list match the
   * semantic versioning format.
   * @param commitList
   * @returns {boolean} Whether every commit tag of the commits in commitList matches the semantic versioning format.
   */
  static allSemanticVersionTags(commitList) {
    let allSemVerTags = true;
    for(const commit of commitList) {
      if(commit.versionTag) {
        if(!SemVer.isSemanticVersionNumber(commit.versionTag)) {
          allSemVerTags = false;
          break;
        }
      }
    }
    return allSemVerTags;
  }

  /**
   * Whether the second version number is greater than the first one.
   * @param number1 Object with major, minor, patch attributes.
   * @param number2 Object with major, minor, patch attributes.
   * @returns {boolean} Whether the second version number is greater or equal than the first one.
   */
  static greater(number1, number2) {
    if(number2.major > number1.major) return true;
    if(number2.major == number1.major && number2.minor > number1.minor) return true;
    if(number2.major == number1.major && number2.minor == number1.minor && number2.patch > number1.patch) return true;
    return false;
  }

  /**
   * Given two version numbers (in object form) it either returns "MAJOR", "MINOR" or "PATCH", depending on
   * which of these parts of the version number has been increased.
   * Note: This method assumes that only one part of the version number got increased.
   * @param previousVersionNumber Should be the "lower" one.
   * @param newVersionNumber Should be the "higher" one.
   * @returns {string} Either "MAJOR", "MINOR" or "PATCH".
   */
  static getChangedPart(previousVersionNumber, newVersionNumber) {
    if(newVersionNumber.major > previousVersionNumber.major) return "MAJOR";
    else if(newVersionNumber.minor > previousVersionNumber.minor) return "MINOR";
    else return "PATCH";
  }
}
