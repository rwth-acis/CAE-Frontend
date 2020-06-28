import {EventEmitter} from 'events';
import {toPromise,waitPromise} from './Utils';
import CONFIG from "./roleSpaceConfig";
import config from "./config.js";
import openapp from "openapp";

/**
 * A class providing the utilities to interact with the role space
 */

export default class RoleSpace extends EventEmitter{

  constructor(){
    super();
    try{
      this.iwcClient = new IWC.Client("ACTIVITY", "*", null);
      this.iwcClient.connect( this.iwcHandler.bind(this) );
    } catch(err) {
     console.log(err);
    }

    // init Yjs
    var spaceTitle = parent.caeRoom;

    var self = this

    this.yInitCallback = function() {}

    Y({
        db: {
            name: 'memory' // store the shared data in memory
        },
        connector: {
            name: 'websockets-client', // use the websockets connector
            room: spaceTitle,
            url: config.Yjs.websockets_server
        },
        share: { // specify the shared content
            users: 'Map',
            undo: 'Array',
            redo: 'Array',
            join: 'Map',
            canvas: 'Map',
            nodes: 'Map',
            edges: 'Map',
            userList: 'Map',
            select: 'Map',
            views: 'Map',
            data: 'Map',
            text: "Text"
        },
        sourceDir: config.CodeEditorWidget.bower_components
    }).then(function(y) {
        console.info('LIVEEDIT: Yjs successfully initialized');

        self.y = y

        self.yInitCallback()
    });
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
      "sender": "CODE_EDITOR",
      "receiver": "User Activity"
    };try{
      this.iwcClient.publish(intent);
    }catch(e){
      console.error(e);
    }
  }

  iwcHandler(indent){
    let {action,extras:{payload}} = indent;
    if( action === "MODEL_UPDATED"){
      console.log('MODELU PDATED EVENT')
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

  getComponentType(){
    let type = window.localStorage.componentType || "frontendComponent"
    return type;
  }

  getModelResource(){
    function getFromYjs(y, deferred) {
      if (y.share.data.get('model')) {
          var data = y.share.data.get('model');
          var loadedModel = data.attributes.label.value.value;
          // special case if model was only saved in the space (not loaded from db)
          if (loadedModel.toUpperCase() == "Model attributes".toUpperCase()) {
              deferred.resolve({})
          } else {
              deferred.resolve(data)
          }
      } else {
        //if no representation is found, return an empty object
        deferred.resolve({});
      }
    }

    let deferred = $.Deferred();

    if (this.y == undefined) {
      var self = this
      this.yInitCallback = function() {
        getFromYjs(self.y, deferred)
      }
    }
    else {
      getFromYjs(this.y, deferred)
    }

    return deferred.promise();
  }

  getComponentName(){
    return "frontendComponent-" + parent.caeRoom.split("versionedModel-")[1];
  }

  init(){
    return $.when()
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

  initSpaceUserObject(){
    let deferred = $.Deferred();

    var self = this;
    self.user = {};
    var url = localStorage.userinfo_endpoint + '?access_token=' + localStorage.access_token;

    $.get(url, function(data){
      self.user["title"] = data.name;
      self.user["jabberid"] = data.sub;
      deferred.resolve();
    }).fail(function(error){
        var id = self.generateRandomId();
        self.user["title"] = 'Anonymous';
        self.user["jabberid"] = id;
        deferred.resolve();
    });

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

  generateRandomId(length){
    var chars = "1234567890abcdef";
    var numOfChars = chars.length;
    var i, rand;
    var res = "";

    if(typeof length === 'undefined') length = 24;

    for(i = 0; i < length; i++){
        rand = Math.floor(Math.random() * numOfChars);
        res += chars[rand];
    }
    return res;
  }
}