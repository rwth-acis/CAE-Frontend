import * as Utils from "./Utils";
import RoleSpace from "./RoleSpace";
import {EventEmitter} from 'events';
import TraceModel from './TraceModel';
import Path from "path";
import config from "./config.js";
import ContentProvider from "./ContentProvider";

// private yjs instance
let _y;
// private flag used to not listen on my own changes of the Y.Map for the current file
let _listenOnFileSpaceChanges = true;

//private static helper
function _createRoomName( fileName ){
  let roomName = Utils.getHash(fileName);
  return `CAE-Editor[${roomName}]`;
};

function _initYjs( componentName ){
  return new Y({db:{name:"memory"},connector:{
    name:"websockets-client",
    room: _createRoomName( componentName ),
    url: "http://localhost:1234"
  },
  sourceDir: config.CodeEditorWidget.bower_components,
  share:{'workspace':'Map','user':'Map','jobs':'Map'}, types : ['Text','Map']});//.then( deferred.resolve );
}

/**
 * The Workspace class is responsible to manage the workspace of the current component and file.
 * It delegates all loading and storing operation from the code editor instance to the given content provider and other additional instances needed for these operations.
 * When a file is opened, it (re-)creates the needed yjs types and calls the segment manager to bind the
 * segments of the file to that yjs types.
 *
 * @extends EventEmitter
 */

class Workspace extends EventEmitter{

  constructor( codeEditor ){
    super();

    //binding methods to this class
    this.contentFeedbackHandler = this.contentFeedbackHandler.bind(this);
    this.modelViolationFeedbackHandler = this.modelViolationFeedbackHandler.bind(this);
    this.saveFile = this.saveFile.bind(this);
    this.doubleClickHandler = this.doubleClickHandler.bind(this);
    this.modelUpdatedHandler = this.modelUpdatedHandler.bind(this);

    this.contentProvider = new ContentProvider();
    this.contentProvider.addEventListener( this.contentFeedbackHandler );
    this.contentProvider.addEventListener( this.modelViolationFeedbackHandler );

    this.currentFile = "";
    this.currentPath = Path.resolve("/");

    this.codeEditor = codeEditor;

    this.roleInit = false;
    this.roleSpace = new RoleSpace();
    this.roleSpace.addDoubleClickChangeListener( this.doubleClickHandler );
    this.roleSpace.addModelUpdatedListener( this.modelUpdatedHandler );

    //defining debounced methods
    this.delayedSaveFile = Utils.debounce(this.saveFile, 2000);
    this.delayedSetRemoteCursor = Utils.debounce(this.setRemoteCursor, 15, false);

    this.heartBeatIntervall = setInterval( ()=> {this.heartBeat()},2500);

  }

  /**
  * The main handler for the content provider. Shows a snackbar notification
  * @param {string} message  - The message to display
  * @param {object} [error]  - Optional error object
  */

  contentFeedbackHandler( message ,error){
    if(error && error.generationIdConflict){
        this.codeEditor.open(this.getCurrentFile(), true);
    }
    //feedback is handled separately by their own handler in the workspace instance
    else if(!error || (error && !error.feedbackItems) ){
      this.codeEditor.feedback(message);
    }
  }

  createCursorsFileEntry(map){
    return this.createFileEntry("cursor",Y.Map,map).then( cursor =>  {
        cursor.observe(this.cursorChangeHandler.bind(this));
        this.cursors = cursor;
    })
  }

  createFileEntry(id,yjsType,map,reload){
    let deferred = $.Deferred();
    let promise = map.get(id);
    if (promise === undefined || reload) {
      map.set(id,yjsType).then( (yjsObj) => {
        deferred.resolve(yjsObj);
      });
    }else{
      promise.then( (yjsObj) => {
        deferred.resolve(yjsObj);
      });
    }
    return deferred;
  }

  /**
   * Create and set up all needed yjs types/object for the current file
   * @param {string} generationId - The generation id of the current file
   * @param {boolean} reload      - If true, the yjs types/data structures will be recreated
   * @return {promise}            - A promise that is resolved if the needed yjs types are (re)created
   */

