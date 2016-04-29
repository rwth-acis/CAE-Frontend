import Segment from "./Segment";

export default class ProtectedSegment extends Segment{
  setValue(){
    throw new Error("You must not change a protected segment");
  }
}
