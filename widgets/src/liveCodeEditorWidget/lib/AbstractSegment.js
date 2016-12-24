/**
 * Abstract class for segments
 */
class AbstractSegment{

  /**
   * Creates a new segment
   * @param {string} id - The id of the segments
   * @param {string} parent - An optional id the parent of the segment
   */

  constructor(id,parent){
    this.id=id;
    this.parent = parent;
  }

  /**
   *	Get the id
   *	@return {string} The id
   */

  getId(){
    return this.id;
  }

  /**
   * Get the id of the parent
   * @return {string} The parents id
   */

  getParent(){
    return this.parent;
  }
}
 export default AbstractSegment;