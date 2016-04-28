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