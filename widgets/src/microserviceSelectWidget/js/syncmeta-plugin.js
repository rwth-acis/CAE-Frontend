//Copyright 2012, etc.

(function (root, factory) {
    //if (syncmeta_api && typeof syncmeta_api.define === 'function' && syncmeta_api.define.amd) {
        // AMD.
   //     define(['jquery'], factory);
   // } else {
        // Browser globals
        root.syncmeta = factory(root.$, root._);
    //}
}(this, function ($, _) {


var syncmeta_api;(function () { if (!syncmeta_api || !syncmeta_api.requirejs) {
if (!syncmeta_api) { syncmeta_api = {}; } else { require = syncmeta_api; }
/**
 * almond 0.1.2 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var defined = {},
        waiting = {},
        config = {},
        defining = {},
        aps = [].slice,
        main, req;

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {},
            nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part;

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; (part = name[i]); i++) {
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            return true;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (waiting.hasOwnProperty(name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!defined.hasOwnProperty(name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    function makeMap(name, relName) {
        var prefix, plugin,
            index = name.indexOf('!');

        if (index !== -1) {
            prefix = normalize(name.slice(0, index), relName);
            name = name.slice(index + 1);
            plugin = callDep(prefix);

            //Normalize according
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            p: plugin
        };
    }

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    main = function (name, deps, callback, relName) {
        var args = [],
            usingExports,
            cjsModule, depName, ret, map, i;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i++) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = makeRequire(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = defined[name] = {};
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = {
                        id: name,
                        uri: '',
                        exports: defined[name],
                        config: makeConfig(name)
                    };
                } else if (defined.hasOwnProperty(depName) || waiting.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else if (!defining[depName]) {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                    cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync) {
        if (typeof deps === "string") {
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        waiting[name] = [name, deps, callback];
    };

    define.amd = {
        jQuery: true
    };
}());

syncmeta_api.requirejs = requirejs;syncmeta_api.require = require;syncmeta_api.define = define;
}
}());
syncmeta_api.define("../..//tools/almond", function(){});

!function e(t,r,n){function i(s,o){if(!r[s]){if(!t[s]){var u="function"==typeof require&&require;if(!o&&u)return u(s,!0);if(a)return a(s,!0);var c=new Error("Cannot find module '"+s+"'");throw c.code="MODULE_NOT_FOUND",c}var l=r[s]={exports:{}};t[s][0].call(l.exports,function(e){var r=t[s][1][e];return i(r?r:e)},l,l.exports,e,t,r,n)}return r[s].exports}for(var a="function"==typeof require&&require,s=0;s<n.length;s++)i(n[s]);return i}({1:[function(e,t,r){function n(e){return c===setTimeout?setTimeout(e,0):c.call(null,e,0)}function i(e){l===clearTimeout?clearTimeout(e):l.call(null,e)}function a(){p&&f&&(p=!1,f.length?h=f.concat(h):g=-1,h.length&&s())}function s(){if(!p){var e=n(a);p=!0;for(var t=h.length;t;){for(f=h,h=[];++g<t;)f&&f[g].run();g=-1,t=h.length}f=null,p=!1,i(e)}}function o(e,t){this.fun=e,this.array=t}function u(){}var c,l,d=t.exports={};!function(){try{c=setTimeout}catch(e){c=function(){throw new Error("setTimeout is not defined")}}try{l=clearTimeout}catch(e){l=function(){throw new Error("clearTimeout is not defined")}}}();var f,h=[],p=!1,g=-1;d.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)t[r-1]=arguments[r];h.push(new o(e,t)),1!==h.length||p||n(s)},o.prototype.run=function(){this.fun.apply(null,this.array)},d.title="browser",d.browser=!0,d.env={},d.argv=[],d.version="",d.versions={},d.on=u,d.addListener=u,d.once=u,d.off=u,d.removeListener=u,d.removeAllListeners=u,d.emit=u,d.binding=function(e){throw new Error("process.binding is not supported")},d.cwd=function(){return"/"},d.chdir=function(e){throw new Error("process.chdir is not supported")},d.umask=function(){return 0}},{}],2:[function(e,t,r){(function(e,r){"use strict";var n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol?"symbol":typeof e};!function(r){function i(e,t,r,n){var i=Object.create((t||s).prototype),a=new g(n||[]);return i._invoke=f(e,r,a),i}function a(e,t,r){try{return{type:"normal",arg:e.call(t,r)}}catch(e){return{type:"throw",arg:e}}}function s(){}function o(){}function u(){}function c(e){["next","throw","return"].forEach(function(t){e[t]=function(e){return this._invoke(t,e)}})}function l(e){this.arg=e}function d(t){function r(e,n,i,s){var o=a(t[e],t,n);if("throw"!==o.type){var u=o.arg,c=u.value;return c instanceof l?Promise.resolve(c.arg).then(function(e){r("next",e,i,s)},function(e){r("throw",e,i,s)}):Promise.resolve(c).then(function(e){u.value=e,i(u)},s)}s(o.arg)}function i(e,t){function n(){return new Promise(function(n,i){r(e,t,n,i)})}return s=s?s.then(n,n):n()}"object"===("undefined"==typeof e?"undefined":n(e))&&e.domain&&(r=e.domain.bind(r));var s;this._invoke=i}function f(e,t,r){var n=R;return function(i,s){if(n===S)throw new Error("Generator is already running");if(n===T){if("throw"===i)throw s;return b()}for(;;){var o=r.delegate;if(o){if("return"===i||"throw"===i&&o.iterator[i]===v){r.delegate=null;var u=o.iterator.return;if(u){var c=a(u,o.iterator,s);if("throw"===c.type){i="throw",s=c.arg;continue}}if("return"===i)continue}var c=a(o.iterator[i],o.iterator,s);if("throw"===c.type){r.delegate=null,i="throw",s=c.arg;continue}i="next",s=v;var l=c.arg;if(!l.done)return n=I,l;r[o.resultName]=l.value,r.next=o.nextLoc,r.delegate=null}if("next"===i)r.sent=r._sent=s;else if("throw"===i){if(n===R)throw n=T,s;r.dispatchException(s)&&(i="next",s=v)}else"return"===i&&r.abrupt("return",s);n=S;var c=a(e,t,r);if("normal"===c.type){n=r.done?T:I;var l={value:c.arg,done:r.done};if(c.arg!==C)return l;r.delegate&&"next"===i&&(s=v)}else"throw"===c.type&&(n=T,i="throw",s=c.arg)}}}function h(e){var t={tryLoc:e[0]};1 in e&&(t.catchLoc=e[1]),2 in e&&(t.finallyLoc=e[2],t.afterLoc=e[3]),this.tryEntries.push(t)}function p(e){var t=e.completion||{};t.type="normal",delete t.arg,e.completion=t}function g(e){this.tryEntries=[{tryLoc:"root"}],e.forEach(h,this),this.reset(!0)}function y(e){if(e){var t=e[x];if(t)return t.call(e);if("function"==typeof e.next)return e;if(!isNaN(e.length)){var r=-1,n=function t(){for(;++r<e.length;)if(k.call(e,r))return t.value=e[r],t.done=!1,t;return t.value=v,t.done=!0,t};return n.next=n}}return{next:b}}function b(){return{value:v,done:!0}}var v,k=Object.prototype.hasOwnProperty,m="function"==typeof Symbol?Symbol:{},x=m.iterator||"@@iterator",w=m.toStringTag||"@@toStringTag",O="object"===("undefined"==typeof t?"undefined":n(t)),Y=r.regeneratorRuntime;if(Y)return void(O&&(t.exports=Y));Y=r.regeneratorRuntime=O?t.exports:{},Y.wrap=i;var R="suspendedStart",I="suspendedYield",S="executing",T="completed",C={},E=u.prototype=s.prototype;o.prototype=E.constructor=u,u.constructor=o,u[w]=o.displayName="GeneratorFunction",Y.isGeneratorFunction=function(e){var t="function"==typeof e&&e.constructor;return!!t&&(t===o||"GeneratorFunction"===(t.displayName||t.name))},Y.mark=function(e){return Object.setPrototypeOf?Object.setPrototypeOf(e,u):(e.__proto__=u,w in e||(e[w]="GeneratorFunction")),e.prototype=Object.create(E),e},Y.awrap=function(e){return new l(e)},c(d.prototype),Y.async=function(e,t,r,n){var a=new d(i(e,t,r,n));return Y.isGeneratorFunction(t)?a:a.next().then(function(e){return e.done?e.value:a.next()})},c(E),E[x]=function(){return this},E[w]="Generator",E.toString=function(){return"[object Generator]"},Y.keys=function(e){var t=[];for(var r in e)t.push(r);return t.reverse(),function r(){for(;t.length;){var n=t.pop();if(n in e)return r.value=n,r.done=!1,r}return r.done=!0,r}},Y.values=y,g.prototype={constructor:g,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=v,this.done=!1,this.delegate=null,this.tryEntries.forEach(p),!e)for(var t in this)"t"===t.charAt(0)&&k.call(this,t)&&!isNaN(+t.slice(1))&&(this[t]=v)},stop:function(){this.done=!0;var e=this.tryEntries[0],t=e.completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(e){function t(t,n){return a.type="throw",a.arg=e,r.next=t,!!n}if(this.done)throw e;for(var r=this,n=this.tryEntries.length-1;n>=0;--n){var i=this.tryEntries[n],a=i.completion;if("root"===i.tryLoc)return t("end");if(i.tryLoc<=this.prev){var s=k.call(i,"catchLoc"),o=k.call(i,"finallyLoc");if(s&&o){if(this.prev<i.catchLoc)return t(i.catchLoc,!0);if(this.prev<i.finallyLoc)return t(i.finallyLoc)}else if(s){if(this.prev<i.catchLoc)return t(i.catchLoc,!0)}else{if(!o)throw new Error("try statement without catch or finally");if(this.prev<i.finallyLoc)return t(i.finallyLoc)}}}},abrupt:function(e,t){for(var r=this.tryEntries.length-1;r>=0;--r){var n=this.tryEntries[r];if(n.tryLoc<=this.prev&&k.call(n,"finallyLoc")&&this.prev<n.finallyLoc){var i=n;break}}i&&("break"===e||"continue"===e)&&i.tryLoc<=t&&t<=i.finallyLoc&&(i=null);var a=i?i.completion:{};return a.type=e,a.arg=t,i?this.next=i.finallyLoc:this.complete(a),C},complete:function(e,t){if("throw"===e.type)throw e.arg;"break"===e.type||"continue"===e.type?this.next=e.arg:"return"===e.type?(this.rval=e.arg,this.next="end"):"normal"===e.type&&t&&(this.next=t)},finish:function(e){for(var t=this.tryEntries.length-1;t>=0;--t){var r=this.tryEntries[t];if(r.finallyLoc===e)return this.complete(r.completion,r.afterLoc),p(r),C}},catch:function(e){for(var t=this.tryEntries.length-1;t>=0;--t){var r=this.tryEntries[t];if(r.tryLoc===e){var n=r.completion;if("throw"===n.type){var i=n.arg;p(r)}return i}}throw new Error("illegal catch attempt")},delegateYield:function(e,t,r){return this.delegate={iterator:y(e),resultName:t,nextLoc:r},C}}}("object"===("undefined"==typeof r?"undefined":n(r))?r:"object"===("undefined"==typeof window?"undefined":n(window))?window:"object"===("undefined"==typeof self?"undefined":n(self))?self:void 0)}).call(this,e("_process"),"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{_process:1}],3:[function(e,t,r){"use strict";console.warn("The regenerator/runtime module is deprecated; please import regenerator-runtime/runtime instead."),t.exports=e("regenerator-runtime/runtime")},{"regenerator-runtime/runtime":2}],4:[function(e,t,r){"use strict";function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var i=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}();t.exports=function(e){var t=function(){function t(e,r){if(n(this,t),this.y=e,null==r&&(r={}),null==r.role||"master"===r.role)this.role="master";else{if("slave"!==r.role)throw new Error("Role must be either 'master' or 'slave'!");this.role="slave"}this.y.db.forwardAppliedOperations=r.forwardAppliedOperations||!1,this.role=r.role,this.connections={},this.isSynced=!1,this.userEventListeners=[],this.whenSyncedListeners=[],this.currentSyncTarget=null,this.syncingClients=[],this.forwardToSyncingClients=r.forwardToSyncingClients!==!1,this.debug=r.debug===!0,this.broadcastedHB=!1,this.syncStep2=Promise.resolve(),this.broadcastOpBuffer=[],this.protocolVersion=11}return i(t,[{key:"reconnect",value:function(){}},{key:"disconnect",value:function(){return this.connections={},this.isSynced=!1,this.currentSyncTarget=null,this.broadcastedHB=!1,this.syncingClients=[],this.whenSyncedListeners=[],this.y.db.stopGarbageCollector()}},{key:"repair",value:function(){console.info("Repairing the state of Yjs. This can happen if messages get lost, and Yjs detects that something is wrong. If this happens often, please report an issue here: https://github.com/y-js/yjs/issues");for(var e in this.connections)this.connections[e].isSynced=!1;this.isSynced=!1,this.currentSyncTarget=null,this.broadcastedHB=!1,this.findNextSyncTarget()}},{key:"setUserId",value:function(e){return null==this.userId?(this.userId=e,this.y.db.setUserId(e)):null}},{key:"onUserEvent",value:function(e){this.userEventListeners.push(e)}},{key:"userLeft",value:function(e){if(null!=this.connections[e]){delete this.connections[e],e===this.currentSyncTarget&&(this.currentSyncTarget=null,this.findNextSyncTarget()),this.syncingClients=this.syncingClients.filter(function(t){return t!==e});var t=!0,r=!1,n=void 0;try{for(var i,a=this.userEventListeners[Symbol.iterator]();!(t=(i=a.next()).done);t=!0){var s=i.value;s({action:"userLeft",user:e})}}catch(e){r=!0,n=e}finally{try{!t&&a.return&&a.return()}finally{if(r)throw n}}}}},{key:"userJoined",value:function(e,t){if(null==t)throw new Error("You must specify the role of the joined user!");if(null!=this.connections[e])throw new Error("This user already joined!");this.connections[e]={isSynced:!1,role:t};var r=!0,n=!1,i=void 0;try{for(var a,s=this.userEventListeners[Symbol.iterator]();!(r=(a=s.next()).done);r=!0){var o=a.value;o({action:"userJoined",user:e,role:t})}}catch(e){n=!0,i=e}finally{try{!r&&s.return&&s.return()}finally{if(n)throw i}}null==this.currentSyncTarget&&this.findNextSyncTarget()}},{key:"whenSynced",value:function(e){this.isSynced?e():this.whenSyncedListeners.push(e)}},{key:"findNextSyncTarget",value:function(){if(null==this.currentSyncTarget&&!this.isSynced){var e=null;for(var t in this.connections)if(!this.connections[t].isSynced){e=t;break}var r=this;null!=e?(this.currentSyncTarget=e,this.y.db.requestTransaction(regeneratorRuntime.mark(function t(){var n,i;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.delegateYield(this.getStateSet(),"t0",1);case 1:return n=t.t0,t.delegateYield(this.getDeleteSet(),"t1",3);case 3:i=t.t1,r.send(e,{type:"sync step 1",stateSet:n,deleteSet:i,protocolVersion:r.protocolVersion});case 5:case"end":return t.stop()}},t,this)}))):this.y.db.requestTransaction(regeneratorRuntime.mark(function e(){var t,n,i,a,s,o;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return r.isSynced=!0,e.delegateYield(this.garbageCollectAfterSync(),"t0",2);case 2:for(t=!0,n=!1,i=void 0,e.prev=5,a=r.whenSyncedListeners[Symbol.iterator]();!(t=(s=a.next()).done);t=!0)(o=s.value)();e.next=13;break;case 9:e.prev=9,e.t1=e.catch(5),n=!0,i=e.t1;case 13:e.prev=13,e.prev=14,!t&&a.return&&a.return();case 16:if(e.prev=16,!n){e.next=19;break}throw i;case 19:return e.finish(16);case 20:return e.finish(13);case 21:r.whenSyncedListeners=[];case 22:case"end":return e.stop()}},e,this,[[5,9,13,21],[14,,16,20]])}))}}},{key:"send",value:function(e,t){this.debug&&console.log("send "+this.userId+" -> "+e+": "+t.type,t)}},{key:"broadcastOps",value:function(t){function r(){n.broadcastOpBuffer.length>0&&(n.broadcast({type:"update",ops:n.broadcastOpBuffer}),n.broadcastOpBuffer=[])}t=t.map(function(t){return e.Struct[t.struct].encode(t)});var n=this;0===this.broadcastOpBuffer.length?(this.broadcastOpBuffer=t,this.y.db.transactionInProgress?this.y.db.whenTransactionsFinished().then(r):setTimeout(r,0)):this.broadcastOpBuffer=this.broadcastOpBuffer.concat(t)}},{key:"receiveMessage",value:function(e,t){var r=this;if(e!==this.userId){if(this.debug&&console.log("receive "+e+" -> "+this.userId+": "+t.type,JSON.parse(JSON.stringify(t))),null!=t.protocolVersion&&t.protocolVersion!==this.protocolVersion)return console.error("You tried to sync with a yjs instance that has a different protocol version\n          (You: "+this.protocolVersion+", Client: "+t.protocolVersion+").\n          The sync was stopped. You need to upgrade your dependencies (especially Yjs & the Connector)!\n          "),void this.send(e,{type:"sync stop",protocolVersion:this.protocolVersion});if("sync step 1"===t.type)!function(){var n=r,i=t;r.y.db.requestTransaction(regeneratorRuntime.mark(function t(){var r,a,s;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.delegateYield(this.getStateSet(),"t0",1);case 1:return r=t.t0,t.delegateYield(this.applyDeleteSet(i.deleteSet),"t1",3);case 3:return t.delegateYield(this.getDeleteSet(),"t2",4);case 4:return a=t.t2,t.delegateYield(this.getOperations(i.stateSet),"t3",6);case 6:s=t.t3,n.send(e,{type:"sync step 2",os:s,stateSet:r,deleteSet:a,protocolVersion:this.protocolVersion}),this.forwardToSyncingClients?(n.syncingClients.push(e),setTimeout(function(){n.syncingClients=n.syncingClients.filter(function(t){return t!==e}),n.send(e,{type:"sync done"})},5e3)):n.send(e,{type:"sync done"}),n._setSyncedWith(e);case 10:case"end":return t.stop()}},t,this)}))}();else if("sync step 2"===t.type){var n,i,a;!function(){var s=r;n=!r.broadcastedHB,r.broadcastedHB=!0,i=r.y.db,a={},a.promise=new Promise(function(e){a.resolve=e}),r.syncStep2=a.promise;var o=t;i.requestTransaction(regeneratorRuntime.mark(function t(){return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.delegateYield(this.applyDeleteSet(o.deleteSet),"t0",1);case 1:this.store.apply(o.os),i.requestTransaction(regeneratorRuntime.mark(function t(){var r;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.delegateYield(this.getOperations(o.stateSet),"t0",1);case 1:r=t.t0,r.length>0&&(n?s.broadcastOps(r):s.send(e,{type:"update",ops:r})),a.resolve();case 4:case"end":return t.stop()}},t,this)}));case 3:case"end":return t.stop()}},t,this)}))}()}else if("sync done"===t.type){var s=this;this.syncStep2.then(function(){s._setSyncedWith(e)})}else if("update"===t.type){if(this.forwardToSyncingClients){var o=!0,u=!1,c=void 0;try{for(var l,d=this.syncingClients[Symbol.iterator]();!(o=(l=d.next()).done);o=!0){var f=l.value;this.send(f,t)}}catch(e){u=!0,c=e}finally{try{!o&&d.return&&d.return()}finally{if(u)throw c}}}if(this.y.db.forwardAppliedOperations){var h=t.ops.filter(function(e){return"Delete"===e.struct});h.length>0&&this.broadcastOps(h)}this.y.db.apply(t.ops)}}}},{key:"_setSyncedWith",value:function(e){var t=this.connections[e];null!=t&&(t.isSynced=!0),e===this.currentSyncTarget&&(this.currentSyncTarget=null,this.findNextSyncTarget())}},{key:"parseMessageFromXml",value:function(e){function t(e){var n=!0,i=!1,a=void 0;try{for(var s,o=e.children[Symbol.iterator]();!(n=(s=o.next()).done);n=!0){var u=s.value;return"true"===u.getAttribute("isArray")?t(u):r(u)}}catch(e){i=!0,a=e}finally{try{!n&&o.return&&o.return()}finally{if(i)throw a}}}function r(e){var n={};for(var i in e.attrs){var a=e.attrs[i],s=parseInt(a,10);isNaN(s)||""+s!==a?n[i]=a:n[i]=s}for(var o in e.children){var u=o.name;"true"===o.getAttribute("isArray")?n[u]=t(o):n[u]=r(o)}return n}r(e)}},{key:"encodeMessageToXml",value:function(e,t){function r(e,t){for(var i in t){var a=t[i];null==i||(a.constructor===Object?r(e.c(i),a):a.constructor===Array?n(e.c(i),a):e.setAttribute(i,a))}}function n(e,t){e.setAttribute("isArray","true");var i=!0,a=!1,s=void 0;try{for(var o,u=t[Symbol.iterator]();!(i=(o=u.next()).done);i=!0){var c=o.value;c.constructor===Object?r(e.c("array-element"),c):n(e.c("array-element"),c)}}catch(e){a=!0,s=e}finally{try{!i&&u.return&&u.return()}finally{if(a)throw s}}}if(t.constructor===Object)r(e.c("y",{xmlns:"http://y.ninja/connector-stanza"}),t);else{if(t.constructor!==Array)throw new Error("I can't encode this json!");n(e.c("y",{xmlns:"http://y.ninja/connector-stanza"}),t)}}}]),t}();e.AbstractConnector=t}},{}],5:[function(e,t,r){"use strict";function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function a(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var s=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}(),o=function e(t,r,n){null===t&&(t=Function.prototype);var i=Object.getOwnPropertyDescriptor(t,r);if(void 0===i){var a=Object.getPrototypeOf(t);return null===a?void 0:e(a,r,n)}if("value"in i)return i.value;var s=i.get;if(void 0!==s)return s.call(n)};t.exports=function(e){var t={users:{},buffers:{},removeUser:function(e){for(var t in this.users)this.users[t].userLeft(e);delete this.users[e],delete this.buffers[e]},addUser:function(e){this.users[e.userId]=e,this.buffers[e.userId]={};for(var t in this.users)if(t!==e.userId){var r=this.users[t];r.userJoined(e.userId,"master"),e.userJoined(r.userId,"master")}},whenTransactionsFinished:function(){var e=[];for(var t in this.users)e.push(this.users[t].y.db.whenTransactionsFinished());return Promise.all(e)},flushOne:function(){var e=[];for(var r in t.buffers){var n=t.buffers[r],i=!1;for(var a in n)if(n[a].length>0){i=!0;break}i&&e.push(r)}if(e.length>0){var s=getRandom(e),o=t.buffers[s],u=getRandom(Object.keys(o)),c=o[u].shift();0===o[u].length&&delete o[u];var l=t.users[s];return l.receiveMessage(c[0],c[1]),l.y.db.whenTransactionsFinished()}return!1},flushAll:function(){return new Promise(function(e){function r(){var n=t.flushOne();if(n){for(;n;)n=t.flushOne();t.whenTransactionsFinished().then(r)}else setTimeout(function(){var n=t.flushOne();n?n.then(function(){t.whenTransactionsFinished().then(r)}):e()},0)}t.whenTransactionsFinished().then(r)})}};e.utils.globalRoom=t;var r=0,u=function(u){function c(e,a){if(n(this,c),void 0===a)throw new Error("Options must not be undefined!");a.role="master",a.forwardToSyncingClients=!1;var s=i(this,Object.getPrototypeOf(c).call(this,e,a));return s.setUserId(r++ +"").then(function(){t.addUser(s)}),s.globalRoom=t,s.syncingClientDuration=0,s}return a(c,u),s(c,[{key:"receiveMessage",value:function(e,t){o(Object.getPrototypeOf(c.prototype),"receiveMessage",this).call(this,e,JSON.parse(JSON.stringify(t)))}},{key:"send",value:function(e,r){var n=t.buffers[e];null!=n&&(null==n[this.userId]&&(n[this.userId]=[]),n[this.userId].push(JSON.parse(JSON.stringify([this.userId,r]))))}},{key:"broadcast",value:function(e){for(var r in t.buffers){var n=t.buffers[r];null==n[this.userId]&&(n[this.userId]=[]),n[this.userId].push(JSON.parse(JSON.stringify([this.userId,e])))}}},{key:"isDisconnected",value:function(){return null==t.users[this.userId]}},{key:"reconnect",value:function(){return this.isDisconnected()&&(t.addUser(this),o(Object.getPrototypeOf(c.prototype),"reconnect",this).call(this)),e.utils.globalRoom.flushAll()}},{key:"disconnect",value:function(){return this.isDisconnected()||(t.removeUser(this.userId),o(Object.getPrototypeOf(c.prototype),"disconnect",this).call(this)),this.y.db.whenTransactionsFinished()}},{key:"flush",value:function(){var e=this;return async(regeneratorRuntime.mark(function r(){var n,i,a;return regeneratorRuntime.wrap(function(r){for(;;)switch(r.prev=r.next){case 0:for(n=t.buffers[e.userId];Object.keys(n).length>0;)i=getRandom(Object.keys(n)),a=n[i].shift(),0===n[i].length&&delete n[i],this.receiveMessage(a[0],a[1]);return r.next=4,e.whenTransactionsFinished();case 4:case"end":return r.stop()}},r,this)}))}}]),c}(e.AbstractConnector);e.Test=u}},{}],6:[function(e,t,r){"use strict";function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var i=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}();t.exports=function(e){var t=function(){function t(e,r){function i(){return a.whenTransactionsFinished().then(function(){return a.gc1.length>0||a.gc2.length>0?(a.y.isConnected()||console.warn("gc should be empty when disconnected!"),new Promise(function(e){a.requestTransaction(regeneratorRuntime.mark(function t(){var r,n;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:if(null==a.y.connector||!a.y.connector.isSynced){t.next=10;break}r=0;case 2:if(!(r<a.gc2.length)){t.next=8;break}return n=a.gc2[r],t.delegateYield(this.garbageCollectOperation(n),"t0",5);case 5:r++,t.next=2;break;case 8:a.gc2=a.gc1,a.gc1=[];case 10:a.gcTimeout>0&&(a.gcInterval=setTimeout(i,a.gcTimeout)),e();case 12:case"end":return t.stop()}},t,this)}))})):(a.gcTimeout>0&&(a.gcInterval=setTimeout(i,a.gcTimeout)),Promise.resolve())})}n(this,t),this.y=e;var a=this;this.userId=null;var s;this.userIdPromise=new Promise(function(e){s=e}),this.userIdPromise.resolve=s,this.forwardAppliedOperations=!1,this.listenersById={},this.listenersByIdExecuteNow=[],this.listenersByIdRequestPending=!1,this.initializedTypes={},this.waitingTransactions=[],this.transactionInProgress=!1,this.transactionIsFlushed=!1,"undefined"!=typeof YConcurrency_TestingMode&&(this.executeOrder=[]),this.gc1=[],this.gc2=[],this.gcTimeout=r.gcTimeout?r.gcTimeouts:5e4,this.garbageCollect=i,this.gcTimeout>0&&i(),this.repairCheckInterval=r.repairCheckInterval?r.repairCheckInterval:6e3,this.opsReceivedTimestamp=new Date,this.startRepairCheck()}return i(t,[{key:"startRepairCheck",value:function(){var e=this;this.repairCheckInterval>0&&(this.repairCheckIntervalHandler=setInterval(function(){new Date-e.opsReceivedTimestamp>e.repairCheckInterval&&Object.keys(e.listenersById).length>0&&(e.listenersById={},e.opsReceivedTimestamp=new Date,e.y.connector.repair())},this.repairCheckInterval))}},{key:"stopRepairCheck",value:function(){clearInterval(this.repairCheckIntervalHandler)}},{key:"queueGarbageCollector",value:function(e){this.y.isConnected()&&this.gc1.push(e)}},{key:"emptyGarbageCollector",value:function(){var e=this;return new Promise(function(t){var r=function r(){e.gc1.length>0||e.gc2.length>0?e.garbageCollect().then(r):t()};setTimeout(r,0)})}},{key:"addToDebug",value:function(){if("undefined"!=typeof YConcurrency_TestingMode){var e=Array.prototype.map.call(arguments,function(e){return"string"==typeof e?e:JSON.stringify(e)}).join("").replace(/"/g,"'").replace(/,/g,", ").replace(/:/g,": ");this.executeOrder.push(e)}}},{key:"getDebugData",value:function(){console.log(this.executeOrder.join("\n"))}},{key:"stopGarbageCollector",value:function(){var e=this;return new Promise(function(t){e.requestTransaction(regeneratorRuntime.mark(function r(){var n,i,a;return regeneratorRuntime.wrap(function(r){for(;;)switch(r.prev=r.next){case 0:n=e.gc1.concat(e.gc2),e.gc1=[],e.gc2=[],i=0;case 4:if(!(i<n.length)){r.next=13;break}return r.delegateYield(this.getOperation(n[i]),"t0",6);case 6:if(a=r.t0,null==a){r.next=10;break}return delete a.gc,r.delegateYield(this.setOperation(a),"t1",10);case 10:i++,r.next=4;break;case 13:t();case 14:case"end":return r.stop()}},r,this)}))})}},{key:"addToGarbageCollector",value:regeneratorRuntime.mark(function e(t,r){var n;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(null!=t.gc||t.deleted!==!0){e.next=15;break}if(n=!1,null==r||r.deleted!==!0){e.next=6;break}n=!0,e.next=10;break;case 6:if(!(null!=t.content&&t.content.length>1)){e.next=10;break}return e.delegateYield(this.getInsertionCleanStart([t.id[0],t.id[1]+1]),"t0",8);case 8:t=e.t0,n=!0;case 10:if(!n){e.next=15;break}return t.gc=!0,e.delegateYield(this.setOperation(t),"t1",13);case 13:return this.store.queueGarbageCollector(t.id),e.abrupt("return",!0);case 15:return e.abrupt("return",!1);case 16:case"end":return e.stop()}},e,this)})},{key:"removeFromGarbageCollector",value:function(t){function r(r){return!e.utils.compareIds(r,t.id)}this.gc1=this.gc1.filter(r),this.gc2=this.gc2.filter(r),delete t.gc}},{key:"destroy",value:regeneratorRuntime.mark(function e(){var t,r;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:clearInterval(this.gcInterval),this.gcInterval=null,this.stopRepairCheck();for(t in this.initializedTypes)r=this.initializedTypes[t],null!=r._destroy?r._destroy():console.error("The type you included does not provide destroy functionality, it will remain in memory (updating your packages will help).");case 4:case"end":return e.stop()}},e,this)})},{key:"setUserId",value:function(e){if(!this.userIdPromise.inProgress){this.userIdPromise.inProgress=!0;var t=this;t.requestTransaction(regeneratorRuntime.mark(function r(){var n;return regeneratorRuntime.wrap(function(r){for(;;)switch(r.prev=r.next){case 0:return t.userId=e,r.delegateYield(this.getState(e),"t0",2);case 2:n=r.t0,t.opClock=n.clock,t.userIdPromise.resolve(e);case 5:case"end":return r.stop()}},r,this)}))}return this.userIdPromise}},{key:"whenUserIdSet",value:function(e){this.userIdPromise.then(e)}},{key:"getNextOpId",value:function(e){if(null==e)throw new Error("getNextOpId expects the number of created ids to create!");if(null==this.userId)throw new Error("OperationStore not yet initialized!");var t=[this.userId,this.opClock];return this.opClock+=e,t}},{key:"apply",value:function(t){this.opsReceivedTimestamp=new Date;for(var r=0;r<t.length;r++){var n=t[r];if(null==n.id||n.id[0]!==this.y.connector.userId){var i=e.Struct[n.struct].requiredOps(n);null!=n.requires&&(i=i.concat(n.requires)),this.whenOperationsExist(i,n)}}}},{key:"whenOperationsExist",value:function(e,t){if(e.length>0)for(var r={op:t,missing:e.length},n=0;n<e.length;n++){var i=e[n],a=JSON.stringify(i),s=this.listenersById[a];null==s&&(s=[],this.listenersById[a]=s),s.push(r)}else this.listenersByIdExecuteNow.push({op:t});if(!this.listenersByIdRequestPending){this.listenersByIdRequestPending=!0;var o=this;this.requestTransaction(regeneratorRuntime.mark(function e(){var t,r,n,i,a,s,u,c,l,d,f;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:t=o.listenersByIdExecuteNow,o.listenersByIdExecuteNow=[],r=o.listenersById,o.listenersById={},o.listenersByIdRequestPending=!1,n=0;case 6:if(!(n<t.length)){e.next=12;break}return i=t[n].op,e.delegateYield(o.tryExecute.call(this,i),"t0",9);case 9:n++,e.next=6;break;case 12:e.t1=regeneratorRuntime.keys(r);case 13:if((e.t2=e.t1()).done){e.next=39;break}if(a=e.t2.value,s=r[a],u=JSON.parse(a),"string"!=typeof u[1]){e.next=22;break}return e.delegateYield(this.getOperation(u),"t3",19);case 19:c=e.t3,e.next=24;break;case 22:return e.delegateYield(this.getInsertion(u),"t4",23);case 23:c=e.t4;case 24:if(null!=c){e.next=28;break}o.listenersById[a]=s,e.next=37;break;case 28:l=0;case 29:if(!(l<s.length)){e.next=37;break}if(d=s[l],f=d.op,0!==--d.missing){e.next=34;break}return e.delegateYield(o.tryExecute.call(this,f),"t5",34);case 34:l++,e.next=29;break;case 37:e.next=13;break;case 39:case"end":return e.stop()}},e,this)}))}}},{key:"tryExecute",value:regeneratorRuntime.mark(function t(r){var n,i,a,s;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:if(this.store.addToDebug("yield* this.store.tryExecute.call(this, ",JSON.stringify(r),")"),"Delete"!==r.struct){t.next=5;break}return t.delegateYield(e.Struct.Delete.execute.call(this,r),"t0",3);case 3:t.next=32;break;case 5:return t.delegateYield(this.getInsertion(r.id),"t1",6);case 6:n=t.t1;case 7:if(null==n||null==n.content){t.next=21;break}if(!(n.id[1]+n.content.length<r.id[1]+r.content.length)){t.next=18;break}return i=n.content.length-(r.id[1]-n.id[1]),r.content.splice(0,i),r.id=[r.id[0],r.id[1]+i],r.left=e.utils.getLastId(n),r.origin=r.left,t.delegateYield(this.getOperation(r.id),"t2",15);case 15:n=t.t2,t.next=19;break;case 18:return t.abrupt("break",21);case 19:t.next=7;break;case 21:if(null!=n){t.next=32;break}return a=r.id,t.delegateYield(this.isGarbageCollected(a),"t3",24);case 24:if(s=t.t3){t.next=32;break}return t.delegateYield(e.Struct[r.struct].execute.call(this,r),"t4",27);case 27:return t.delegateYield(this.addOperation(r),"t5",28);case 28:return t.delegateYield(this.store.operationAdded(this,r),"t6",29);case 29:return t.delegateYield(this.getOperation(a),"t7",30);case 30:return r=t.t7,t.delegateYield(this.tryCombineWithLeft(r),"t8",32);case 32:case"end":return t.stop()}},t,this)})},{key:"operationAdded",value:regeneratorRuntime.mark(function t(r,n){var i,a,s,o,u,c,l,d,f,h,p,g,y,b,v,k,m;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:if("Delete"!==n.struct){t.next=8;break}return t.delegateYield(r.getInsertion(n.target),"t0",2);case 2:if(i=t.t0,a=this.initializedTypes[JSON.stringify(i.parent)],null==a){t.next=6;break}return t.delegateYield(a._changed(r,n),"t1",6);case 6:t.next=35;break;case 8:return t.delegateYield(r.updateState(n.id[0]),"t2",9);case 9:for(s=null!=n.content?n.content.length:1,o=0;o<s;o++)if(u=JSON.stringify([n.id[0],n.id[1]+o]),c=this.listenersById[u],delete this.listenersById[u],null!=c)for(l in c)d=c[l],0===--d.missing&&this.whenOperationsExist([],d.op);if(f=this.initializedTypes[JSON.stringify(n.parent)],null==n.parent){t.next=18;break}return t.delegateYield(r.isDeleted(n.parent),"t3",14);case 14:if(h=t.t3,!h){t.next=18;break}return t.delegateYield(r.deleteList(n.id),"t4",17);case 17:return t.abrupt("return");case 18:if(null==f){t.next=21;break}return p=e.utils.copyOperation(n),t.delegateYield(f._changed(r,p),"t5",21);case 21:if(n.deleted){t.next=35;break}g=null!=n.content?n.content.length:1,y=n.id,b=0;case 25:if(!(b<g)){t.next=35;break}return v=[y[0],y[1]+b],t.delegateYield(r.isDeleted(v),"t6",28);case 28:if(k=t.t6,!k){t.next=32;break}return m={struct:"Delete",target:v},t.delegateYield(this.tryExecute.call(r,m),"t7",32);case 32:b++,t.next=25;break;case 35:case"end":return t.stop()}},t,this)})},{key:"whenTransactionsFinished",value:function(){if(this.transactionInProgress){if(null==this.transactionsFinished){var e,t=new Promise(function(t){e=t});return this.transactionsFinished={resolve:e,promise:t},t}return this.transactionsFinished.promise}return Promise.resolve()}},{key:"getNextRequest",value:function(){return 0===this.waitingTransactions.length?this.transactionIsFlushed?(this.transactionInProgress=!1,this.transactionIsFlushed=!1,null!=this.transactionsFinished&&(this.transactionsFinished.resolve(),this.transactionsFinished=null),
null):(this.transactionIsFlushed=!0,regeneratorRuntime.mark(function e(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.flush(),"t0",1);case 1:case"end":return e.stop()}},e,this)})):(this.transactionIsFlushed=!1,this.waitingTransactions.shift())}},{key:"requestTransaction",value:function(e,t){var r=this;this.waitingTransactions.push(e),this.transactionInProgress||(this.transactionInProgress=!0,setTimeout(function(){r.transact(r.getNextRequest())},0))}},{key:"getType",value:function(e){return this.initializedTypes[JSON.stringify(e)]}},{key:"initType",value:regeneratorRuntime.mark(function t(r,n){var i,a,s;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:if(i=JSON.stringify(r),a=this.store.initializedTypes[i],null!=a){t.next=9;break}return t.delegateYield(this.getOperation(r),"t0",4);case 4:if(s=t.t0,null==s){t.next=9;break}return t.delegateYield(e[s.type].typeDefinition.initType.call(this,this.store,s,n),"t1",7);case 7:a=t.t1,this.store.initializedTypes[i]=a;case 9:return t.abrupt("return",a);case 10:case"end":return t.stop()}},t,this)})},{key:"createType",value:function(t,r){var n=t[0].struct;r=r||this.getNextOpId(1);var i=e.Struct[n].create(r);i.type=t[0].name,this.requestTransaction(regeneratorRuntime.mark(function e(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if("_"!==i.id[0]){e.next=4;break}return e.delegateYield(this.setOperation(i),"t0",2);case 2:e.next=5;break;case 4:return e.delegateYield(this.applyCreatedOperations([i]),"t1",5);case 5:case"end":return e.stop()}},e,this)}));var a=e[i.type].typeDefinition.createType(this,i,t[1]);return this.initializedTypes[JSON.stringify(i.id)]=a,a}}]),t}();e.AbstractDatabase=t}},{}],7:[function(e,t,r){"use strict";t.exports=function(e){var t={Delete:{encode:function(e){return e},requiredOps:function(e){return[]},execute:regeneratorRuntime.mark(function e(t){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.deleteOperation(t.target,t.length||1),"t0",1);case 1:return e.abrupt("return",e.t0);case 2:case"end":return e.stop()}},e,this)})},Insert:{encode:function(e){var t={id:e.id,left:e.left,right:e.right,origin:e.origin,parent:e.parent,struct:e.struct};return null!=e.parentSub&&(t.parentSub=e.parentSub),e.hasOwnProperty("opContent")?t.opContent=e.opContent:t.content=e.content.slice(),t},requiredOps:function(t){var r=[];return null!=t.left&&r.push(t.left),null!=t.right&&r.push(t.right),null==t.origin||e.utils.compareIds(t.left,t.origin)||r.push(t.origin),r.push(t.parent),null!=t.opContent&&r.push(t.opContent),r},getDistanceToOrigin:regeneratorRuntime.mark(function t(r){var n,i;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:if(null!=r.left){t.next=4;break}return t.abrupt("return",0);case 4:return n=0,t.delegateYield(this.getInsertion(r.left),"t0",6);case 6:i=t.t0;case 7:if(e.utils.matchesId(i,r.origin)){t.next=17;break}if(n++,null!=i.left){t.next=13;break}return t.abrupt("break",17);case 13:return t.delegateYield(this.getInsertion(i.left),"t1",14);case 14:i=t.t1;case 15:t.next=7;break;case 17:return t.abrupt("return",n);case 18:case"end":return t.stop()}},t,this)}),execute:regeneratorRuntime.mark(function r(n){var i,a,s,o,u,c,l,d,f,h,p,g,y;return regeneratorRuntime.wrap(function(r){for(;;)switch(r.prev=r.next){case 0:if(a=[],null==n.origin){r.next=8;break}return r.delegateYield(this.getInsertionCleanEnd(n.origin),"t0",3);case 3:return s=r.t0,null==s.originOf&&(s.originOf=[]),s.originOf.push(n.id),r.delegateYield(this.setOperation(s),"t1",7);case 7:null!=s.right&&a.push(s.right);case 8:return r.delegateYield(t.Insert.getDistanceToOrigin.call(this,n),"t2",9);case 9:if(o=i=r.t2,null==n.left){r.next=23;break}return r.delegateYield(this.getInsertionCleanEnd(n.left),"t3",12);case 12:if(u=r.t3,e.utils.compareIds(n.left,n.origin)||null==u.right||a.push(u.right),null!=u.right){r.next=18;break}r.t4=null,r.next=20;break;case 18:return r.delegateYield(this.getOperation(u.right),"t5",19);case 19:r.t4=r.t5;case 20:u=r.t4,r.next=34;break;case 23:return r.delegateYield(this.getOperation(n.parent),"t6",24);case 24:if(c=r.t6,d=n.parentSub?c.map[n.parentSub]:c.start,null!=d){r.next=30;break}r.t7=null,r.next=32;break;case 30:return r.delegateYield(this.getOperation(d),"t8",31);case 31:r.t7=r.t8;case 32:l=r.t7,u=l;case 34:if(null==n.right){r.next=37;break}return a.push(n.right),r.delegateYield(this.getInsertionCleanStart(n.right),"t9",37);case 37:if(null==u||e.utils.compareIds(u.id,n.right)){r.next=59;break}return r.delegateYield(t.Insert.getDistanceToOrigin.call(this,u),"t10",40);case 40:if(f=r.t10,f!==i){r.next=45;break}u.id[0]<n.id[0]&&(n.left=e.utils.getLastId(u),o=i+1),r.next=50;break;case 45:if(!(f<i)){r.next=49;break}i-o<=f&&(n.left=e.utils.getLastId(u),o=i+1),r.next=50;break;case 49:return r.abrupt("break",62);case 50:if(i++,null==u.right){r.next=56;break}return r.delegateYield(this.getInsertion(u.right),"t11",53);case 53:u=r.t11,r.next=57;break;case 56:u=null;case 57:r.next=60;break;case 59:return r.abrupt("break",62);case 60:r.next=37;break;case 62:if(h=null,p=null,null!=c){r.next=67;break}return r.delegateYield(this.getOperation(n.parent),"t12",66);case 66:c=r.t12;case 67:if(null==n.left){r.next=75;break}return r.delegateYield(this.getInsertion(n.left),"t13",69);case 69:return h=r.t13,n.right=h.right,h.right=n.id,r.delegateYield(this.setOperation(h),"t14",73);case 73:r.next=76;break;case 75:n.right=n.parentSub?c.map[n.parentSub]||null:c.start;case 76:if(null==n.right){r.next=86;break}return r.delegateYield(this.getOperation(n.right),"t15",78);case 78:if(p=r.t15,p.left=e.utils.getLastId(n),null==p.gc){r.next=85;break}if(!(null!=p.content&&p.content.length>1)){r.next=84;break}return r.delegateYield(this.getInsertionCleanEnd(p.id),"t16",83);case 83:p=r.t16;case 84:this.store.removeFromGarbageCollector(p);case 85:return r.delegateYield(this.setOperation(p),"t17",86);case 86:if(null==n.parentSub){r.next=96;break}if(null!=h){r.next=90;break}return c.map[n.parentSub]=n.id,r.delegateYield(this.setOperation(c),"t18",90);case 90:if(null==n.right){r.next=92;break}return r.delegateYield(this.deleteOperation(n.right,1,!0),"t19",92);case 92:if(null==n.left){r.next=94;break}return r.delegateYield(this.deleteOperation(n.id,1,!0),"t20",94);case 94:r.next=100;break;case 96:if(null!=p&&null!=h){r.next=100;break}return null==p&&(c.end=e.utils.getLastId(n)),null==h&&(c.start=n.id),r.delegateYield(this.setOperation(c),"t21",100);case 100:g=0;case 101:if(!(g<a.length)){r.next=108;break}return r.delegateYield(this.getOperation(a[g]),"t22",103);case 103:return y=r.t22,r.delegateYield(this.tryCombineWithLeft(y),"t23",105);case 105:g++,r.next=101;break;case 108:case"end":return r.stop()}},r,this)})},List:{create:function(e){return{start:null,end:null,struct:"List",id:e}},encode:function(e){var t={struct:"List",id:e.id,type:e.type};return null!=e.requires&&(t.requires=e.requires),null!=e.info&&(t.info=e.info),t},requiredOps:function(){return[]},execute:regeneratorRuntime.mark(function e(t){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:t.start=null,t.end=null;case 2:case"end":return e.stop()}},e,this)}),ref:regeneratorRuntime.mark(function e(t,r){var n,i;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(null!=t.start){e.next=2;break}return e.abrupt("return",null);case 2:return n=null,e.delegateYield(this.getOperation(t.start),"t0",4);case 4:i=e.t0;case 5:if(i.deleted||(n=i,r--),!(r>=0&&null!=i.right)){e.next=12;break}return e.delegateYield(this.getOperation(i.right),"t1",9);case 9:i=e.t1,e.next=13;break;case 12:return e.abrupt("break",15);case 13:e.next=5;break;case 15:return e.abrupt("return",n);case 16:case"end":return e.stop()}},e,this)}),map:regeneratorRuntime.mark(function e(t,r){var n,i;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:t=t.start,n=[];case 2:if(null==t){e.next=9;break}return e.delegateYield(this.getOperation(t),"t0",4);case 4:i=e.t0,i.deleted||n.push(r(i)),t=i.right,e.next=2;break;case 9:return e.abrupt("return",n);case 10:case"end":return e.stop()}},e,this)})},Map:{create:function(e){return{id:e,map:{},struct:"Map"}},encode:function(e){var t={struct:"Map",type:e.type,id:e.id,map:{}};return null!=e.requires&&(t.requires=e.requires),null!=e.info&&(t.info=e.info),t},requiredOps:function(){return[]},execute:regeneratorRuntime.mark(function e(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:case"end":return e.stop()}},e,this)}),get:regeneratorRuntime.mark(function e(t,r){var n,i;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(n=t.map[r],null==n){e.next=14;break}return e.delegateYield(this.getOperation(n),"t0",3);case 3:if(i=e.t0,null!=i&&!i.deleted){e.next=8;break}return e.abrupt("return",void 0);case 8:if(null!=i.opContent){e.next=12;break}return e.abrupt("return",i.content[0]);case 12:return e.delegateYield(this.getType(i.opContent),"t1",13);case 13:return e.abrupt("return",e.t1);case 14:case"end":return e.stop()}},e,this)})}};e.Struct=t}},{}],8:[function(e,t,r){"use strict";function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var i=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}();t.exports=function(e){var t=function(){function t(){n(this,t)}return i(t,[{key:"applyCreatedOperations",value:regeneratorRuntime.mark(function t(r){var n,i,a;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:n=[],i=0;case 2:if(!(i<r.length)){t.next=9;break}return a=r[i],t.delegateYield(this.store.tryExecute.call(this,a),"t0",5);case 5:null!=a.id&&"string"==typeof a.id[1]||n.push(e.Struct[a.struct].encode(a));case 6:i++,t.next=2;break;case 9:!this.store.y.connector.isDisconnected()&&n.length>0&&this.store.y.connector.broadcastOps(n);case 10:case"end":return t.stop()}},t,this)})},{key:"deleteList",value:regeneratorRuntime.mark(function e(t){var r;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(null==t){e.next=15;break}return e.delegateYield(this.getOperation(t),"t0",2);case 2:if(t=e.t0,t.gc){e.next=12;break}return t.gc=!0,t.deleted=!0,e.delegateYield(this.setOperation(t),"t1",7);case 7:return r=null!=t.content?t.content.length:1,e.delegateYield(this.markDeleted(t.id,r),"t2",9);case 9:if(null==t.opContent){e.next=11;break}return e.delegateYield(this.deleteOperation(t.opContent),"t3",11);case 11:this.store.queueGarbageCollector(t.id);case 12:t=t.right,e.next=0;break;case 15:case"end":return e.stop()}},e,this)})},{key:"deleteOperation",value:regeneratorRuntime.mark(function e(t,r,n){var i,a,s,o,u,c,l;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return null==r&&(r=1),e.delegateYield(this.markDeleted(t,r),"t0",2);case 2:if(!(r>0)){e.next=64;break}return i=!1,e.delegateYield(this.os.findWithUpperBound([t[0],t[1]+r-1]),"t1",5);case 5:if(a=e.t1,s=null!=a&&null!=a.content?a.content.length:1,!(null==a||a.id[0]!==t[0]||a.id[1]+s<=t[1])){e.next=12;break}a=null,r=0,e.next=22;break;case 12:if(a.deleted){e.next=21;break}if(!(a.id[1]<t[1])){e.next=17;break}return e.delegateYield(this.getInsertionCleanStart(t),"t2",15);case 15:a=e.t2,s=a.content.length;case 17:if(!(a.id[1]+s>t[1]+r)){e.next=21;break}return e.delegateYield(this.getInsertionCleanEnd([t[0],t[1]+r-1]),"t3",19);case 19:a=e.t3,s=a.content.length;case 21:r=a.id[1]-t[1];case 22:if(null==a){e.next=62;break}if(a.deleted){e.next=44;break}if(i=!0,a.deleted=!0,null==a.start){e.next=28;break}return e.delegateYield(this.deleteList(a.start),"t4",28);case 28:if(null==a.map){e.next=35;break}e.t5=regeneratorRuntime.keys(a.map);case 30:if((e.t6=e.t5()).done){e.next=35;break}return o=e.t6.value,e.delegateYield(this.deleteList(a.map[o]),"t7",33);case 33:e.next=30;break;case 35:if(null==a.opContent){e.next=37;break}return e.delegateYield(this.deleteOperation(a.opContent),"t8",37);case 37:if(null==a.requires){e.next=44;break}u=0;case 39:if(!(u<a.requires.length)){e.next=44;break}return e.delegateYield(this.deleteOperation(a.requires[u]),"t9",41);case 41:u++,e.next=39;break;case 44:if(null==a.left){e.next=49;break}return e.delegateYield(this.getInsertion(a.left),"t10",46);case 46:c=e.t10,e.next=50;break;case 49:c=null;case 50:return e.delegateYield(this.setOperation(a),"t11",51);case 51:if(null==a.right){e.next=56;break}return e.delegateYield(this.getOperation(a.right),"t12",53);case 53:l=e.t12,e.next=57;break;case 56:l=null;case 57:if(!i||n){e.next=59;break}return e.delegateYield(this.store.operationAdded(this,{struct:"Delete",target:a.id,length:s}),"t13",59);case 59:return e.delegateYield(this.store.addToGarbageCollector.call(this,a,c),"t14",60);case 60:if(null==l){e.next=62;break}return e.delegateYield(this.store.addToGarbageCollector.call(this,l,a),"t15",62);case 62:e.next=2;break;case 64:case"end":return e.stop()}},e,this)})},{key:"markGarbageCollected",value:regeneratorRuntime.mark(function t(r,n){var i,a,s,o;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return this.store.addToDebug("yield* this.markGarbageCollected(",r,", ",n,")"),t.delegateYield(this.markDeleted(r,n),"t0",2);case 2:if(i=t.t0,!(i.id[1]<r[1])||i.gc){t.next=9;break}return a=i.len-(r[1]-i.id[1]),i.len-=a,t.delegateYield(this.ds.put(i),"t1",7);case 7:return i={id:r,len:a,gc:!1},t.delegateYield(this.ds.put(i),"t2",9);case 9:return t.delegateYield(this.ds.findPrev(r),"t3",10);case 10:return s=t.t3,t.delegateYield(this.ds.findNext(r),"t4",12);case 12:if(o=t.t4,!(r[1]+n<i.id[1]+i.len)||i.gc){t.next=16;break}return t.delegateYield(this.ds.put({id:[r[0],r[1]+n],len:i.len-n,gc:!1}),"t5",15);case 15:i.len=n;case 16:if(i.gc=!0,null==s||!s.gc||!e.utils.compareIds([s.id[0],s.id[1]+s.len],i.id)){t.next=21;break}return s.len+=i.len,t.delegateYield(this.ds.delete(i.id),"t6",20);case 20:i=s;case 21:if(null==o||!o.gc||!e.utils.compareIds([i.id[0],i.id[1]+i.len],o.id)){t.next=24;break}return i.len+=o.len,t.delegateYield(this.ds.delete(o.id),"t7",24);case 24:return t.delegateYield(this.ds.put(i),"t8",25);case 25:return t.delegateYield(this.updateState(i.id[0]),"t9",26);case 26:case"end":return t.stop()}},t,this)})},{key:"markDeleted",value:regeneratorRuntime.mark(function e(t,r){var n,i,a,s;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return null==r&&(r=1),e.delegateYield(this.ds.findWithUpperBound(t),"t0",2);case 2:if(n=e.t0,null==n||n.id[0]!==t[0]){e.next=27;break}if(!(n.id[1]<=t[1]&&t[1]<=n.id[1]+n.len)){e.next=23;break}if(i=t[1]+r-(n.id[1]+n.len),!(i>0)){e.next=20;break}if(n.gc){e.next=11;break}n.len+=i,e.next=18;break;case 11:if(i=n.id[1]+n.len-t[1],!(i<r)){e.next=17;break}return n={id:[t[0],t[1]+i],len:r-i,gc:!1},e.delegateYield(this.ds.put(n),"t1",15);case 15:e.next=18;break;case 17:throw new Error("Cannot happen! (it dit though.. :()");case 18:e.next=21;break;case 20:return e.abrupt("return",n);case 21:e.next=25;break;case 23:return n={id:t,len:r,gc:!1},e.delegateYield(this.ds.put(n),"t2",25);case 25:e.next=29;break;case 27:return n={id:t,len:r,gc:!1},e.delegateYield(this.ds.put(n),"t3",29);case 29:return e.delegateYield(this.ds.findNext(n.id),"t4",30);case 30:if(a=e.t4,!(null!=a&&n.id[0]===a.id[0]&&n.id[1]+n.len>=a.id[1])){e.next=61;break}i=n.id[1]+n.len-a.id[1];case 33:if(!(i>=0)){e.next=61;break}if(!a.gc){e.next=44;break}if(n.len-=i,!(i>=a.len)){e.next=41;break}if(i-=a.len,!(i>0)){e.next=41;break}return e.delegateYield(this.ds.put(n),"t5",40);case 40:return e.delegateYield(this.markDeleted([a.id[0],a.id[1]+a.len],i),"t6",41);case 41:return e.abrupt("break",61);case 44:if(!(i>a.len)){e.next=56;break}return e.delegateYield(this.ds.findNext(a.id),"t7",46);case 46:return s=e.t7,e.delegateYield(this.ds.delete(a.id),"t8",48);case 48:if(null!=s&&n.id[0]===s.id[0]){e.next=52;break}return e.abrupt("break",61);case 52:a=s,i=n.id[1]+n.len-a.id[1];case 54:e.next=59;break;case 56:return n.len+=a.len-i,e.delegateYield(this.ds.delete(a.id),"t9",58);case 58:return e.abrupt("break",61);case 59:e.next=33;break;case 61:return e.delegateYield(this.ds.put(n),"t10",62);case 62:return e.abrupt("return",n);case 63:case"end":return e.stop()}},e,this)})},{key:"garbageCollectAfterSync",value:regeneratorRuntime.mark(function e(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return(this.store.gc1.length>0||this.store.gc2.length>0)&&console.warn("gc should be empty after sync"),e.delegateYield(this.os.iterate(this,null,null,regeneratorRuntime.mark(function e(t){var r,n,i;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(!t.gc){e.next=3;break}return delete t.gc,e.delegateYield(this.setOperation(t),"t0",3);case 3:if(null==t.parent){e.next=23;break}return e.delegateYield(this.isDeleted(t.parent),"t1",5);case 5:if(r=e.t1,!r){e.next=23;break}if(t.gc=!0,t.deleted){e.next=20;break}return e.delegateYield(this.markDeleted(t.id,null!=t.content?t.content.length:1),"t2",10);case 10:if(t.deleted=!0,null==t.opContent){e.next=13;break}return e.delegateYield(this.deleteOperation(t.opContent),"t3",13);case 13:if(null==t.requires){e.next=20;break}n=0;case 15:if(!(n<t.requires.length)){e.next=20;break}return e.delegateYield(this.deleteOperation(t.requires[n]),"t4",17);case 17:n++,e.next=15;break;case 20:return e.delegateYield(this.setOperation(t),"t5",21);case 21:return this.store.gc1.push(t.id),e.abrupt("return");case 23:if(!t.deleted){e.next=29;break}if(i=null,null==t.left){e.next=28;break}return e.delegateYield(this.getInsertion(t.left),"t6",27);case 27:i=e.t6;case 28:return e.delegateYield(this.store.addToGarbageCollector.call(this,t,i),"t7",29);case 29:case"end":return e.stop()}},e,this)})),"t0",2);case 2:case"end":return e.stop()}},e,this)})},{key:"garbageCollectOperation",value:regeneratorRuntime.mark(function t(r){var n,i,a,s,o,u,c,l,d,f,h,p,g;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return this.store.addToDebug("yield* this.garbageCollectOperation(",r,")"),t.delegateYield(this.getOperation(r),"t0",2);case 2:return n=t.t0,t.delegateYield(this.markGarbageCollected(r,null!=n&&null!=n.content?n.content.length:1),"t1",4);case 4:if(null==n){t.next=74;break}i=[],null!=n.opContent&&i.push(n.opContent),null!=n.requires&&(i=i.concat(n.requires)),a=0;case 9:if(!(a<i.length)){t.next=26;break}return t.delegateYield(this.getOperation(i[a]),"t2",11);case 11:if(s=t.t2,null==s){t.next=22;break}if(s.deleted){t.next=17;break}return t.delegateYield(this.deleteOperation(s.id),"t3",15);case 15:return t.delegateYield(this.getOperation(s.id),"t4",16);case 16:s=t.t4;case 17:return s.gc=!0,t.delegateYield(this.setOperation(s),"t5",19);case 19:this.store.queueGarbageCollector(s.id),t.next=23;break;case 22:return t.delegateYield(this.markGarbageCollected(i[a],1),"t6",23);case 23:a++,t.next=9;break;case 26:if(null==n.left){t.next=31;break}return t.delegateYield(this.getInsertion(n.left),"t7",28);case 28:return o=t.t7,o.right=n.right,t.delegateYield(this.setOperation(o),"t8",31);case 31:if(null==n.right){t.next=60;break}return t.delegateYield(this.getOperation(n.right),"t9",33);case 33:return u=t.t9,u.left=n.left,t.delegateYield(this.setOperation(u),"t10",36);case 36:if(!(null!=n.originOf&&n.originOf.length>0)){t.next=60;break}c=n.left,l=null;case 39:if(null==c){t.next=47;break}return t.delegateYield(this.getInsertion(c),"t11",41);case 41:if(l=t.t11,!l.deleted){t.next=44;break}return t.abrupt("break",47);case 44:c=l.left,t.next=39;break;case 47:t.t12=regeneratorRuntime.keys(n.originOf);case 48:if((t.t13=t.t12()).done){t.next=57;break}return d=t.t13.value,t.delegateYield(this.getOperation(n.originOf[d]),"t14",51);case 51:if(f=t.t14,null==f){t.next=55;break}return f.origin=c,t.delegateYield(this.setOperation(f),"t15",55);case 55:t.next=48;break;case 57:if(null==c){t.next=60;break}return null==l.originOf?l.originOf=n.originOf:l.originOf=n.originOf.concat(l.originOf),t.delegateYield(this.setOperation(l),"t16",60);case 60:if(null==n.origin){t.next=65;break}return t.delegateYield(this.getInsertion(n.origin),"t17",62);case 62:return h=t.t17,h.originOf=h.originOf.filter(function(t){return!e.utils.compareIds(r,t)}),t.delegateYield(this.setOperation(h),"t18",65);case 65:if(null==n.parent){t.next=68;break}return t.delegateYield(this.getOperation(n.parent),"t19",67);case 67:p=t.t19;case 68:if(null==p){t.next=73;break}if(g=!1,null!=n.parentSub?e.utils.compareIds(p.map[n.parentSub],n.id)&&(g=!0,null!=n.right?p.map[n.parentSub]=n.right:delete p.map[n.parentSub]):(e.utils.compareIds(p.start,n.id)&&(g=!0,p.start=n.right),e.utils.matchesId(n,p.end)&&(g=!0,p.end=n.left)),!g){t.next=73;break}return t.delegateYield(this.setOperation(p),"t20",73);case 73:return t.delegateYield(this.removeOperation(n.id),"t21",74);case 74:case"end":return t.stop()}},t,this)})},{key:"checkDeleteStoreForState",value:regeneratorRuntime.mark(function e(t){var r;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.ds.findWithUpperBound([t.user,t.clock]),"t0",1);case 1:r=e.t0,null!=r&&r.id[0]===t.user&&r.gc&&(t.clock=Math.max(t.clock,r.id[1]+r.len));case 3:case"end":return e.stop()}},e,this)})},{key:"updateState",value:regeneratorRuntime.mark(function e(t){var r,n,i;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.getState(t),"t0",1);case 1:return r=e.t0,e.delegateYield(this.checkDeleteStoreForState(r),"t1",3);case 3:return e.delegateYield(this.getInsertion([t,r.clock]),"t2",4);case 4:n=e.t2,i=null!=n&&null!=n.content?n.content.length:1;case 6:if(!(null!=n&&t===n.id[0]&&n.id[1]<=r.clock&&n.id[1]+i>r.clock)){e.next=14;break}return r.clock+=i,e.delegateYield(this.checkDeleteStoreForState(r),"t3",9);case 9:return e.delegateYield(this.os.findNext(n.id),"t4",10);case 10:n=e.t4,i=null!=n&&null!=n.content?n.content.length:1,e.next=6;break;case 14:return e.delegateYield(this.setState(r),"t5",15);case 15:case"end":return e.stop()}},e,this)})},{key:"applyDeleteSet",value:regeneratorRuntime.mark(function e(t){var r,n,i,a,s,o,u,c,l,d,f;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:r=[],e.t0=regeneratorRuntime.keys(t);case 2:if((e.t1=e.t0()).done){e.next=11;break}return n=e.t1.value,i=t[n],a=0,s=i[a],e.delegateYield(this.ds.iterate(this,[n,0],[n,Number.MAX_VALUE],regeneratorRuntime.mark(function e(t){var o;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(null==s){e.next=10;break}if(o=0,!(t.id[1]+t.len<=s[0])){e.next=6;break}return e.abrupt("break",10);case 6:s[0]<t.id[1]?(o=Math.min(t.id[1]-s[0],s[1]),r.push([n,s[0],o,s[2]])):(o=t.id[1]+t.len-s[0],s[2]&&!t.gc&&r.push([n,s[0],Math.min(o,s[1]),s[2]]));case 7:s[1]<=o?s=i[++a]:(s[0]=s[0]+o,s[1]=s[1]-o),e.next=0;break;case 10:case"end":return e.stop()}},e,this)})),"t2",8);case 8:for(;a<i.length;a++)s=i[a],r.push([n,s[0],s[1],s[2]]);e.next=2;break;case 11:o=0;case 12:if(!(o<r.length)){e.next=40;break}return u=r[o],e.delegateYield(this.deleteOperation([u[0],u[1]],u[2]),"t3",15);case 15:if(!u[3]){e.next=36;break}return e.delegateYield(this.markGarbageCollected([u[0],u[1]],u[2]),"t4",17);case 17:c=u[1]+u[2];case 18:if(!(c>=u[1])){e.next=36;break}return e.delegateYield(this.os.findWithUpperBound([u[0],c-1]),"t5",20);case 20:if(l=e.t5,null!=l){e.next=23;break}return e.abrupt("break",36);case 23:if(d=null!=l.content?l.content.length:1,!(l.id[0]!==u[0]||l.id[1]+d<=u[1])){e.next=26;break}return e.abrupt("break",36);case 26:if(!(l.id[1]+d>u[1]+u[2])){e.next=29;break}return e.delegateYield(this.getInsertionCleanEnd([u[0],u[1]+u[2]-1]),"t6",28);case 28:l=e.t6;case 29:if(!(l.id[1]<u[1])){e.next=32;break}return e.delegateYield(this.getInsertionCleanStart([u[0],u[1]]),"t7",31);case 31:l=e.t7;case 32:return c=l.id[1],e.delegateYield(this.garbageCollectOperation(l.id),"t8",34);case 34:e.next=18;break;case 36:this.store.forwardAppliedOperations&&(f=[],f.push({struct:"Delete",target:[u[0],u[1]],length:u[2]}),this.store.y.connector.broadcastOps(f));case 37:o++,e.next=12;break;case 40:case"end":return e.stop()}},e,this)})},{key:"isGarbageCollected",value:regeneratorRuntime.mark(function e(t){var r;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.ds.findWithUpperBound(t),"t0",1);case 1:return r=e.t0,e.abrupt("return",null!=r&&r.id[0]===t[0]&&t[1]<r.id[1]+r.len&&r.gc);case 3:case"end":return e.stop()}},e,this)})},{key:"getDeleteSet",value:regeneratorRuntime.mark(function e(){var t;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return t={},e.delegateYield(this.ds.iterate(this,null,null,regeneratorRuntime.mark(function e(r){var n,i,a,s,o;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:n=r.id[0],i=r.id[1],a=r.len,s=r.gc,o=t[n],void 0===o&&(o=[],t[n]=o),o.push([i,a,s]);case 7:case"end":return e.stop()}},e,this)})),"t0",2);case 2:return e.abrupt("return",t);case 3:case"end":return e.stop()}},e,this)})},{key:"isDeleted",value:regeneratorRuntime.mark(function e(t){var r;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.ds.findWithUpperBound(t),"t0",1);case 1:return r=e.t0,e.abrupt("return",null!=r&&r.id[0]===t[0]&&t[1]<r.id[1]+r.len);case 3:case"end":return e.stop()}},e,this)})},{key:"setOperation",value:regeneratorRuntime.mark(function e(t){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.os.put(t),"t0",1);case 1:return e.abrupt("return",t);case 2:case"end":return e.stop()}},e,this)})},{key:"addOperation",value:regeneratorRuntime.mark(function e(t){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.os.put(t),"t0",1);case 1:!this.store.y.connector.isDisconnected()&&this.store.forwardAppliedOperations&&"string"!=typeof t.id[1]&&this.store.y.connector.broadcastOps([t]);case 2:case"end":return e.stop()}},e,this)})},{key:"tryCombineWithLeft",value:regeneratorRuntime.mark(function t(r){var n;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:if(null==r||null==r.left||null==r.content||r.left[0]!==r.id[0]||!e.utils.compareIds(r.left,r.origin)){t.next=9;break}return t.delegateYield(this.getInsertion(r.left),"t0",2);case 2:if(n=t.t0,null==n.content||n.id[1]+n.content.length!==r.id[1]||1!==n.originOf.length||n.gc||n.deleted||r.gc||r.deleted){t.next=9;break}return null!=r.originOf?n.originOf=r.originOf:delete n.originOf,n.content=n.content.concat(r.content),n.right=r.right,t.delegateYield(this.os.delete(r.id),"t1",8);case 8:return t.delegateYield(this.setOperation(n),"t2",9);case 9:case"end":return t.stop()}},t,this)})},{key:"getInsertion",value:regeneratorRuntime.mark(function e(t){var r,n;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.os.findWithUpperBound(t),"t0",1);case 1:if(r=e.t0,null!=r){e.next=6;break}return e.abrupt("return",null);case 6:if(n=null!=r.content?r.content.length:1,!(t[0]===r.id[0]&&t[1]<r.id[1]+n)){e.next=11;break}return e.abrupt("return",r);case 11:return e.abrupt("return",null);case 12:case"end":return e.stop()}},e,this)})},{key:"getInsertionCleanStartEnd",value:regeneratorRuntime.mark(function e(t){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.getInsertionCleanStart(t),"t0",1);case 1:return e.delegateYield(this.getInsertionCleanEnd(t),"t1",2);case 2:return e.abrupt("return",e.t1);case 3:case"end":return e.stop()}},e,this)})},{key:"getInsertionCleanStart",value:regeneratorRuntime.mark(function t(r){var n,i,a;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.delegateYield(this.getInsertion(r),"t0",1);case 1:if(n=t.t0,null==n){t.next=21;break}if(n.id[1]!==r[1]){t.next=7;break}return t.abrupt("return",n);case 7:return i=e.utils.copyObject(n),n.content=i.content.splice(r[1]-n.id[1]),n.id=r,a=e.utils.getLastId(i),n.origin=a,i.originOf=[n.id],i.right=n.id,n.left=a,t.delegateYield(this.setOperation(i),"t1",16);case 16:return t.delegateYield(this.setOperation(n),"t2",17);case 17:return i.gc&&this.store.queueGarbageCollector(n.id),t.abrupt("return",n);case 19:t.next=22;break;case 21:return t.abrupt("return",null);case 22:case"end":return t.stop()}},t,this)})},{key:"getInsertionCleanEnd",value:regeneratorRuntime.mark(function t(r){var n,i,a;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.delegateYield(this.getInsertion(r),"t0",1);case 1:if(n=t.t0,null==n){t.next=21;break}if(null!=n.content&&n.id[1]+n.content.length-1!==r[1]){t.next=7;break}return t.abrupt("return",n);case 7:return i=e.utils.copyObject(n),i.content=n.content.splice(r[1]-n.id[1]+1),i.id=[r[0],r[1]+1],a=e.utils.getLastId(n),i.origin=a,n.originOf=[i.id],n.right=i.id,i.left=a,t.delegateYield(this.setOperation(i),"t1",16);case 16:return t.delegateYield(this.setOperation(n),"t2",17);case 17:return n.gc&&this.store.queueGarbageCollector(i.id),t.abrupt("return",n);case 19:t.next=22;break;case 21:return t.abrupt("return",null);case 22:case"end":return t.stop()}},t,this)})},{key:"getOperation",value:regeneratorRuntime.mark(function t(r){var n,i,a,s;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.delegateYield(this.os.find(r),"t0",1);case 1:if(n=t.t0,"_"===r[0]&&null==n){t.next=6;break}return t.abrupt("return",n);case 6:if(i=r[1].split("_"),!(i.length>1)){t.next=15;break}return a=i[0],s=e.Struct[a].create(r),s.type=i[1],t.delegateYield(this.setOperation(s),"t1",12);case 12:return t.abrupt("return",s);case 15:return console.error("Unexpected case. How can this happen?"),t.abrupt("return",null);case 18:case"end":return t.stop()}},t,this)})},{key:"removeOperation",value:regeneratorRuntime.mark(function e(t){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.os.delete(t),"t0",1);case 1:case"end":return e.stop()}},e,this)})},{key:"setState",value:regeneratorRuntime.mark(function e(t){var r;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return r={id:[t.user],clock:t.clock},e.delegateYield(this.ss.put(r),"t0",2);case 2:case"end":return e.stop()}},e,this)})},{key:"getState",value:regeneratorRuntime.mark(function e(t){var r,n;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.ss.find([t]),"t0",1);case 1:return r=e.t0,n=null==r?null:r.clock,null==n&&(n=0),e.abrupt("return",{user:t,clock:n});case 5:case"end":return e.stop()}},e,this)})},{key:"getStateVector",value:regeneratorRuntime.mark(function e(){var t;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return t=[],e.delegateYield(this.ss.iterate(this,null,null,regeneratorRuntime.mark(function e(r){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:t.push({user:r.id[0],clock:r.clock});case 1:case"end":return e.stop()}},e,this)})),"t0",2);case 2:return e.abrupt("return",t);case 3:case"end":return e.stop()}},e,this)})},{key:"getStateSet",value:regeneratorRuntime.mark(function e(){var t;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return t={},e.delegateYield(this.ss.iterate(this,null,null,regeneratorRuntime.mark(function e(r){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:t[r.id[0]]=r.clock;case 1:case"end":return e.stop()}},e,this)})),"t0",2);case 2:return e.abrupt("return",t);case 3:case"end":return e.stop()}},e,this)})},{key:"getOperations",value:regeneratorRuntime.mark(function t(r){
var n,i,a,s,o,u,c,l,d,f,h;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return null==r&&(r={}),n=[],t.delegateYield(this.getStateVector(),"t0",3);case 3:i=t.t0,a=!0,s=!1,o=void 0,t.prev=7,u=i[Symbol.iterator]();case 9:if(a=(c=u.next()).done){t.next=23;break}if(l=c.value,d=l.user,"_"!==d){t.next=14;break}return t.abrupt("continue",20);case 14:if(f=r[d]||0,!(f>0)){t.next=19;break}return t.delegateYield(this.getInsertion([d,f]),"t1",17);case 17:h=t.t1,null!=h&&(f=h.id[1],r[d]=f);case 19:return t.delegateYield(this.os.iterate(this,[d,f],[d,Number.MAX_VALUE],regeneratorRuntime.mark(function t(i){var a,s,o,u;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:if(i=e.Struct[i.struct].encode(i),"Insert"===i.struct){t.next=5;break}n.push(i),t.next=27;break;case 5:if(!(null==i.right||i.right[1]<(r[i.right[0]]||0))){t.next=27;break}a=i,s=[i],o=i.right;case 9:if(null!=a.left){t.next=15;break}return i.left=null,n.push(i),e.utils.compareIds(a.id,i.id)||(a=e.Struct[i.struct].encode(a),a.right=s[s.length-1].id,n.push(a)),t.abrupt("break",27);case 15:return t.delegateYield(this.getInsertion(a.left),"t0",16);case 16:for(a=t.t0;s.length>0&&e.utils.matchesId(a,s[s.length-1].origin);)s.pop();if(!(a.id[1]<(r[a.id[0]]||0))){t.next=24;break}return i.left=e.utils.getLastId(a),n.push(i),t.abrupt("break",27);case 24:e.utils.matchesId(a,i.origin)?(i.left=i.origin,n.push(i),i=e.Struct[i.struct].encode(a),i.right=o,s.length>0&&console.log("This should not happen .. :( please report this"),s=[i]):(u=e.Struct[i.struct].encode(a),u.right=s[s.length-1].id,u.left=u.origin,n.push(u),s.push(a));case 25:t.next=9;break;case 27:case"end":return t.stop()}},t,this)})),"t2",20);case 20:a=!0,t.next=9;break;case 23:t.next=29;break;case 25:t.prev=25,t.t3=t.catch(7),s=!0,o=t.t3;case 29:t.prev=29,t.prev=30,!a&&u.return&&u.return();case 32:if(t.prev=32,!s){t.next=35;break}throw o;case 35:return t.finish(32);case 36:return t.finish(29);case 37:return t.abrupt("return",n.reverse());case 38:case"end":return t.stop()}},t,this,[[7,25,29,37],[30,,32,36]])})},{key:"flush",value:regeneratorRuntime.mark(function e(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.os.flush(),"t0",1);case 1:return e.delegateYield(this.ss.flush(),"t1",2);case 2:return e.delegateYield(this.ds.flush(),"t2",3);case 3:case"end":return e.stop()}},e,this)})}]),t}();e.Transaction=t}},{}],9:[function(e,t,r){"use strict";function n(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function i(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}function a(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var s="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol?"symbol":typeof e},o=function e(t,r,n){null===t&&(t=Function.prototype);var i=Object.getOwnPropertyDescriptor(t,r);if(void 0===i){var a=Object.getPrototypeOf(t);return null===a?void 0:e(a,r,n)}if("value"in i)return i.value;var s=i.get;if(void 0!==s)return s.call(n)},u=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}();t.exports=function(e){function t(e){var t={};for(var r in e)t[r]=e[r];return t}function r(e){return e=t(e),null!=e.content&&(e.content=e.content.map(function(e){return e})),e}function c(e,t){return e[0]<t[0]||e[0]===t[0]&&(e[1]<t[1]||s(e[1])<s(t[1]))}function l(e,t){return e.target[0]===t[0]&&e.target[1]<=t[1]&&t[1]<e.target[1]+(e.length||1)}function d(e,t){return null==e||null==t?e===t:e[0]===t[0]&&e[1]===t[1]}function f(e,t){return null==t||null==e?t===e:t[0]===e.id[0]?null==e.content?t[1]===e.id[1]:t[1]>=e.id[1]&&t[1]<e.id[1]+e.content.length:void 0}function h(e){return null==e.content||1===e.content.length?e.id:[e.id[0],e.id[1]+e.content.length-1]}function p(e){for(var t=new Array(e),r=0;r<t.length;r++)t[r]={id:[null,null]};return t}function g(e){var t=function(e){function t(e,r){a(this,t);var i=n(this,Object.getPrototypeOf(t).call(this,e,r));return i.writeBuffer=p(5),i.readBuffer=p(10),i}return i(t,e),u(t,[{key:"find",value:regeneratorRuntime.mark(function e(r,n){var i,a,s;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:i=this.readBuffer.length-1;case 1:if(!(i>=0)){e.next=10;break}if(a=this.readBuffer[i],a.id[1]!==r[1]||a.id[0]!==r[0]){e.next=7;break}for(;i<this.readBuffer.length-1;i++)this.readBuffer[i]=this.readBuffer[i+1];return this.readBuffer[this.readBuffer.length-1]=a,e.abrupt("return",a);case 7:i--,e.next=1;break;case 10:i=this.writeBuffer.length-1;case 11:if(!(i>=0)){e.next=19;break}if(a=this.writeBuffer[i],a.id[1]!==r[1]||a.id[0]!==r[0]){e.next=16;break}return s=a,e.abrupt("break",19);case 16:i--,e.next=11;break;case 19:if(!(i<0&&void 0===n)){e.next=22;break}return e.delegateYield(o(Object.getPrototypeOf(t.prototype),"find",this).call(this,r),"t0",21);case 21:s=e.t0;case 22:if(null!=s){for(i=0;i<this.readBuffer.length-1;i++)this.readBuffer[i]=this.readBuffer[i+1];this.readBuffer[this.readBuffer.length-1]=s}return e.abrupt("return",s);case 24:case"end":return e.stop()}},e,this)})},{key:"put",value:regeneratorRuntime.mark(function e(r){var n,i,a,s;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:n=r.id,i=this.writeBuffer.length-1;case 2:if(!(i>=0)){e.next=11;break}if(a=this.writeBuffer[i],a.id[1]!==n[1]||a.id[0]!==n[0]){e.next=8;break}for(;i<this.writeBuffer.length-1;i++)this.writeBuffer[i]=this.writeBuffer[i+1];return this.writeBuffer[this.writeBuffer.length-1]=r,e.abrupt("break",11);case 8:i--,e.next=2;break;case 11:if(!(i<0)){e.next=17;break}if(s=this.writeBuffer[0],null===s.id[0]){e.next=15;break}return e.delegateYield(o(Object.getPrototypeOf(t.prototype),"put",this).call(this,s),"t0",15);case 15:for(i=0;i<this.writeBuffer.length-1;i++)this.writeBuffer[i]=this.writeBuffer[i+1];this.writeBuffer[this.writeBuffer.length-1]=r;case 17:for(i=0;i<this.readBuffer.length-1;i++)a=this.readBuffer[i+1],a.id[1]===n[1]&&a.id[0]===n[0]?this.readBuffer[i]=r:this.readBuffer[i]=a;this.readBuffer[this.readBuffer.length-1]=r;case 19:case"end":return e.stop()}},e,this)})},{key:"delete",value:regeneratorRuntime.mark(function e(r){var n,i;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:for(n=0;n<this.readBuffer.length;n++)i=this.readBuffer[n],i.id[1]===r[1]&&i.id[0]===r[0]&&(this.readBuffer[n]={id:[null,null]});return e.delegateYield(this.flush(),"t0",2);case 2:return e.delegateYield(o(Object.getPrototypeOf(t.prototype),"delete",this).call(this,r),"t1",3);case 3:case"end":return e.stop()}},e,this)})},{key:"findWithLowerBound",value:regeneratorRuntime.mark(function e(r){var n,i=arguments;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.find(r,!0),"t0",1);case 1:if(n=e.t0,null==n){e.next=6;break}return e.abrupt("return",n);case 6:return e.delegateYield(this.flush(),"t1",7);case 7:return e.delegateYield(o(Object.getPrototypeOf(t.prototype),"findWithLowerBound",this).apply(this,i),"t2",8);case 8:return e.abrupt("return",e.t2);case 9:case"end":return e.stop()}},e,this)})},{key:"findWithUpperBound",value:regeneratorRuntime.mark(function e(r){var n,i=arguments;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.find(r,!0),"t0",1);case 1:if(n=e.t0,null==n){e.next=6;break}return e.abrupt("return",n);case 6:return e.delegateYield(this.flush(),"t1",7);case 7:return e.delegateYield(o(Object.getPrototypeOf(t.prototype),"findWithUpperBound",this).apply(this,i),"t2",8);case 8:return e.abrupt("return",e.t2);case 9:case"end":return e.stop()}},e,this)})},{key:"findNext",value:regeneratorRuntime.mark(function e(){var r=arguments;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.flush(),"t0",1);case 1:return e.delegateYield(o(Object.getPrototypeOf(t.prototype),"findNext",this).apply(this,r),"t1",2);case 2:return e.abrupt("return",e.t1);case 3:case"end":return e.stop()}},e,this)})},{key:"findPrev",value:regeneratorRuntime.mark(function e(){var r=arguments;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.flush(),"t0",1);case 1:return e.delegateYield(o(Object.getPrototypeOf(t.prototype),"findPrev",this).apply(this,r),"t1",2);case 2:return e.abrupt("return",e.t1);case 3:case"end":return e.stop()}},e,this)})},{key:"iterate",value:regeneratorRuntime.mark(function e(){var r=arguments;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.delegateYield(this.flush(),"t0",1);case 1:return e.delegateYield(o(Object.getPrototypeOf(t.prototype),"iterate",this).apply(this,r),"t1",2);case 2:case"end":return e.stop()}},e,this)})},{key:"flush",value:regeneratorRuntime.mark(function e(){var r,n;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:r=0;case 1:if(!(r<this.writeBuffer.length)){e.next=9;break}if(n=this.writeBuffer[r],null===n.id[0]){e.next=6;break}return e.delegateYield(o(Object.getPrototypeOf(t.prototype),"put",this).call(this,n),"t0",5);case 5:this.writeBuffer[r]={id:[null,null]};case 6:r++,e.next=1;break;case 9:case"end":return e.stop()}},e,this)})}]),t}(e);return t}e.utils={};var y=function(){function e(){a(this,e),this.eventListeners=[]}return u(e,[{key:"destroy",value:function(){this.eventListeners=null}},{key:"addEventListener",value:function(e){this.eventListeners.push(e)}},{key:"removeEventListener",value:function(e){this.eventListeners=this.eventListeners.filter(function(t){return e!==t})}},{key:"removeAllEventListeners",value:function(){this.eventListeners=[]}},{key:"callEventListeners",value:function(e){for(var t=0;t<this.eventListeners.length;t++)try{this.eventListeners[t](e)}catch(e){console.error("User events must not throw Errors!")}}}]),e}();e.utils.EventListenerHandler=y;var b=function(t){function r(e){a(this,r);var t=n(this,Object.getPrototypeOf(r).call(this));return t.waiting=[],t.awaiting=0,t.onevent=e,t}return i(r,t),u(r,[{key:"destroy",value:function(){o(Object.getPrototypeOf(r.prototype),"destroy",this).call(this),this.waiting=null,this.awaiting=null,this.onevent=null}},{key:"receivedOp",value:function(e){if(this.awaiting<=0)this.onevent(e);else if("Delete"===e.struct){var t=this,r=function e(r){if(null==r.length)throw new Error("This shouldn't happen! d.length must be defined!");for(var n=0;n<t.waiting.length;n++){var i=t.waiting[n];if("Insert"===i.struct&&i.id[0]===r.target[0]){var a=i.hasOwnProperty("content")?i.content.length:1,s=r.target[1],o=r.target[1]+(r.length||1),u=i.id[1],c=i.id[1]+a;if(c<=s||o<=u)continue;if(u<s){if(s<c){if(c<o){i.content.splice(s-u),r.length=o-c,r.target=[r.target[0],c];continue}if(c===o)return void i.content.splice(s-u);var l={id:[i.id[0],o],content:i.content.slice(o-u),struct:"Insert"};return t.waiting.push(l),void i.content.splice(s-u)}}else{if(s===u){if(c<o){r.length=o-c,r.target=[r.target[0],c],i.content=[];continue}return c===o?void t.waiting.splice(n,1):(i.content=i.content.slice(o-u),void(i.id=[i.id[0],o]))}if(u<o){if(c<o)return t.waiting.splice(n,1),e({target:[r.target[0],s],length:u-s,struct:"Delete"}),void e({target:[r.target[0],c],length:c-o,struct:"Delete"});if(c===o){t.waiting.splice(n,1),n--,r.length-=a;continue}r.length=u-s,i.content.splice(0,o-u),i.id=[i.id[0],o];continue}}}}t.waiting.push(r)};null==e.key?r(e):this.waiting.push(e)}else this.waiting.push(e)}},{key:"awaitAndPrematurelyCall",value:function(t){this.awaiting++,t.map(e.utils.copyOperation).forEach(this.onevent)}},{key:"awaitOps",value:regeneratorRuntime.mark(function t(r,n,i){var a,s,o,u,c,l,d,f,h;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return a=function(t){for(var r=[];t.length>0;)for(var n=0;n<t.length;n++){for(var i=!0,a=0;a<t.length;a++)if(e.utils.matchesId(t[a],t[n].left)){i=!1;break}i&&(r.push(t.splice(n,1)[0]),n--)}return r},s=this.waiting.length,t.delegateYield(n.apply(r,i),"t0",3);case 3:if(this.waiting.splice(s),this.awaiting>0&&this.awaiting--,!(0===this.awaiting&&this.waiting.length>0)){t.next=70;break}o=0;case 7:if(!(o<this.waiting.length)){t.next=41;break}if(u=this.waiting[o],"Insert"!==u.struct){t.next=38;break}return t.delegateYield(r.getInsertion(u.id),"t1",11);case 11:if(c=t.t1,null==c.parentSub||null==c.left){t.next=17;break}this.waiting.splice(o,1),o--,t.next=38;break;case 17:if(e.utils.compareIds(c.id,u.id)){t.next=21;break}u.left=[u.id[0],u.id[1]-1],t.next=38;break;case 21:if(null!=c.left){t.next=25;break}u.left=null,t.next=38;break;case 25:return t.delegateYield(r.getInsertion(c.left),"t2",26);case 26:l=t.t2;case 27:if(null==l.deleted){t.next=37;break}if(null==l.left){t.next=33;break}return t.delegateYield(r.getInsertion(l.left),"t3",30);case 30:l=t.t3,t.next=35;break;case 33:return l=null,t.abrupt("break",37);case 35:t.next=27;break;case 37:u.left=null!=l?e.utils.getLastId(l):null;case 38:o++,t.next=7;break;case 41:if(null!=this._pullChanges&&this._pullChanges(),0!==this.awaiting){t.next=70;break}d=[],f=[],this.waiting.forEach(function(e){"Delete"===e.struct?f.push(e):d.push(e)}),this.waiting=[],d=a(d),h=0;case 49:if(!(h<d.length)){t.next=59;break}if(0!==this.awaiting){t.next=54;break}this.onevent(d[h]),t.next=56;break;case 54:return this.waiting=this.waiting.concat(d.slice(h)),t.abrupt("break",59);case 56:h++,t.next=49;break;case 59:h=0;case 60:if(!(h<f.length)){t.next=70;break}if(0!==this.awaiting){t.next=65;break}this.onevent(f[h]),t.next=67;break;case 65:return this.waiting=this.waiting.concat(f.slice(h)),t.abrupt("break",70);case 67:h++,t.next=60;break;case 70:case"end":return t.stop()}},t,this)})},{key:"awaitedInserts",value:function(t){for(var r=this.waiting.splice(this.waiting.length-t),n=0;n<r.length;n++){var i=r[n];if("Insert"!==i.struct)throw new Error("Expected Insert Operation!");for(var a=this.waiting.length-1;a>=0;a--){var s=this.waiting[a];"Insert"===s.struct&&(e.utils.matchesId(s,i.left)?(s.right=i.id,i.left=s.left):e.utils.compareIds(s.id,i.right)&&(s.left=e.utils.getLastId(i),i.right=s.right))}}this._tryCallEvents(t)}},{key:"awaitedDeletes",value:function(t,r){for(var n=this.waiting.splice(this.waiting.length-t),i=0;i<n.length;i++){var a=n[i];if("Delete"!==a.struct)throw new Error("Expected Delete Operation!");if(null!=r)for(var s=0;s<this.waiting.length;s++){var o=this.waiting[s];"Insert"===o.struct&&e.utils.compareIds(a.target,o.left)&&(o.left=r)}}this._tryCallEvents(t)}},{key:"_tryCallEvents",value:function(){function t(t){for(var r=[];t.length>0;)for(var n=0;n<t.length;n++){for(var i=!0,a=0;a<t.length;a++)if(e.utils.matchesId(t[a],t[n].left)){i=!1;break}i&&(r.push(t.splice(n,1)[0]),n--)}return r}if(this.awaiting>0&&this.awaiting--,0===this.awaiting&&this.waiting.length>0){var r=[],n=[];this.waiting.forEach(function(e){"Delete"===e.struct?n.push(e):r.push(e)}),r=t(r),r.forEach(this.onevent),n.forEach(this.onevent),this.waiting=[]}}}]),r}(y);e.utils.EventHandler=b;var v=function e(){a(this,e)};e.utils.CustomType=v;var k=function e(t){if(a(this,e),null==t.struct||null==t.initType||null==t.class||null==t.name||null==t.createType)throw new Error("Custom type was not initialized correctly!");this.struct=t.struct,this.initType=t.initType,this.createType=t.createType,this.class=t.class,this.name=t.name,null!=t.appendAdditionalInfo&&(this.appendAdditionalInfo=t.appendAdditionalInfo),this.parseArguments=(t.parseArguments||function(){return[this]}).bind(this),this.parseArguments.typeDefinition=this};e.utils.CustomTypeDefinition=k,e.utils.isTypeDefinition=function(t){if(null!=t){if(t instanceof e.utils.CustomTypeDefinition)return[t];if(t.constructor===Array&&t[0]instanceof e.utils.CustomTypeDefinition)return t;if(t instanceof Function&&t.typeDefinition instanceof e.utils.CustomTypeDefinition)return[t.typeDefinition]}return!1},e.utils.copyObject=t,e.utils.copyOperation=r,e.utils.smaller=c,e.utils.inDeletionRange=l,e.utils.compareIds=d,e.utils.matchesId=f,e.utils.getLastId=h,e.utils.createSmallLookupBuffer=g}},{}],10:[function(e,t,r){"use strict";function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(t){for(var r=a.sourceDir||"/bower_components",n="undefined"!=typeof regeneratorRuntime?".js":".es6",i=[],s=0;s<t.length;s++){var u=t[s].split("(")[0],c="y-"+u.toLowerCase();if(null==a[u])if(null==o[u])if("undefined"!=typeof window&&"undefined"!==window.Y){var l;!function(){l=document.createElement("script"),l.src=r+"/"+c+"/"+c+n,document.head.appendChild(l);var e={};o[u]=e,e.promise=new Promise(function(t){e.resolve=t}),i.push(e.promise)}()}else console.info("YJS: Please do not depend on automatic requiring of modules anymore! Extend modules as follows `require('y-modulename')(Y)`"),e(c)(a);else i.push(o[t[s]].promise)}return Promise.all(i)}function a(e){null!=e.sourceDir&&(a.sourceDir=e.sourceDir),e.types=null!=e.types?e.types:[];var t=[e.db.name,e.connector.name].concat(e.types);for(var r in e.share)t.push(e.share[r]);return new Promise(function(r,n){setTimeout(function(){a.requestModules(t).then(function(){if(null==e)n("An options object is expected! ");else if(null==e.connector)n("You must specify a connector! (missing connector property)");else if(null==e.connector.name)n("You must specify connector name! (missing connector.name property)");else if(null==e.db)n("You must specify a database! (missing db property)");else if(null==e.connector.name)n("You must specify db name! (missing db.name property)");else if(null==e.share)n("You must specify a set of shared types!");else{var t=new u(e);t.db.whenUserIdSet(function(){t.init(function(){r(t)})})}}).catch(n)},0)})}var s=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}();e("./Connector.js")(a),e("./Database.js")(a),e("./Transaction.js")(a),e("./Struct.js")(a),e("./Utils.js")(a),e("./Connectors/Test.js")(a);var o={};t.exports=a,a.requiringModules=o,a.extend=function(e,t){if(2===arguments.length&&"string"==typeof e)t instanceof a.utils.CustomTypeDefinition?a[e]=t.parseArguments:a[e]=t,null!=o[e]&&(o[e].resolve(),delete o[e]);else for(var r=0;r<arguments.length;r++){var n=arguments[r];if("function"!=typeof n)throw new Error("Expected function!");n(a)}},a.requestModules=i;var u=function(){function e(t,r){n(this,e),this.options=t,this.db=new a[t.db.name](this,t.db),this.connector=new a[t.connector.name](this,t.connector)}return s(e,[{key:"init",value:function(e){var t=this.options,r={};this.share=r,this.db.requestTransaction(regeneratorRuntime.mark(function n(){var i,s,o,u,c,l,d;return regeneratorRuntime.wrap(function(n){for(;;)switch(n.prev=n.next){case 0:n.t0=regeneratorRuntime.keys(t.share);case 1:if((n.t1=n.t0()).done){n.next=26;break}if(i=n.t1.value,s=t.share[i].split("("),o=s.splice(0,1),u=a[o],c=u.typeDefinition,l=["_",c.struct+"_"+o+"_"+i+"_"+s],d=[],1!==s.length){n.next=22;break}n.prev=10,d=JSON.parse("["+s[0].split(")")[0]+"]"),n.next=17;break;case 14:throw n.prev=14,n.t2=n.catch(10),new Error("Was not able to parse type definition! (share."+i+")");case 17:if(null!=u.typeDefinition.parseArguments){n.next=21;break}throw new Error(o+" does not expect arguments!");case 21:d=c.parseArguments(d[0])[1];case 22:return n.delegateYield(this.store.initType.call(this,l,d),"t3",23);case 23:r[i]=n.t3,n.next=1;break;case 26:this.store.whenTransactionsFinished().then(e);case 27:case"end":return n.stop()}},n,this,[[10,14]])}))}},{key:"isConnected",value:function(){return this.connector.isSynced}},{key:"disconnect",value:function(){return this.connector.disconnect()}},{key:"reconnect",value:function(){return this.connector.reconnect()}},{key:"destroy",value:function(){null!=this.connector.destroy?this.connector.destroy():this.connector.disconnect();var e=this;this.db.requestTransaction(regeneratorRuntime.mark(function t(){return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.delegateYield(e.db.destroy(),"t0",1);case 1:e.connector=null,e.db=null;case 3:case"end":return t.stop()}},t,this)}))}}]),e}();"undefined"!=typeof window&&(window.Y=a)},{"./Connector.js":4,"./Connectors/Test.js":5,"./Database.js":6,"./Struct.js":7,"./Transaction.js":8,"./Utils.js":9}]},{},[3,10]);
//# sourceMappingURL=y.js.map
;
syncmeta_api.define("yjs", function(){});

syncmeta_api.define('lib/yjs-sync',['jquery', 'yjs'], function($) {
    return function(spaceTitle) {

        var deferred = $.Deferred();
        if (!spaceTitle) {
            //try to get space title from url if space promise fails
            spaceTitle = frameElement.baseURI.substring(frameElement.baseURI.lastIndexOf('spaces/')).replace(/spaces|#\S*|\?\S*|\//g, '');
        }
        Y({
            db: {
                name: 'memory' // store the shared data in memory
            },
            connector: {
                name: 'websockets-client', // use the websockets connector
                room: spaceTitle,
                url:"@@yjsserver"
            },
            share: { // specify the shared content
                users: 'Map',
                join: 'Map',
                canvas: 'Map',
                nodes: 'Map',
                edges: 'Map',
                userList: 'Map',
                select: 'Map',
                views: 'Map',
                data: 'Map',
                activity:'Map',
                globalId: 'Array',
                text:"Text"
            },
            type:["Text","Map"],
            sourceDir: '@@host/microserviceSelectWidget/js'
        }).then(function(y) {
            deferred.resolve(y);
        });
        return deferred.promise();
    };
});
syncmeta_api.define('plugin/plugin',['lib/yjs-sync'], function(yjsSync) {
    'use strict';

    /**
        * Listen to node manipulations. Private helper function
         * @private
         * @param {array} keys - the operations to listen to. All possible options are  ['NodeMoveOperation', 'NodeResizeOperation', 'NodeMoveZOperation']
         * @param {function} callback - the callback if one of the operations defined in keys were issued
         */
    var onNode = function(key, callback) {
        var newObersever = function(event) {
            if (key.indexOf(event.name) != -1) {
                callback(event.value);
            }
        };

        var nodeIds = ySyncMetaInstance.share.nodes.keys();
        for (var i = 0; i < nodeIds.length; i++) {
            var ymap = ySyncMetaInstance.share.nodes.get(nodeIds[i]);
             ymap.observe(newObersever);
        }
        nodeObservers[key].push(newObersever);
    };
    var nodeObservers = {
        NodeMoveOperation: [],
        NodeResizeOperation: [],
        NodeMoveZOperation: []
    };
    var attrObservers = {
        nodes: {
            attributeYTextObserver: undefined,
            attributePrimitiveObserver: undefined
        },
        edges: {
            attributeYTextObserver: undefined,
            attributePrimitiveObserver: undefined
        }
    }
    var ySyncMetaInstance = null;

    var jabberId = null;

    /**
         * Listen to changes on Attributes on nodes or edges
         * @param {string} type - 'nodes' or 'edges'
         * @param {onAttributeChangeCallback} callback - calls back if a attribute is changed
         * @param {string} entityId - id of the node to listen to. If null we listen to all of the specified type
         * @private
         */
    var onAttributeChange = function(type, callback) {
        if (!ySyncMetaInstance)
            return new Error('No Connection to Yjs space');


        attrObservers[type].attributePrimitiveObserver = function(entityId) {
            return function(event) {
                if (event.name.search(/\w*\[(\w|\s)*\]/g) != -1) {
                    callback(event.value.value, entityId, event.value.entityId);
                }
            }
        }
        attrObservers[type].attributeYTextObserver = function(entityId, attrId) {
            return function(event) {
                callback(event.object.toString(), entityId, attrId);
            }
        };

        var listenToAttributes = function(ymap, entityId) {
            var listentoAttributesHelper = function (attrId, ytext, entityId) {
                var newObserver = attrObservers[type].attributeYTextObserver(entityId, attrId);
                ytext.observe(newObserver);
            };

            var newObserver = attrObservers[type].attributePrimitiveObserver(entityId);
            ymap.observe(newObserver);

            var keys = ymap.keys();
            for (var i = 0; i < keys.length; i++) {
                if (keys[i].search(/\w*\[(\w|\s)*\]/g) != -1) {
                    var ytext = ymap.get(keys[i]);
                    //is it relly a y-text object?
                    if(ytext.constructor.name === "t")
                        listentoAttributesHelper(keys[i], ytext, entityId);
                }
            }
        };

        //listen to everything OR return
        var nodeIds = ySyncMetaInstance.share[type].keys();
        for (var i = 0; i < nodeIds.length; i++) {
            var p = ySyncMetaInstance.share[type].get(nodeIds[i]);
            if (p) {
                listenToAttributes(p, nodeIds[i]);
            }
        }
    };


    return {
        /**
         * If are already connected to a syncmeta yjs space then use this funnction to init the plugin
         * Otherwise connect to yjs with the connect function
         * @param {object} yInstance - the y instance
         */
        init: function(yInstance) {
            ySyncMetaInstance = yInstance;

            var attrObserverInit = function(type, ymap, id) {
                if (attrObservers[type].attributePrimitiveObserver && attrObservers[type].attributeYTextObserver) {
                    ymap.observe(function(e) {
                        if (e.type === 'add' && e.name.search(/\w*\[(\w|\s)*\]/g) != -1) {
                            var attrId = e.name;
                            if (e.value.constructor.name === "t") {
                                var ytext = e.value;
                                var newObserver = attrObservers[type].attributeYTextObserver(id, attrId);
                                ytext.observe(newObserver);
                            } else {
                                var newObersever = attrObservers[type].attributePrimitiveObserver(id);
                                e.object.observe(newObersever);
                            }
                        }
                    });
                }
            }

            ySyncMetaInstance.share.nodes.observe(function(event) {
                var nodeId = event.name;
                if (event.type === 'add') {
                    var ymap = event.value;
                    for (var key in nodeObservers) {
                        if (nodeObservers.hasOwnProperty(key)) {
                            for (var i = 0; i < nodeObservers[key].length; i++) {
                                ymap.observe(nodeObservers[key][i]);
                            }
                        }
                    }
                    attrObserverInit('nodes', ymap, nodeId);
                }
            });

            ySyncMetaInstance.share.edges.observe(function(event) {
                var edgeId = event.name;
                if (event.type === 'add') {
                    var ymap = event.value;
                    attrObserverInit('edges', ymap, edgeId);
                }
            })

            openapp.resource.get(openapp.param.user(), function(user) {
                jabberId = user.subject['http://xmlns.com/foaf/0.1/jabberID'][0].value.replace("xmpp:", "");
            })
        },
        /**
         * Connect to a syncmeta yjs space.
         * This or the init function must be called before using the listeners.
         * This interally uses the init function to setup the plugin.
         * @param {string} spaceName - the name of the role space where the widgets are located
         * @see init
         */
        connect: function(spaceName) {
            var that = this;
            if (!ySyncMetaInstance) {
                var deferred = $.Deferred();
                yjsSync(spaceName).done(function(y) {
                    that.init(y);
                    deferred.resolve();
                }).then(function() {
                    return true;
                })
            }
            else deferred.reject();
            return deferred.promise();
        },
        /**
         * Listen to NodeAddOperations on the SyncMeta canvas widget
         * @param {onNodeAddCallback} callback - the callback if a node was created on syncmeta canvas widget
         */
        onNodeAdd: function(callback) {
            if (!ySyncMetaInstance)
                return new Error('No Connection to Yjs space');

            ySyncMetaInstance.share.canvas.observe(function(event) {
                if (event.name == 'NodeAddOperation')
                    callback(event.value);
            });
        },
        /**
         * @param{function} callback - callback if a users joins the space
         */
        onUserJoin: function(callback) {
            if (!ySyncMetaInstance)
                return new Error('No Connection to Yjs space');
            ySyncMetaInstance.share.userList.observe(function(event) {
                callback(event.value);
            })
        },
        /**
         * Listen to EdgeAddOperation on the SyncMeta canvas widget
         * @param {onEdgeAddCallback} callback - the callback if a edge was created on syncmeta canvas widget
         */
        onEdgeAdd: function(callback) {
            if (!ySyncMetaInstance)
                return new Error('No Connection to Yjs space');

            ySyncMetaInstance.share.canvas.observe(function(event) {
                if (event.name == 'EdgeAddOperation')
                    callback(event.value);
            });
        },
        /**
         * Listen to both EdgeAddOperation and NodeAddOperation
         * @param callback - the callback if edge or node was created on syncmeta canvas widget
         * @see onNodeAdd
         * @see onEdgeAdd
         */
        onEntityAdd: function(callback) {
            if (!ySyncMetaInstance)
                return new Error('No Connection to Yjs space');

            ySyncMetaInstance.share.canvas.observe(function(event) {
                if (event.name == 'NodeAddOperation')
                    callback(event.value);
                else if (event.name == 'EdgeAddOperation')
                    callback(event.value, event.name);
            });

        },
        /**
         * Listen to selections of entities on the Syncmeta canvas widget
         * @param {onEntitySelectCallback} callback - the callback if a entity was selected
         */
        onEntitySelect: function(callback) {
            if (!ySyncMetaInstance)
                return new Error('No Connection to Yjs space');

            ySyncMetaInstance.share.select.observe(function(event) {
                if (event.value)
                    callback(event.value);
            });
        },
        /**
         * Listen to selections of nodes on the Syncmeta canvas widget
         * @param {onEntitySelectCallback} callback - the callback if a node was selected
         */
        onNodeSelect: function(callback) {

            if (!ySyncMetaInstance)
                return new Error('No Connection to Yjs space');
            ySyncMetaInstance.share.select.observe(function(event) {
                if (event.value && ySyncMetaInstance.share.nodes.keys().indexOf(event.value) != -1)
                    callback(event.value);
            });
        },
        /**
         * Listen to selections of edges on the Syncmeta canvas widget
         * @param {onEntitySelectCallback} callback - the callback if a edge was selected
         */
        onEdgeSelect: function(callback) {
            if (!ySyncMetaInstance)
                return new Error('No Connection to Yjs space');
            ySyncMetaInstance.share.select.observe(function(event) {
                if (event.value && ySyncMetaInstance.share.edges.keys().indexOf(event.value) != -1)
                    callback(event.value);
            });
        },
        /**
         * Listen to NodeDeleteOperation
         * @param {onEntityDeleteCallback} callback - the callback if a node was deleted
         */
        onNodeDelete: function(callback) {
            if (!ySyncMetaInstance)
                return new Error('No Connection to Yjs space');
            ySyncMetaInstance.share.nodes.observe(function(event) {
                if (event.type === 'delete')
                    callback(event.name);
            });

        },
        /**
         * Listen to EdgeDeleteOperations
         * @param {onEntityDeleteCallback} callback - the callback if a edge was deleted
         */
        onEdgeDelete: function(callback) {
            if (!ySyncMetaInstance)
                return new Error('No Connection to Yjs space');
            ySyncMetaInstance.share.edges.observe(function(event) {
                if (event.type === 'delete')
                    callback(event.name);
            });
        },
        /**
         * Listen to NodeMoveOperations
         * Equivalent to onNode(['NodeMoveOperation'], callback, id);
         * @param {onNodeMoveCallback} callback - the callback if a node is moved on the canvas
         * @param {string} id - id of the node to listen to. If null we listen to all
         * @see onNode
         */
        onNodeMove: function(callback) {
            if (!ySyncMetaInstance)
                return new Error('No Connection to Yjs space');
            onNode('NodeMoveOperation', callback);
        },
        /**
         * Listen to NodeResizeOperations
         * Equivalent to onNode(['NodeResizeOperation'], callback, id);
         * @param {onNodeResizeCallback} callback - the callback if a node is resized on the canvas
         * @param {string} id - id of the node to listen to. If null we listen to all
         * @see OnNode
         */
        onNodeResize: function(callback) {
            if (!ySyncMetaInstance)
                return new Error('No Connection to Yjs space');
            onNode('NodeResizeOperation', callback);
        },
        /**
         * Listen to NodeMoveZOperations
         * Equivalent to onNode(['NodeMoveZOperation'], callback, id);
         * @param {onNodeMoveZCallback} callback - the callback if a node is moved to the back- or foreground on the canvas
         * @param {string} id - id of the node to listen to. If null we listen to all
         * @see OnNode
         */
        onNodeMoveZ: function(callback) {
            if (!ySyncMetaInstance)
                return new Error('No Connection to Yjs space');
            onNode('NodeMoveZOperation', callback);
        },
        /**
         * Listen to changes on Attributes on nodes
         * Equivalent to onAttributeChange('nodes', callback, entityId);
         * @param {onAttributeChangeCallback} callback - calls back if a attribute is changed
         * @param {string} entityId - id of the node to listen to. If null we listen to all of the specified type
         * @see OnAttributeChange
         */
        onNodeAttributeChange: function(callback) {
            onAttributeChange('nodes', callback);
        },
        /**
         * Listen to changes on Attributes on edges
         * Equivalent to onAttributeChange('edges', callback, entityId);
         * @param {onAttributeChangeCallback} callback - calls back if a attribute is changed
         * @param {string} entityId - id of the edge to listen to. If null we listen to all of the specified type
         * @see OnAttributeChange
         */
        onEdgeAttributeChange: function(callback) {
            onAttributeChange('edges', callback);
        },
        /**
         * Set a value for a attribute of a entity
         * @param {stirng} entity
         * @param {string} attrName
         * @param {string|bool|integer} value
         */
        setAttributeValue: function(entityId, attrName, value) {
            var idx = ySyncMetaInstance.share.nodes.keys().indexOf(entityId);

            var attrId;
            //Does attrName has the form of the id
            if (attrName.search(/\w*\[(\w|\s)*\]/g) != -1)
                //Yes, the attribute name is the attribute id
                attrId = attrName;
            else
                //No, build the attribute id
                attrId = entityId + '[' + attrName.toLowerCase() + ']';

            var findAttr = function (ymap, attrId, value) {
                var keys = ymap.keys().indexOf(attrId);
                if (keys != -1) {
                    var attr = ymap.get(attrId);

                    if (attr.constructor.name === "t") {
                        var ytext = attr;

                            var l = ytext.toString().length;
                            if (l > 0) {
                                ytext.delete(0, l);
                            }
                            ytext.insert(0, value);
                            //lets wait a bit before trigger the save
                            // so that the canvas and attribute widget can process the value change at their callbacks
                            setTimeout(function () {
                                if (jabberId)
                                    ySyncMetaInstance.share.canvas.set('triggerSave', jabberId);
                            }, 500);
                    }
                    else
                        ymap.set(attrId, { 'entityId': attrId, 'value': value, 'type': 'update', 'position': 0 });
                }
                else
                    ymap.set(attrId, { 'entityId': attrId, 'value': value, 'type': 'update', 'position': 0 });
            }

            if (idx != -1) {
                var ymap = ySyncMetaInstance.share.nodes.get(entityId);
                findAttr(ymap, attrId, value);
            } else {
                idx = ySyncMetaInstance.share.edges.keys().indexOf(entityId);
                if (idx != -1) {
                    var ymap = ySyncMetaInstance.share.edges.get(entityId);
                    findAttr(ymap, attrId, value);
                }
                else {
                    return;
                }
            }
        }

        /**
         * @callback onNodeAddCallback
         * @param {object} event - the NodeAddOperation event
         * @param {string} event.id - the id of the created node
         * @param {string} event.type - the type of the node
         * @param {string} event.oType - the original type (only set in views, then type is the view type)
         * @param {integer} event.top - y position in the canvas
         * @param {integer} event.left - x position in the canvas
         * @param {integer} event.width - width of the node
         * @param {integer} event.height - height of the node
         * @param {integer} event.zIndex - depth value of the node
         * @param {object} event.json - the json representation. Only used for import of (meta-)models. Should be always null
         * @param {string} event.jabberId - jabberId of the user who created the node
         *
         */

        /**
         * @callback onEdgeAddCallback
         * @param {object} event - the EdgeAddOperation event
         * @param {string} event.id - the id of the created edge
         * @param {string} event.jabberId - jabberId of the user who created the edge
         * @param {string} event.type - the type of the edge
         * @param {string} event.oType - the original type (only set in views, then type is the view type)
         * @param {object} event.json - the json representation. Only used for import of (meta-)models. Should be always null
         * @param {string} event.source - the source of the edge
         * @param {string} event.target - the target of the edge
         */

        /**
         * @callback onEntitySelectCallback
         * @param {string} id - the id of the selected entity (node/edge)
         */

        /**
         * @callback onEntityDeleteCallback
         * @param {string} id - the id of the deleted entity (node/edge)
         */

        /**
         * @callback onNodeMoveCallback
         * @param {object} event - the node move operation
         * @param {string} event.id - the id of node
         * @param {string} event.jabberId - the jabberId of the user
         * @param {integer} event.offsetX
         * @param {integer} event.offsetY
         */

        /**
         *@callback onNodeResizeCallback
         * @param {object} event - the node resize operation
         * @param {string} event.id - the id of node
         * @param {string} event.jabberId - the jabberId of the user
         * @param {integer} event.offsetX
         * @param {integer} event.offsetY
         * */

        /**
         * @callback onNodeMoveZCallback
         * @param {object} event - the NodeMoveZOperation
         * @param {string} event.id - the id of the node
         * @param {integer} event.offsetZ - the offset of the z coordinate
         */

        /**
         * @callback onAttributeChangeCallback
         * @param {string} value - the new value of the attribute
         * @param {string} entityId - the id of the entity (node/edge) the attribute belongs to
         * @param {string} attrId - the id of the attribute
         */
    }
});



/*global define */
syncmeta_api.define('plugin/main.js',['require','../plugin/plugin'],function (require) {
    'use strict';

    var plugin = require('../plugin/plugin');

    window.syncmeta = plugin;

    return plugin;
});

    syncmeta_api.define('jquery', function () {
        return this.$;
    });

    //Use almond's special top-level, synchronous require to trigger factory
    //functions, get the final module value, and export it as the public
    //value.
    return syncmeta_api.require('plugin/main.js');
}));
