import frontend_vls from './vls/frontendComponent_vls.js';
import microservice_vls from './vls/microservice_vls.js';
import application_vls from './vls/application_vls.js';
import Static from "./static";
import Common from "./common";

/**
 * Helper class for uploading the (meta)-models for the components.
 * When the user wants to model a component, then the SyncMeta widgets as the
 * Canvas use a (meta)-model, which therefore needs to be uploaded in the Yjs room.
 *
 * This helper class can upload the Visual Language Specification (VLS) of the metamodel
 * for a component.
 * There are different metamodels and thus different VLS used for the different types
 * of models (e.g. frontend, microservice,...). Currently the files containing
 * the VLS are stored in the "vls" folder.
 *
 * This helper class can also upload the model for a component to the Yjs room.
 */
export default class MetamodelUploader {

  /**
   * Uploads the correct metamodel/VLS for the given component.
   * The component (and its type) gets used to identify which metamodel/VLS
   * gets uploaded (e.g. frontend, microservice,...).
   *
   * Also loads the latest model from the database, if there does not exist one in
   * the Yjs room yet.
   * @param component The full component (containing type attribute) where the metamodel
   * and model should be uploaded for.
   * @returns {*|Promise<unknown>|Promise}
   */
  static uploadMetamodelAndModelForComponent(component) {
    // get the correct VLS depending on the type of the given component
    let vls;
    if(component.type == "frontend") {
      vls = frontend_vls;
    } else if(component.type == "microservice") {
      vls = microservice_vls;
    } else {
      vls = application_vls;
    }

    return new Promise((resolve, reject) => {
      Y({
        db: {
          name: "memory" // store the shared data in memory
        },
        connector: {
          name: "websockets-client", // use the websockets connector
          room: Common.getYjsRoomNameForVersionedModel(component.versionedModelId),
          options: { resource: Static.YjsResourcePath},
          url: Static.YjsAddress
        },
        share: { // specify the shared content
          data: 'Map'
        },
        type:["Text","Map"],
        sourceDir: '/bower_components'
      }).then(function(y) {
        // metamodel can be set everytime
        // it does not matter if it is already existing
        y.share.data.set('metamodel', vls);

        // only set model if there does not exist one in the yjs room
        if(y.share.data.get('model') == undefined) {
          // load versioned model
          fetch(Static.ModelPersistenceServiceURL + "/versionedModels/" + component.versionedModelId, {
            method: "GET"
          }).then(response => {
            if(response.ok) {
              return response.json();
            } else {
              reject();
            }
          }).then(data => {
            // get model of latest commit from database
            const model = data.commits[0].model;
            y.share.data.set('model', model);
            resolve();
          });
        } else {
          // model already exists in yjs room
          resolve();
        }
      });
    });
  }
}
