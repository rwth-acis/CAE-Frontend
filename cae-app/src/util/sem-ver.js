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

  /**
   * Whether the given version number is of Semantic Version format.
   * @param versionNumber Version number to check.
   * @returns {boolean} Whether the given version number is of Semantic Version format.
   */
  static isSemanticVersionNumber(versionNumber) {
    return /^\d+\.\d+\.\d+$/.test(versionNumber);
  }

  /**
   * Whether the second version number is greater or equal than the first one.
   * @param number1 Object with major, minor, patch attributes.
   * @param number2 Object with major, minor, patch attributes.
   * @returns {boolean} Whether the second version number is greater or equal than the first one.
   */
  static greaterEqual(number1, number2) {
    if(number2.major > number1.major) return true;
    if(number2.major == number1.major && number2.minor > number1.minor) return true;
    if(number2.major == number1.major && number2.minor == number1.minor && number2.patch >= number1.patch) return true;
    return false;
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
}
