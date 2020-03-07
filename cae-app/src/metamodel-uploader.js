import frontend_vls from './vls/frontendComponent_vls.js';
import microservice_vls from './vls/microservice_vls.js';
import application_vls from './vls/application_vls.js';
import Common from './common.js';
import Static from './static.js';

export default class MetamodelUploader {

    static uploadAll() {
        return Promise.all(
            [
                [Common.createYjsRoomNameWithSpace(Static.FrontendSpaceId), frontend_vls],
                [Common.createYjsRoomNameWithSpace(Static.MicroserviceSpaceId), microservice_vls],
                [Common.createYjsRoomNameWithSpace(Static.ApplicationSpaceId), application_vls]
            ].map(i => this.uploadSingle(i[0], i[1]))
        );
    }

    static uploadSingle(caeRoom, vls) {
        new Promise((resolve, reject) => {
            Y({
                db: {
                    name: "memory" // store the shared data in memory
                },
                connector: {
                    name: "websockets-client", // use the websockets connector
                    room: caeRoom,
                    url:"{YJS_ADDRESS}"
                },
                share: { // specify the shared content
                    data: 'Map'
                },
                type:["Text","Map"],
                sourceDir: '/bower_components'
            }).then(function(y) {
                y.share.data.set('metamodel', vls);
                resolve();
            });
        });
    }
}