  createFileSpace(generationId, reload){
    let deferred = $.Deferred();
    let id = this.getCurrentFile();
    let promise = this.workspace.get(id);

    let fileSpaceInit = (map, newCreated=false) => {
      map.set("generationId",generationId);
      map.observe( (events) => {
        for(let event of events){
          if(event.name == "reload"){
            if(event.value == this.getUserId()){
              map.set("reload",true);
              _listenOnFileSpaceChanges = false;
            }
          }
        }
      });

      let entries = [];
      entries.push( this.createFileEntry("segmentValues",Y.Map,map) );
      entries.push( this.createFileEntry("segmentOrder",Y.Array,map ) );

      this.createUserFileEntry(map)
        .then( () => this.createCursorsFileEntry(map) )
        .then( () => this.createFeedbackFileEntry(map) )
        .then( () => $.when.apply($,entries) )
        .then( (segmentValues, segmentOrder) => {
          deferred.resolve(map,segmentValues, segmentOrder, newCreated);
        });
    };

    if (promise === undefined ) {
      this.workspace.set(id,Y.Map).then( map => fileSpaceInit(map,true) );
    }else if (reload) {
      promise.then( (map) => {
        this.workspace.set(id,Y.Map).then( map => fileSpaceInit(map, true) );
      });

    }else{
      promise.then( (map) => {
        let fileId = map.get("generationId");
        if(generationId != fileId){
          this.workspace.set(id,Y.Map).then( map => fileSpaceInit(map, true) );
        }else{
          fileSpaceInit(map);
        }
      } );
    }

    return deferred.promise();

  }

  createFeedbackFileEntry(map){
    return this.createFileEntry("feedback",Y.Map,map).then( feedbackItems => {
        feedbackItems.observe( () =>{
          this.feedbackItemsHandler();
        });
        this.feedbackItems = feedbackItems;
        this.feedbackItemsHandler();
    })
  }

  /**
   * Create or return the Y.Map type for the user list of a file and bind its observers
   * @param {object} map  - The yjs map of the file
   * @return {promise}    - A promise that is resolved after creating/getting the user yjs type
   */

  createUserFileEntry(map){
    //return this.createFileEntry("user",Y.Map,map).then( (user) => {
    //  this.user = user;

      let count = this.user.keys().length;
      let workspaceUser = this.user.get(this.roleSpace.getUserId()) || {count};
      workspaceUser.name = this.roleSpace.getUserName();
      workspaceUser.fileName = this.getCurrentFile();
      workspaceUser.id = this.roleSpace.getUserId();

      this.user.set( this.roleSpace.getUserId(), workspaceUser );
      this.user.observe( () => {
        this.codeEditor.printParticipants();
      });
      let deferred = $.Deferred();
      deferred.resolve();
      return deferred.promise();

    //});
  }

  /**
   * Create or return the promises to create the Y.Array types for the ordering of the segments
   * @param {object[]} indexes              - The segment information
   * @param {string}   indexes[].id         - The id of one segment
   * @param {object[]} [indexes[].children] - Optional children of a segment
   * @return {promise[]}                    - The promises to create the Y.Array types
   */

  createYArrays(indexes,map){
    let todos = [];
    for(let i=0;i<indexes.length;i++){
      let index = indexes[i];
      if (typeof index.children != "undefined") {
        let subTodos = this.createYArrays(index.children,map);
        todos = todos.concat(subTodos);
        todos.push((()=>{
          let deferred = $.Deferred();
          this.createFileEntry("segmentOrder["+index.id+"]",Y.Array,map).then(function(arr){
            deferred.resolve({id:index.id,list:arr});
          });
          return deferred.promise();
        })());
      }
    }

    return todos;
  }

  /**
   * Method to handle the updates on the remote cursors. Propagate the changed to the cursor listener of the workspace
   * @param{object[]} e - Yjs events
   */

  cursorChangeHandler(e){
    for(let o of e){
      let {name} = o;
      this.emit("cursorChange",name);
    }
  }

  /**
   *	The double click handler for the canvas widget. Requests the file name and position of the clicked model element and  jumps to the location of that element within the file
   *	@param {string} entityId - The id of the model element
   */

  doubleClickHandler(entityId){
    let componentName = this.roleSpace.getComponentName();
    this.contentProvider.getSegmentLocation(componentName, entityId).then( ({fileName, segmentId}) => {
      this.codeEditor.open( fileName, false).then( () => {
        this.codeEditor.goToSegment(segmentId);
        this.codeEditor.loadFiles(this.getCurrentPath());
      });
    });
  }

