import {EventEmitter} from 'events';
import TraceModel from './TraceModel';
import {delayed,debounce,run,genBind} from "./Utils";
import RoleSpace from "./RoleSpace";
import Path from "path";
import config from "./config.js";
let _y;

function createRoomName(fileName) {
  let roomName = roomNameHash(fileName);
  return `CAE-Editor[${roomName}]`;
}

function roomNameHash(str){
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    hash += c;
  }
  return hash;
}

function initSpace(fileName) {
  let deferred = $.Deferred();
  new Y({db:{name:"memory"},connector:{
    name:"websockets-client",
    room: createRoomName(fileName),
    url: "http://localhost:1234",
    debug:true
  },
  sourceDir: config.CodeEditorWidget.bower_components,
  share:{'workspace':'Map'}, types : ['Text','Map']}).then( deferred.resolve );
  return deferred.promise();
}

export default class workspace extends EventEmitter{
  constructor(contentProvider, codeEditor){
    super();
    this.contentProvider = contentProvider;
    this.codeEditor = codeEditor;

    this.currentPath = Path.resolve("/");
    this.currentFile = "";

    //binding functions
    this.doubleClickHandler = this.doubleClickHandler.bind(this);
    this.setRemoteCursor = this.setRemoteCursor.bind(this);
    this.saveFile = this.saveFile.bind(this);

    this.timer = false;
    this.roomSynch = false;
    this.cursor=0;
    this.roleSpace = new RoleSpace();
    this.roleSpace.addDoubleClickChangeListener( this.doubleClickHandler );

    //defining debounced methods
    this.delayedSetCursor = debounce(this.setRemoteCursor ,10,false);
    this.delayedSaveFile = debounce(this.saveFile, 1000);

    //defining generator functions, used to avoid large promise chains
    this.yieldGetComponentName = genBind( () => this.roleSpace.getComponentName() );
    this.yieldGetSegmentLocation = genBind( (componentName, entityId) => this.contentProvider.getSegmentLocation(componentName, entityId) );
    this.yieldLoad = genBind( (fileName) => this.codeEditor.load(fileName,false) );
    this.yieldGetFile = genBind( (componentName, fileName) => this.getFile(componentName, fileName) );
    this.yieldInitSpace = genBind( (componentName) => initSpace(componentName) );
  }

  doubleClickHandler(entityId){
    let self = this;
    run( function*(){
      try{
        let componentName = yield self.yieldGetComponentName();
        let {fileName,segmentId} = yield self.yieldGetSegmentLocation(componentName, entityId);
        yield self.yieldLoad(fileName);
        self.codeEditor.goToSegment(segmentId);
        self.codeEditor.loadFiles(self.currentPath);
      }catch(error){
        console.error(error);
      }
    });
  }

  isRoomSynchronized(){
    return this.roomSynch;
  }

  getParticipants(){
    return this.user.keys().map( (userId) => this.user.get(userId) );
  }

  getUserId(){
    return this.roleSpace.getUserId();
  }

  getUserName(){
    return this.roleSpace.getUserName();
  }

  getUserByJabberId(id){
    return this.user.get(id.toString());
  }

  getUserNameByJabberId(id){
    let user = this.getUserByJabberId(id);
    return user && user.name;
  }

  init(){
    let deferred = $.Deferred();
    this.roomSynch = false;
    let self = this;
    this.roleSpace.init().then( function(spaceObj){
      self.roomSynch = true;
      deferred.resolve();
    });

    return deferred.promise();
  }

  resolvePath(relativePath){
    let path = Path.resolve(this.currentPath,relativePath);
    return Path.relative("/" , path);
  }

  push(){
    console.log("workspace log");
    return this.roleSpace.getComponentName()
      .then( (componentName) => this.contentProvider.push(componentName) ).fail((e)=>{console.log(e)});
  }

