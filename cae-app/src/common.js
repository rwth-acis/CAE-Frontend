
export default class Common {

    static setCaeSpace(caeSpace) {
        parent.caeRoom = this.createYjsRoomNameWithSpace(caeSpace);
    }

    static createYjsRoomNameWithSpace(caeSpace) {
        return caeSpace + "-" + this.getYjsRoomName();
    }

    static setYjsRoomName(caeRoomName) {
        localStorage.setItem("yjsRoomWithoutSpaceName", caeRoomName);
    }

    static getYjsRoomName() {
        return localStorage.getItem("yjsRoomWithoutSpaceName");
    }
}

