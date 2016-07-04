import {EventEmitter} from 'events';
import {toPromise,waitPromise} from './Utils';
import CONFIG from "./roleSpaceConfig";


let resourceSpace = new openapp.oo.Resource(openapp.param.space());
let resourceGetPromise = toPromise(openapp.resource.get);

/**
 * A class providing the utilities to interact with the role space
 */

export default class RoleSpace extends EventEmitter{

  constructor(){
    super();
    try{
      this.iwcClient = new iwc.Client("ACTIVITY");
      this.iwcClient.connect( this.iwcHandler.bind(this) );
    }catch(e){
      console.error(e);
    }
  }

  iwcSendActivity(entityId,changedComponent){
    let time = new Date().getTime();
    let data = JSON.stringify({
      type:"ValueChangeActivity",entityId:entityId,"text":".. changed source code of "+ changedComponent,
      data:{
        value:"",subjectEntityName:"source code",rootSubjectEntityType: changedComponent, rootSubjectEntityId : entityId
      },
      sender : this.getUserId()
    });

    let intent = {
      "component": "ACTIVITY",
      "data": "",
      "dataType": "",
      "action": "ACTION_DATA",
      "flags": ["PUBLISH_LOCAL"],
      "extras": {"payload":{"data":{"data":data,"type":"ActivityOperation"}, "sender":null, "type":"NonOTOperation"}, "time":time},
      "sender": "CODE_EDITOR"
    };try{
      this.iwcClient.publish(intent);
    }catch(e){
      console.error(e);
    }
  }

  iwcHandler(indent){
    let {action,extras:{payload}} = indent;
    if( action === "MODEL_UPDATED"){
      this.emit("modelUpdatedEvent");
    }
    else if(payload){
      if(action === "ACTION_DATA"){
        payload = [payload];
      }
      for(let i=0;i< payload.length;i++){
        let payloadItem = payload[i];
        let {data: payloadData} = payloadItem;
        if(payloadData.type == "EntitySelectOperation"){
          let {selectedEntityId} = $.parseJSON(payloadData.data);
          this.detectDoubleClick(selectedEntityId);
        }
      }
    }
  }

  detectDoubleClick(entityId){
    let now = new Date().getTime();
    if(!!this.lastClick){
      if(entityId && this.lastEntityId == entityId){
        let diff = now - this.lastClick;
        if(diff <= 250){
          this.emit("doubleClickEvent",entityId);
        }
      }
    }
    this.lastClick=now;
    this.lastEntityId=entityId;
  }

  getObj(getObj){
    return resourceGetPromise(getObj()).then(function(obj){
      let deferred = $.Deferred();
      if (typeof obj.data === "undefined") {
        return waitPromise(500).then(()=>this.getObj(getObj)).then( (s) => {deferred.resolve(s);} );
      }else{
        deferred.resolve(obj);
        return deferred.promise();
      }
    }.bind(this));
  }

  getComponentType(){
    let type = window.localStorage.componentType || "frontendComponent"
    return type;
  }

  getModelResource(){
    let deferred = $.Deferred();
    resourceSpace.getSubResources({
      relation: openapp.ns.role + "data",
      type: CONFIG.NS.MY.MODEL,
      onAll: function(data) {
        if(data === null || data.length === 0){
          deferred.resolve({});
        } else {
          data[0].getRepresentation("rdfjson",function(representation){
            if(!representation){
              //if no representation is found, return an empty object
              deferred.resolve({});
            } else {
              deferred.resolve(representation);
            }
          });
        }
      }
    });
    return deferred.promise();
  }

  getComponentName(){
    return this.componentName;
  }

  getSpaceObj(){
    return this.getObj(openapp.param.space);
  }

  getUserObj(){
    return this.getObj(openapp.param.user);
  }

  init(){
    return $.when(this.getSpaceObj.bind(this)(),this.getUserObj.bind(this)())
    .then(this.initSpaceUserObject.bind(this))
    .then(this.loadComponentName.bind(this));
  }

  loadComponentName(){
    let deferred = $.Deferred();
    this.getModelResource().then( (representation) => {
      if(representation && representation.attributes){
        let name =representation.attributes.label.value.value;
        this.componentName = `${this.getComponentType()}-${name}`;
        deferred.resolve();
      }else{
        deferred.reject(new Error("Model was not yet loaded until now.."));
      }
    });
    return deferred.promise();
  }

  getSpaceTitle(){
    return this.title;
  }

  getUserId(){
    return this.user.jabberid;
  }

  getUserName(){
    return this.user.title;
  }

  initSpaceUserObject(spaceObj,userObj){
    this._spaceObj = spaceObj;
    this._userObj = userObj;

    let deferred = $.Deferred();
    let person = userObj.data[userObj.uri];

    this.user = {
      title : person[CONFIG.NS.PERSON.TITLE][0].value,
      jabberid : person[CONFIG.NS.PERSON.JABBERID][0].value.replace("xmpp:","")
    };

    this.title = spaceObj.subject[CONFIG.NS.PERSON.TITLE][0].value;

    deferred.resolve();
    return deferred.promise();
  }

  // listener handler

  addModelUpdatedListener(listener){
    this.on("modelUpdatedEvent" , listener);
  }

  removeModelUpdatedListener(listener){
    this.removeListener("modelUpdatedEvent", listener);
  }

  addDoubleClickChangeListener(listener){
    this.on("doubleClickEvent" , listener);
  }

  removedDoubleClickChangeListener(listener){
    this.removeListener("doubleClickEvent", listener);
  }

}