  /**
   * Get the current file path
   * @return {String} - The current file path
   */

  getCurrentFile(){
    return this.currentFile;
  }

  /**
   * Get the path of the dir of the current file
   * @return {string} - The path of the dir
   */

  getCurrentPath(){
    return this.currentPath;
  }

  /**
   *	Decorates a file list and adds a "../" folder to it
   *	@param {object[]} files  - A file list
   *	@return {object[]}       - The decorated file list
   */

  getDecoratedFiles(files){
    if (!this.isRootPath()) {
      let path = this.resolvePath("../");
      files.unshift({type:"folder", path : path, name : "../"});
    }
    return files;
  }
  /**
   * Get the content and traces of the given file of the given model.
   * @param {string} modelName  - The model/component name
   * @param {string} fileName   - The file name
   * @return {promise}          - A promise that is resolved after loading the file content and parsing the trace model
   */

  getFile(modelName,fileName){
    let deferred = $.Deferred();
    let path = Path.relative("/", fileName);

    this.currentFile = fileName;
    this.currentPath = Path.dirname(path);

    this.contentProvider.getContent(modelName, path).then( function(model){
      let traceModel = new TraceModel(model);
      traceModel.parseModel();
      deferred.resolve(traceModel);
    }).fail(()=>{
      deferred.reject();
    });

    return deferred.promise();
  }

  /**
   * Get a file list of the files located in a given directory
   * @param {string} [path=""]  - The path of the directory
   * @return {promise}          - A promise resolved after the loading of the file list
   */

  getFiles(path=""){
    this.currentPath = path;
    return this.contentProvider.getFiles( this.roleSpace.getComponentName(), Path.relative("/", this.getCurrentPath() ) )
      .then( data => this.getDecoratedFiles(data.files) );
  }
  /**
   * Get the current participant list of the file. User that are longer than 30 seconds inactive are filtered
   * @return {object[]} - The list of the participants
   */

  getParticipants(){
    return this.user.keys().map( (userId) => this.user.get(userId) )
    .filter( (user) => user.fileName == this.getCurrentFile() && (new Date()).getTime() - user.time <= 1000 * 30  );
  }

  /**
   * Get a user object by its jabber id
   * @param {string} id - The jabber id
   * @return {object}   - The user object
   */

  getUserByJabberId(id){
    return this.user.get(id.toString());
  }

  /**
   * Get the user id for the local user
   * @return {string} - The user's id
   */

  getUserId(){
    return this.roleSpace.getUserId();
  }

  /**
   * Get the user name for the local user
   * @return {string} - The user name
   */

  getUserName(){
    return this.roleSpace.getUserName();
  }

  /**
   * Get the name of a user by its jabber id
   * @param {string} id - The user's jabber id
   * @return {string}   - The user name
   */

  getUserNameByJabberId(id){
    let user = this.getUserByJabberId(id);
    return user && user.name;
  }

  /**
   * Heartbeat for online participants
   */

  heartBeat(){
    if( this.isRoleInitiated() && this.getCurrentFile().length > 0 && _y){
      let user = this.user.get( this.getUserId() );
      if(user){
        user.time = new Date().getTime();
        this.user.set( this.getUserId(), user);
      }
    }
  }

  /**
   * Method to handle potential model violations when a commit request was rejected
   * @param {String} message             - The message from the content provider after a request
   * @param {Object} [data]              - Optional data object containing the feedback of the model violation
   * @param {Object[]} [data.feedbackItems]  - Optional feedback
   */

  modelViolationFeedbackHandler(message, data){
    if( data && this.feedbackItems ){
      this.feedbackItems.set("data",data.feedbackItems || [] );
    }
  }

  /**
   * Method to handle shared feedback of model violation of the current fileName
   */

  feedbackItemsHandler(){
    let data = this.feedbackItems.get("data");
    if( data && data.length > 0){
      this.codeEditor.showFeedback(data);
    }else{
      this.codeEditor.hideFeedback();
    }
  }

  /**
   * Initialize the workspace
   * @return {promise}  - A promise that is resolved after the initialization
   */

