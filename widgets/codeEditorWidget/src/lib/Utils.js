function runGenObj(genObj, callbacks = undefined) {
  handleOneNext();

  /**
  * Handle one invocation of `next()`:
  * If there was a `prevResult`, it becomes the parameter.
  * What `next()` returns is what we have to run next.
  * The `success` callback triggers another round,
  * with the result assigned to `prevResult`.
  */
  function handleOneNext(prevResult = null) {
    try {
      let yielded = genObj.next(prevResult); // may throw
      if (yielded.done) {
        if (yielded.value !== undefined) {
          // Something was explicitly returned:
          // Report the value as a result to the caller
          callbacks.success(yielded.value);
        }
      } else {
        setTimeout(runYieldedValue, 0, yielded.value);
      }
    }
    // Catch unforeseen errors in genObj
    catch (error) {
      if (callbacks) {
        callbacks.failure(error);
      } else {
        throw error;
      }
    }
  }
  function runYieldedValue(yieldedValue) {
    if (yieldedValue === undefined) {
      // If code yields `undefined`, it wants callbacks
      handleOneNext(callbacks);
    } else if (Array.isArray(yieldedValue)) {
      runInParallel(yieldedValue);
    } else {
      // Yielded value is a generator object
      runGenObj(yieldedValue, {
        success(result) {
          handleOneNext(result);
        },
        failure(err) {
          genObj.throw(err);
        },
      });
    }
  }

  function runInParallel(genObjs) {
    let resultArray = new Array(genObjs.length);
    let resultCountdown = genObjs.length;
    for (let [i,genObj] of genObjs.entries()) {
      runGenObj(genObj, {
        success(result) {
          resultArray[i] = result;
          resultCountdown--;
          if (resultCountdown <= 0) {
            handleOneNext(resultArray);
          }
        },
        failure(err) {
          genObj.throw(err);
        },
      });
    }
  }
}


export function debounce(callback,time,clear=true){
  let timer = false;
  return function(){
    if (timer && clear) {
      clearTimeout(timer);
      timer = false;
    }
    let args = arguments;
    if (!timer) {
      timer = setTimeout(function(){
        callback.apply(this,args);
        timer=false;
      }.bind(this),time);
    }
  }
}

export function run(generator){
  runGenObj(generator());
}

export function getParticipantColor(count){
  console.log(count);
  let colors = [
    {bg:"#ff9900",fg:"#ffffff"},
    {bg:"#cbff00",fg:"#ffffff"},
    {bg:"#00ff66",fg:"#ffffff"},
    {bg:"#0066ff",fg:"#ffffff"},
    {bg:"#cc00ff",fg:"#ffffff"}
  ];
  return colors[ count % colors.length ];
}

export function genBind(callback){
  let self = this;
  return function*(){
    const caller = yield;
    callback.apply(this,arguments).then( caller.success );
  }
}

/**
* Converts the given asynchron function "callback" that expects a callback as last parameter into a promise
* Originally taken from SyncMeta Utils library
* @param {function} callback - The asynchron function
* @returns {Promise}
*/

export function toPromise(callback){
  return function(){
    let args = Array.prototype.slice.call(arguments);
    let deferred = $.Deferred();
    args.push(function(){
      deferred.resolve.apply(this,arguments);
    });
    callback.apply(this,args);
    return deferred.promise();
  }
}

/**
* Creates a promise that resolves after "time" milliseconds
* Originally taken from SyncMeta Utils library
* @param {int} time - The time in milliseconds
* @returns {Promise}
*/
export function waitPromise(time){
  let deferred = $.Deferred();
  setTimeout(function(){
    deferred.resolve();
  },time);
  return deferred.promise();
}

export function delayed(callback,time,clear=true){
  console.log(this.timer,clear);
  if (this.timer && clear) {
    clearTimeout(this.timer);
    this.timer = false;
  }
  if (!this.timer) {
    console.log("new timer");
    this.timer = setTimeout(function(){
      callback.bind(this)();
      this.timer=false;
    }.bind(this),time);

  }
}
