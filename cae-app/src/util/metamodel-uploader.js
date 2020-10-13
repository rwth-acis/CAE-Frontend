import frontend_vls from '../vls/frontendComponent_vls.js';
import microservice_vls from '../vls/microservice_vls.js';
import application_vls from '../vls/application_vls.js';
import Static from "../static";
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
    let isDependency = false;
    if(component.hasOwnProperty("dependencyId")) {
      // component is a dependency
      component = component.component;
      isDependency = true;
    }
    // get the correct VLS depending on the type of the given component
    const metamodel = this.getMetamodelByType(component.type);

    // load versioned model
    return new Promise((resolve, reject) => {
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
        let viewOnly = false;
        if(isDependency) viewOnly = true;
        this.uploadMetamodelAndModelInYjsRoom(metamodel, model,
          Common.getYjsRoomNameForVersionedModel(component.versionedModelId), resolve, viewOnly, isDependency);
      });
    });
  }

  /**
   * Uploads the metamodel and model for a specific commit.
   * This method is used when the user wants to view a previous version of a model.
   * @param componentType
   * @param model
   * @param versionedModelId
   * @param commitId
   * @returns {Promise<unknown>}
   */
  static uploadMetamodelAndModelForSpecificCommit(componentType, model, versionedModelId, commitId, isDependency) {
    // get the correct VLS depending on the given component type
    const metamodel = this.getMetamodelByType(componentType);

    // load versioned model
    return new Promise((resolve, reject) => {
      this.uploadMetamodelAndModelInYjsRoom(metamodel, model,
        Common.getYjsRoomNameForSpecificCommit(versionedModelId, commitId), resolve, true, isDependency);
    });
  }

  /**
   * Uploads the given metamodel and model to the Yjs room with the given name.
   * Model only gets uploaded if no model exists in the Yjs room.
   * @param metamodel
   * @param model
   * @param yjsRoomName
   * @param resolve
   */
  static uploadMetamodelAndModelInYjsRoom(metamodel, model, yjsRoomName, resolve, viewOnly, isDependency) {
    if(isDependency) {
      // if the component is a dependency, then the Yjs room should be a different one
      yjsRoomName += "-dependency";
    }
    console.log("Uploading metamodel and model into Yjs room: " + yjsRoomName);
    Y({
      db: {
        name: "memory" // store the shared data in memory
      },
      connector: {
        name: "websockets-client", // use the websockets connector
        room: yjsRoomName,
        options: { resource: Static.YjsResourcePath},
        url: Static.YjsAddress
      },
      share: { // specify the shared content
        data: 'Map',
        widgetConfig: 'Map'
      },
      type:["Text","Map"]
    }).then(function(y) {
      // set if view only mode should be activated
      console.log("Setting view_only in Yjs room to: " + viewOnly);
      y.share.widgetConfig.set('view_only', viewOnly);
      y.share.widgetConfig.set('view_only_property_browser', viewOnly);

      // metamodel can be set everytime
      // it does not matter if it is already existing
      y.share.data.set('metamodel', metamodel);

      // only set model if there does not exist one in the yjs room
      if(y.share.data.get('model') == undefined) {
        y.share.data.set('model', model);

        // also upload wireframe
        if(model.wireframe) {
          y.share.data.set('wireframe', model.wireframe);
        }
        resolve();
      } else {
        // model already exists in yjs room
        resolve();
      }
    });
  }

  /**
   * Returns the correct VLS for the given type.
   * @param type Either "frontend", "microservice" or "application".
   * @returns {{nodes, edges, attributes}}
   */
  static getMetamodelByType(type) {
    let metamodel;
    if(type == "frontend") {
      metamodel = frontend_vls;
    } else if(type == "microservice") {
      metamodel = microservice_vls;
    } else {
      metamodel = application_vls;
    }
    return metamodel;
  }
}