  init(){
    let deferred = $.Deferred();
    this.roleInit= false;
    this.roleSpace.init().then( (spaceObj) => {
      this.roleInit = true;
      deferred.resolve();
    }).fail( (e) => {
      this.codeEditor.setEditorTitle(e.message);
    });
    return deferred.promise();
  }

  /**
   * Determine if the workspace is already connected to the role space
   * @return {boolean}  - True, if the workspace is already connected to the role space
   */

  isRoleInitiated(){
    return this.roleInit;
  }

  /**
   * Determine if the current path is a root path
   * @return {boolean}  - True, if the current path is the root path
   */

  isRootPath(){
    return this.getCurrentPath() == "" || this.getCurrentPath() == "./" || this.getCurrentPath() == "/" || this.getCurrentPath() == ".";
  }
  /**
   * Load a file from the github proxy service and initialize the needed data structures
   * @param {string} fileName             - The name of the file
   * @param {boolean} [forceReload=false] - True, if you want to force a reload. Otherwise, false.
   * @return {promise}                     - A promise that is resolved when the file was loaded
   */

  loadFile(fileName, forceReload=false){
    let deferred = $.Deferred();
    if( !this.isRoleInitiated() ){
      deferred.reject( new Error("Not connected to the role space!") );
    }else{
      // just an anonymous function for reuse and privacy purpose
      let _loadFile = () => {
        let componentName = this.roleSpace.getComponentName();
        _initYjs(componentName).then( (y) => {
          _y = y;
          this.workspace = _y.share.workspace;
          this.user = _y.share.user;
          this.jobs = _y.share.jobs;

          this.jobs.observe( (events) =>{
            for(let event of events){
              console.log(event);
              //we may already edit another file
              if( event.name != this.getCurrentFile()){
                return;
              }
              if(event.value.user == this.getUserId() && event.value.state == "pending"){
                let job = event.value;
                //acknowledge job
                job.state ="received";
                this.jobs.set( this.getCurrentFile(), job);
                setTimeout( () => {
                  this.codeEditor.open(this.getCurrentFile(),true).then( () => {
                    //mark job as completed
                    job.state = "completed";
                    this.jobs.set( this.getCurrentFile(), job);
                  });
                });
              }else if(event.value.user != this.getUserId() && event.value.state == "completed"){
                //reload file after other use has reinitialized the file space
                setTimeout( () => {
                  this.codeEditor.open(this.getCurrentFile());
                });
              }
            }
          });
          this.codeEditor.setModalStatus(1);
        })
        .then( () => this.getFile(componentName, fileName ) )
        .then( (traceModel) => {
          this.codeEditor.setModalStatus(2);
          this.processTraceModel(traceModel, forceReload)
          .then( deferred.resolve );
        },() => {
          _y.destroy();
          _y = null;
          this.codeEditor.setModalStatus(0);
          this.codeEditor.hideModal();
          this.codeEditor.hideEditor();
          this.codeEditor.setEditorTitle("File not found");
        });
      }
      // if we are already connected to yjs room, we first need to delete the local user from the participant list
      if(_y){
        _y.destroy();
        _y = null;
      }
      setTimeout( () => {
        _loadFile();
      });

    }

    return deferred.promise();
  }

  /**
   *	Method to handle the model update event. Emited when a model was successfully stored
   */

  modelUpdatedHandler(){
    if( this.getCurrentFile().length > 0){
      //first reload my own file
      this.codeEditor.open(this.getCurrentFile(),true).then( () => {
        let users = this.user.keys().map( (userId) => this.user.get(userId) ).sort( (userA,userB) => userB.time - userA.time);
        let fileToUser = {};
        for(let i=0;i<users.length;i++){
          let file = users[i].fileName;
          if( typeof fileToUser[file] == "undefined"){
            fileToUser[file] = [];
          }
          fileToUser[file].push(users[i]);
        }

        for(let fileName in fileToUser){
          if( fileName != this.getCurrentFile() ){
            if(fileToUser.hasOwnProperty(fileName)){
              let users = fileToUser[fileName];
              let index = 0;
              if(users && users[index]){

                let lastActiveUser = users[index];
                let _observer;
                let _filename = fileName +"";
                let reloaded = false;

                let _reloadFile = ()=>{
                  let job = {
                    task : "reload",
                    user : lastActiveUser.id,
                    state : "pending"
                  }

                  _observer = (events) => {
                    for(let event of events){
                      if(event.name === _filename && event.value && event.value.state == "received"){
                          reloaded = true;
                      }
                    }
                  }
                  this.jobs.observe( _observer );
                  this.jobs.set(_filename,job);
                  //check if job was received, and if not ask the next user for that file
                  setTimeout( () => {
                    if(!reloaded && index < users.length-1){
                      this.jobs.unobserve( _observer );
                      lastActiveUser = users[++index];
                      _reloadFile();
                    }
                  }, 1000);
                }

                _reloadFile();

              }
            }
          }else{
            //inform other user that we have reloaded our file
            let job = {
              task : "reload",
              user : this.getUserId(),
              state : "completed"
            }
            this.jobs.set(fileName,job);
          }
        }
      });
    }
  }

