import Segment from "./Segment";
/**
 * Special class for protected segments that ensures that the content cannnot be modified
 */
export default class ProtectedSegment extends Segment{
  setValue(){
    throw new Error("You must not change a protected segment");
  }
}