  getFile(modelName,fileName){
    let deferred = $.Deferred();

    let path = fileName;

    path = Path.relative("/",path);
    this.currentFile = fileName;
    this.currentPath = Path.dirname(path);

    this.contentProvider.getContent(modelName, path).then( function(model){
      let traceModel = new TraceModel(model);
      traceModel.parseModel();
      deferred.resolve(traceModel);
    });
    return deferred.promise();
  }

  saveFile(segmentManager, changedSegment){
    let path = this.currentFile;
    path = Path.relative("/",path);
    let userId = this.getUserId();
    let userName = this.getUserNameByJabberId(userId);

    let data = {
      code :  segmentManager.getTraceModel().getContent(),
      traces : segmentManager.getTraceModel().serializeModel(),
      changedSegment,
      user: userName
    }

    this.roleSpace.getComponentName()
    .then( (componentName) => this.contentProvider.saveFile(path,componentName,data) )
    .then( (e) => {console.log(e)} )
    .fail( (error) => {console.error(error)} );
  }

  createYArrays(indexes,map,depth=0){
    let todos = [];
    let self = this;
    for(let i=0;i<indexes.length;i++){
      let index = indexes[i];
      if (typeof index.children != "undefined") {
        let subTodos = this.createYArrays(index.children,map,depth+1);
        todos = todos.concat(subTodos);
        todos.push(function(){
          let deferred = $.Deferred();
          self.createFileEntry("segmentOrder["+index.id+"]",Y.Array,map).then(function(arr){
            deferred.resolve({id:index.id,list:arr});
          });
          return deferred.promise();
        }());
      }
    }


    return todos;
  }

  loadFile(fileName, forceReload=false){
    let deferred = $.Deferred();
    let self = this;
    let arrays = [];
    let todos = [];
    let token = true;


    if (_y) {
      try{
        this.user.delete( this.roleSpace.getUserId().toString() );
      }catch(error){
      }
    }

    if( !this.roomSynch ){
      deferred.reject("Not connected to the role space!");
    }else{

      run( function*(){
        try{

          //destroy an already existing yjs room before we can synchronize to another one
          //avoids some side effects, e.g. old observers
          if(_y){
            _y.destroy();
          }

          let componentName = yield self.yieldGetComponentName();
          _y = yield self.yieldInitSpace(componentName);

          self.workspace = _y.share.workspace;
          self.workspace.observe(function(events){
            for(event of events){
              if(event.name === "generatedId"){
                //check if we need to reload
                if(token && event.value != event.oldValue){
                  setTimeout(function(){
                    self.codeEditor.load(fileName);
                  });
                }else{
                  token=true;
                }
                break;
              }
            }
          });

          self.codeEditor.setModalStatus(1);
          let traceModel = yield self.yieldGetFile(componentName, fileName);
          self.codeEditor.setModalStatus(2);

          if(traceModel.getGenerationId() != self.workspace.get("generatedId")){
            forceReload=true;
            token = false;
          }

          self.createFileSpace(self.currentFile, traceModel.getGenerationId(), forceReload)
          .then( self.createOrders(traceModel) )
          .then( (segmentValues, segmentOrder, reloaded, orders) => {
            deferred.resolve(traceModel, segmentValues, segmentOrder, reloaded, orders);
            if(!token && forceReload){
              self.workspace.set("generatedId",traceModel.getGenerationId());
            }
          });

        }catch(error){
          console.error(error);
          deferred.reject(error);
        }
      })
    }
    return deferred.promise();
  }

  createOrders(traceModel){
    return (workspaceMap, segmentValues, segmentOrder, reloaded) => {
      let deferred = $.Deferred();
      let todos = [];
      todos = this.createYArrays(traceModel.getIndexes(), workspaceMap);
      $.when.apply($,todos)
      .then( function(){
        deferred.resolve(segmentValues, segmentOrder, reloaded, Array.prototype.slice.call(arguments));
      } );
      return deferred.promise();
    };
  }

  cursorChangeHandler(e){
    for(let o of e){
      let {name} = o;
      this.emit("cursorChange",name);
    }
  }