  /**
   * Processes a loaded trace model of a file, i.e. creates the needed yjs types
   * @param {TraceModel} traceModel - A TraceModel instance
   * @param {boolean} forceReload   - True, if the yjs data structures should be recreated
   * @return {promise}              - A promise that is resolved after the trace model has been processes and all yjs data structures have been (re)created
   */

  processTraceModel(traceModel, forceReload){
    return this.createFileSpace( traceModel.getGenerationId(), forceReload )
      .then( (workspaceMap, yjsSegmentMap, yjsSegmentRootList, newCreated) => {
        //this.cursors.set(this.getUserId(),-1);
        let deferred = $.Deferred();
        let todos = this.createYArrays(traceModel.getIndexes(), workspaceMap);
        $.when.apply($,todos).then( function(){
          deferred.resolve(traceModel,yjsSegmentMap, yjsSegmentRootList, Array.prototype.slice.call(arguments), newCreated );
        } );
        return deferred.promise();
      });
  }

  /**
   *	Requests the git hub proxy service to push its local commits to the remote repository of the component
   *	@return {promise}  - The request promise
   */

  push(){
    return this.contentProvider.push( this.roleSpace.getComponentName() ).fail( (e) => {console.error(e)} );
  }

  /**
   * Resolve the current absolute path with the given relative path
   * @param {string} relativePath - The relative path
   * @return {string}             - The resolved absoulte path
   */

  resolvePath(relativePath){
    let path = Path.resolve(this.getCurrentPath(),relativePath);
    return Path.relative("/" , path);
  }

  /**
   * Persist a trace model, i.e. its file content and file traces, to the github proxy server.
   * @param {TraceModel} TraceModel - A TraceModel instance to saveFile
   * @param {string} changedSegment - The name of the changed segment
   */

  saveFile(traceModel, {modelName:changedSegment,modelId}){
    let path = Path.relative("/", this.getCurrentFile() );
    let userName = this.getUserNameByJabberId( this.getUserId() );

    let data = {
      code :  traceModel.getContent(),
      traces : traceModel.toJSON(),
      changedSegment,
      user: userName
    }

    if(modelId){
      this.roleSpace.iwcSendActivity(modelId,changedSegment);
    }

    this.contentProvider.saveFile(path, this.roleSpace.getComponentName() ,data)
    .fail( (error) => {console.error(error)} );
  }

  /**
   *	Update the feedback items such that all users can see them.
   *	@param {object[]} feedbackItems  - The feedback to set
   */

  //setGuidances(feedbackItems){
  //  this.feedbackItems.set("data",feedbackItems);
  //}

  /**
   * Set and update the cursor index of this user in the yjs cursor map
   */

  setRemoteCursor(){
    this.cursors.set(this.getUserId(),this.cursor);
  }

  /**
   * Get the cursor index of a remote user
   * @param {string} userId - A user id
   * @return {number}       - The index position of the user's cursor
   */

  getRemoteCursor(userId){
    return this.cursors.get(userId);
  }

  /**
   * Set and update the cursor index of this user locally.
   * @param {number} index  - The updated cursor index
   */

  setCursor(index){
    this.cursor = index;
    this.delayedSetRemoteCursor();
  }

  addCursorChangeListener(listener){
    this.on("cursorChange" , listener);
  }

  removeCursorChangeListener(listener){
    this.removeListener("cursorChange", listener);
  }
}

export default Workspace;