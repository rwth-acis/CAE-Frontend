/** @module Utils */

/**
 * Generates a simple hash value for a string
 * @param {string} string - The string to hash
 * @return {string}       - The hashed string
 */

export function getHash(string){
  let hash = 0, i, chr, len;
  if (string.length === 0) return hash;
  for (i = 0, len = string.length; i < len; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

export function delayed(callback,time,clear=true){
  if (this.timer && clear) {
    clearTimeout(this.timer);
    this.timer = false;
  }
  if (!this.timer) {
    this.timer = setTimeout(function(){
      callback.bind(this)();
      this.timer=false;
    }.bind(this),time);

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

/**
 *	Calculates the bg and fg color of an user
 *	@param {number} count  - The count of the user
 *	@return {object}       - An object containing bg and fg color
 */

export function getParticipantColor(count){
  let colors = [
    {bg:"#ff9900",fg:"#ffffff"},
    {bg:"#cc00ff",fg:"#ffffff"},
    {bg:"#0066ff",fg:"#ffffff"},
    {bg:"#cbff00",fg:"#394700"},
    {bg:"#00ff66",fg:"#005C25"}
  ];
  return colors[ count % colors.length ];
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

