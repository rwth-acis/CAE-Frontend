import {EventEmitter} from 'events';
import {toPromise,waitPromise} from './Utils';
import CONFIG from "./roleSpaceConfig";
import config from "./config.js";
import openapp from "openapp";

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
    }

    // init Yjs
    var spaceTitle = frameElement.baseURI.substring(frameElement.baseURI.lastIndexOf('/') + 1);
    if (spaceTitle.indexOf('#') != -1 || spaceTitle.indexOf('?') != -1) {
        spaceTitle = spaceTitle.replace(/[#|\\?]\S*/g, '');
    }

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
            text: "Text",
            activity: "Map",
            liveCodeAction:'Map'
        },
        sourceDir: config.CodeEditorWidget.bower_components
    }).then(function(y) {
        console.info('LIVEEDIT: Yjs successfully initialized');

        self.y = y
        y.share.liveCodeAction.observe(function(event){
          switch (event.name) {
            case 'reload':
              window.location.reload();            
            break;
          }
        });
        self.yInitCallback()
    });
  }

  sendActivity(entityId,changedComponent, userName){
    let time = new Date().getTime();
    let data = {
      type:"ValueChangeActivity",
      entityId:entityId,
      text:"<strong>LiveCodeEditor</strong> ..changed source code of "+ changedComponent,
      data:{
        value:"",
        subjectEntityName:"source code",
        rootSubjectEntityType: changedComponent,
        rootSubjectEntityId : entityId,
        userName : userName
      },
      sender : this.user2.id
    };
    this.y.share.activity.set('ActivityOperation', data)
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
    function getFromYjs(y, deferred) {
      if (y.share.data.get('model')) {
          var data = y.share.data.get('model');
          var loadedModel = data.attributes.attributes['modelAttributes[name]'].value.value;
          deferred.resolve(data)
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
    .then(this.loadComponentName.bind(this))
    .then(this.initUserNew.bind(this));
  }

  loadComponentName(){
    let deferred = $.Deferred();
    this.getModelResource().then( (representation) => {
      if(representation && representation.attributes){
        let name = representation.attributes.attributes['modelAttributes[name]'].value.value;
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

  initUserNew(){
    let deferred = $.Deferred();
    let url = localStorage.userinfo_endpoint + '?access_token=' + localStorage.access_token;
    let self = this;
    $.get(url, function(data){
      self.user2 = {
        id: data.sub,
        name: data.name,
      };
      deferred.resolve();
      
    });
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