  createFileEntry(id,yObj,fileSpace){
    let deferred = $.Deferred();
    let promise = fileSpace.get(id);
    let self = this;
    if (promise === undefined) {
      fileSpace.set(id,yObj).then( function(obj){
        deferred.resolve(obj);
      });
    }else{
      promise.then(function(obj){
        deferred.resolve(obj);
      });
    }
    return deferred;
  }

  createFileSpace(id, generationId, reload){
    let deferred = $.Deferred();
    let promise = this.workspace.get(id);
    let self = this;

    function fileSpaceInit(map, newCreated=false){

      if(newCreated){
        console.log("create new fileSpace");
      }

      map.set("generatedId",generationId);
      let todos = [];

      todos.push(self.createFileEntry("cursor",Y.Map,map));
      todos.push(self.createFileEntry("segmentValues",Y.Map,map));
      todos.push(self.createFileEntry("segmentOrder",Y.Array,map));
      todos.push(self.createFileEntry("user",Y.Map,map));
      $.when.apply($,todos).then(function(cursor,segmentValues,segmentOrder,user){
        let count = user.keys().length;
        let workspaceUser = user.get(self.roleSpace.getUserId()) || {count};
        workspaceUser.name = self.roleSpace.getUserName();
        user.set( self.roleSpace.getUserId(), workspaceUser );

        user.observe( function(){
          self.codeEditor.printParticipants();
        } );
        cursor.observe(self.cursorChangeHandler.bind(self));
        self.user=user;
        self.cursors = cursor;
        self.setFileSpace(map);
        deferred.resolve(map,segmentValues, segmentOrder, newCreated);
      });
    }

    if (promise === undefined ) {
      self.workspace.set(id,Y.Map).then( map => fileSpaceInit(map,true) );
    }else{
      if (reload) {
        promise.then( function(map){
          self.workspace.set(id,Y.Map).then( map => fileSpaceInit(map, true) );
        });

      }else{
        promise.then( (map) => {
          let fileId = map.get("generatedId");
          if(generationId != fileId){
            self.workspace.set(id,Y.Map).then( map => fileSpaceInit(map, true) );
          }else{
            fileSpaceInit(map);
          }
        } );

        //function(map){
        //  let fileId = map.get("generatedId");
        //  if(generationId != fileId){
        //    self.workspace.set(id,Y.Map).then( map => fileSpaceInit(map, true) );
        //  }else{
        //    fileSpaceInit(map);
        //  }
        //} );
      }
    }

    return deferred.promise();

  }

  isRootPath(){
    return this.currentPath == "" || this.currentPath == "./" || this.currentPath == "/" || this.currentPath == ".";
  }

  setFileSpace(space){
    this.fileSpace = space;
  }

  getFileSpace(){
    return this.fileSpace;
  }

  setRemoteCursor(usrId){
    this.cursors.set(usrId,this.cursor);
  }

  setCursor(usrId,index){
    this.cursor = index;
    this.delayedSetCursor(this.getUserId());
  }

  getCursor(usrId){
    return this.cursors.get(usrId);
  }

  getFileContent(fileName){
    this.contentProvider.getContent2(fileName);
  }

  getFiles(filePath=""){
    this.currentPath = filePath;
    let relativePath = Path.relative("/",this.currentPath);
    return this.roleSpace.getComponentName().then( componentName => this.contentProvider.getFiles(componentName,relativePath) );
  }

  getRemoteCursors(){

    if (!this.cursors) {
      return [];
    }

    return this.cursors.keys().map(
      function (key) {
        return {usr:key,index:this.cursors.get(key)};
      }
    );
  }

  addSpaceChangeListener(listener){
    this.on("spaceChange" , listener);
  }

  removespaceChangeListener(listener){
    this.removeListener("spaceChange", listener);
  }

  addCursorChangeListener(listener){
    this.on("cursorChange" , listener);
  }

  removeCursorChangeListener(listener){
    this.removeListener("cursorChange", listener);
  }
}
