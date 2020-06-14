import frontend_vls from './vls/frontendComponent_vls.js';
import microservice_vls from './vls/microservice_vls.js';
import application_vls from './vls/application_vls.js';
import Common from './common.js';
import Static from "./static";

/**
 * Helper class for upload the metamodels for the components.
 * When the user want to model a component, then the SyncMeta widgets as the
 * Canvas use a metamodel, which therefore needs to be uploaded in the Yjs room.
 * This helper class uploads the Visual Language Specification (VLS) of the metamodel
 * for a component.
 * There are different metamodels and thus different VLS used for the different types
 * of models (e.g. frontend, microservice,...). Currently the files containing
 * the VLS are stored in the "vls" folder.
 */
export default class MetamodelUploader {

  /**
   * Uploads the correct metamodel/VLS for the given component.
   * The component type gets used to identify which metamodel/VLS
   * gets uploaded (e.g. frontend, microservice,...).
   * @param component The full component (containing type attribute) where the metamodel
   * should be uploaded for.
   * @returns {*|Promise<unknown>|Promise}
   */
  static uploadForComponent(component) {
    // get the correct VLS depending on the type of the given component
    let vls;
    if(component.type == "frontend") {
      vls = frontend_vls;
    } else if(component.type == "microservice") {
      vls = microservice_vls;
    } else {
      vls = application_vls;
    }

    return this.uploadSingle(Common.getYjsRoomNameForVersionedModel(component.versionedModelId), vls);
  }

  /**
   * Promise for uploading the VLS for a single component.
   * @param caeRoom Yjs room name where the VLS should be uploaded to.
   * @param vls Metamodel/VLS which should be uploaded.
   * @returns {Promise<unknown>}
   */
  static uploadSingle(caeRoom, vls) {
    return new Promise((resolve, reject) => {
      Y({
        db: {
          name: "memory" // store the shared data in memory
        },
        connector: {
          name: "websockets-client", // use the websockets connector
          room: caeRoom,
          options: { resource: Static.YjsResourcePath},
          url: Static.YjsAddress
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
