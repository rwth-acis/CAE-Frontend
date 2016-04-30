import {EventEmitter} from 'events';
import TraceModel from './TraceModel';
import {delayed,debounce} from "./Utils";
import RoleSpace from "./RoleSpace";
import Path from "path";
import parsePath from "parse-filepath";
let _y;

function createRoomName(fileName) {
  let roomName = roomNameHash(fileName);
  return `CAE[${roomName}]`;
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
  return new Y({db:{name:"memory"},connector:{
    name:"websockets-client",
    room: createRoomName(fileName),
    debug:true,
    url : "http://192.168.2.101:1234"
  },
  sourceDir: 'http://localhost/liveCodeEditorWidget/bower_components',//'http://eiche.informatik.rwth-aachen.de/editor/codeEditor/codeEditorWidget/bower_components', // location of the y-* modules
  share:{'workspace':'Map'}, types : ['Text','Map']});
}

export default class workspace extends EventEmitter{
  constructor(contentProvider){
    super();
    this.contentProvider = contentProvider;

    this.currentPath = Path.resolve("/");
    this.currentFile = "";

    this.timer = false;
    this.roomSynch = false;
    this.cursor=0;
    this.roleSpace = new RoleSpace();
    this.delayedSetCursor = debounce(this.setRemoteCursor.bind(this),10,false);

  }

  isRoomSynchronized(){
    return this.roomSynch;
  }

  getUserId(){
    return this.roleSpace.getUserId();
  }

  getUserName(){
    return this.roleSpace.getUserName();
  }

  getUserNameByJabberId(id){
    return this.user.get(id.toString());
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

  getFile(fileName){
    let deferred = $.Deferred();
    let path = Path.resolve(this.currentPath,fileName);
    path = Path.relative("/",path);
    this.currentFile=fileName;

    this.contentProvider.getContent(path).then( function(model){
      let traceModel = new TraceModel(model);
      traceModel.parseModel();
      deferred.resolve(traceModel);
    });
    return deferred.promise();
  }

  saveFile(segmentManager,changedSegment){
    delayed.bind(this)(function(){
      let path = Path.resolve(this.currentPath,this.currentFile);
      path = Path.relative("/",path);
      let userId = this.getUserId();
      let userName = this.getUserNameByJabberId(userId);

      this.roleSpace.getComponentName().then( (componentName) =>
        this.contentProvider.saveFile(path,`frontendComponent-${componentName}`,{
          code :  segmentManager.getTraceModel().getContent(),
          traces : segmentManager.getTraceModel().serializeModel(),
          changedSegment,
          user: userName
        })
      ).then(e =>{console.log(e)}).fail( function(error){
        alert(error);
      });

    }.bind(this),1000);
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

  loadFile(fileName, forceReload){
    let deferred = $.Deferred();
    let self = this;
    let arrays = [];
    let todos = [];

    //destroy an already existing yjs room before we can synchronize to another one
    //avoids some side effects

    if (_y) {
      _y.destroy();
    }

    if( !this.roomSynch ){
      deferred.reject("Not connected to the role space!");
    }else{
      initSpace(fileName).then( function(y){
        _y=y;
        self.workspace = y.share.workspace;
        self.createFileSpace(fileName, forceReload).then( function( workspaceMap,cursor,ySegmentMap,ySegmentArray,user,reloaded){
          self.setFileSpace(workspaceMap,cursor,ySegmentMap,ySegmentArray);
          self.user=user;
          self.user.set(self.roleSpace.getUserId(),self.roleSpace.getUserName());
          self.cursors = cursor;
          cursor.observe(self.cursorChangeHandler.bind(self));
          self.getFile(fileName).then( function(traceModel){
            todos = self.createYArrays(traceModel.getIndexes(),workspaceMap);
            $.when.apply($,todos).then(function(){
              deferred.resolve(ySegmentMap,ySegmentArray,traceModel,reloaded,Array.prototype.slice.call(arguments) );
            });

          });
        });
      });
    }

    return deferred.promise();
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

  createFileSpace(id,reload){
    let deferred = $.Deferred();
    let promise = this.workspace.get(id);
    let self = this;

    function fileSpaceInit(map, newCreated=false){
      console.log(newCreated);
      if(newCreated){
        console.log("create new fileSpace");
      }
      let todos = [];
      todos.push(self.createFileEntry("cursor",Y.Map,map));
      todos.push(self.createFileEntry("segmentValues",Y.Map,map));
      todos.push(self.createFileEntry("segmentOrder",Y.Array,map));
      todos.push(self.createFileEntry("user",Y.Map,map));
      $.when.apply($,todos).then(function(cursor,segmentValues,segmentOrder,user){
        deferred.resolve(map,cursor,segmentValues,segmentOrder,user,newCreated);
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
        promise.then( fileSpaceInit );
      }
    }

    return deferred.promise();

  }

  isRootPath(){
    return this.getRootPath() == this.currentPath;
  }

  getRootPath(){
    return parsePath(this.currentPath).root;
  }

  setFileSpace(space){
    this.fileSpace = space;
  }

  getFileSpace(){
    return this.fileSpace;
  }

  setRemoteCursor(usrId){
    console.log("remoteCursor",usrId);
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
    this.currentPath = Path.resolve(this.currentPath,filePath);
    let relativePath = Path.relative("/",this.currentPath);
    return this.contentProvider.getFiles("",relativePath);
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
