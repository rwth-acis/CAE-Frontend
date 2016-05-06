import {EventEmitter} from 'events';
import {toPromise,waitPromise} from './Utils';
import CONFIG from "./roleSpaceConfig";

if (typeof window.openapp === "undefined") {
  let jabberId = Math.random()*99999;
  window.openapp = {
    ns:{
      role : "role"
    },
    oo:{
      Resource:function(){
        return {
          getSubResources:function(opt){
            opt.onAll([{
              getRepresentation:function(type, callback){
                callback({
                  attributes:{
                    attributes:{
                      "ahaha":{
                        name : "type",
                        value : {
                          value : "frontend-component"
                        }
                      }
                    },
                    label:{
                      value:{
                        value:"Test23"
                      }
                    }
                  }
                });
              }
            }]);
          },
          create:function(opt){
            console.log(opt.type,opt.representation);
            opt.callback();
          }
        }
      }
    },
    param:{
      space:function(){return "space"},
      user:function(){return "user"}
    },
    resource:{
      get:function(param,callback){
        switch (param) {
          case "space":
          let subject ={};
          subject[CONFIG.NS.PERSON.TITLE]=[{value:"Dummy Space Title"}];
          callback({
            data:{
              subject:subject
            },
            subject:subject
          });
          break;
          case "user":
          let data = {};
          data["uri"]={};
          data["uri"][CONFIG.NS.PERSON.TITLE]=[{value:"User Title"}];
          data["uri"][CONFIG.NS.PERSON.JABBERID]=[{value:`xmpp:u${jabberId}`}];
          callback({
            uri:"uri",
            data:data
          });
          break;
        }
        callback({data:{user:"user"}});
      }
    }
  }
}

let resourceSpace = new openapp.oo.Resource(openapp.param.space());
let resourceGetPromise = toPromise(openapp.resource.get);


export default class RoleSpace extends EventEmitter{

  constructor(){
    super();try{
      this.iwcClient = new iwc.Client("ACTIVITY");
      this.iwcClient.connect( this.iwcHandler.bind(this) );
    }catch(e){

    }
  }

  iwcHandler(indent){
    let {action,extras:{payload}} = indent;
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

  detectDoubleClick(entityId){
    let now = new Date().getTime();
    console.log(this.lastClick, this.lastEntityId);
    if(!!this.lastClick){
      if(this.lastEntityId == entityId){
        let diff = now - this.lastClick;
        if(diff <= 500){
          console.log(entityId);
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
    return "frontend";
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
    let deferred = $.Deferred();
    console.log(this.componentName);
    deferred.resolve(this.componentName);
    return deferred.promise();
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
        this.componentName =representation.attributes.label.value.value;

        for(let attributeId in representation.attributes.attributes){
          if(representation.attributes.attributes.hasOwnProperty(attributeId)){
            let attribute = representation.attributes.attributes[attributeId];
            if(attribute.name==="type"){
              switch(attribute.value.value){
                case "frontend-component":
                  this.componentName = `frontendComponent-${this.componentName}`;
                  break;
                case "microservice":
                  this.componentName = `microserviceComponent-${this.componentName}`;
                  break;
              }
              break;
            }
          }
        }

        deferred.resolve();
      }else{
        deferred.reject(new Error("Model not yet persisted."));
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

  addDoubleClickChangeListener(listener){
    this.on("doubleClickEvent" , listener);
  }

  removedDoubleClickChangeListener(listener){
    this.removeListener("doubleClickEvent", listener);
  }

}
