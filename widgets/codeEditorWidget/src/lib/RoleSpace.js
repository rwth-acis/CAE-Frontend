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
                        opt.onAll();
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


export default class RoleSpace{
    
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
    
    createSpaceResource(type, representation){
        let resourceSpace = new openapp.oo.Resource(openapp.param.space());
        let deferred = $.Deferred();
        let deleteDeferred = $.Deferred();
        resourceSpace.getSubResources({
           relation:openapp.ns.role + "data",
           type : type,
           onEach : function(doc){
                console.log(doc);
                doc.del();
           },
           onAll: function(){
                deleteDeferred.resolve();
           }
        });
        
        deleteDeferred.then(function(){
            resourceSpace.create({
                relation: openapp.ns.role + "data",
                type:type,
                representation:representation,
                callback:  function(a){
                    console.log(a)
                    deferred.resolve();
                }
            });
        });
        
        return deferred.promise();
    }
    
    saveFile(fileName,content){
        return this.createSpaceResource("my:ns:caemodel", content).then(function(){
            resourceSpace.getSubResources({
                relation: openapp.ns.role + "data",
                type : "my:ns:caemodel",
                onAll : function(data){
                    console.log(data);
                    if (data && data.length > 0) {
                        data[0].getRepresentation("rdfjson",function(a){
                            console.log(a);
                        })
                    }
                }
            });
        });
    }
    
    loadFile(fileName){
        
    }
    
    getSpaceObj(){
        return this.getObj(openapp.param.space);
    }
    
    getUserObj(){
        return this.getObj(openapp.param.user);
    }
    
    init(){
        return $.when(this.getSpaceObj.bind(this)(),this.getUserObj.bind(this)()).then(this.initSpaceUserObject.bind(this));
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
    
}