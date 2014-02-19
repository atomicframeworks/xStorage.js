/*!
                        
       ##    #####      Copyright (c) - Kevin McGinty
     # _ #  ###        
    #   #  #            AtomicFrameworks
    
*/
/*global document*/
var xStorage = (function (globals) {
    'use strict';
    // Object to store deferred callbacks
    var deferredObject = {},
        // The variable on proxy localStorage that wil used as an object store
        storageKey = 'xStorage',
        // The base domain of the proxy
        proxyDomain = 'http://atomicframeworks.github.io',
        // The page where the proxy JavaScript is stored
        proxyPage = '/xStorage.js',
        // Create proxy iframe
        iframe = document.createElement("iframe"),
        // Window object used to pass messages between the iframes
        proxyWindowObject,
        Deferred = globals.Promise || function (func) {
            var that = this;
            // Fake promise interface if Promise not available
            that.callbacks = [];
            that.errorbacks = [];
            that.then = function (callback, errorback) {
                if (errorback) {
                    that.errorbacks[that.callbacks.length] = errorback;
                }
                that.callbacks.push(callback);
                return that;
            };
            that.resolve = function (data) {
                var i = 0, l = that.callbacks.length;
                for (i; i < l; i += 1) {
                    try {
                        data = that.callbacks[i](data);
                    } catch (e) {
                        if (that.errorbacks[i]) {
                            that.errorbacks[i](e);
                        } else {
                            throw new Error(e);
                        }
                    }
                }
            };
            that.reject = function (e) {
                if (that.errorbacks.length) {
                    that.errorbacks[that.errorbacks.length](e);
                } else {
                    throw new Error(e);
                }
            };
            if (func) {
                func(that.resolve, that.reject);
            }
        };
    // Add the proxy iframe to DOM
    iframe.setAttribute("src", proxyDomain + proxyPage);
    iframe = document.body.appendChild(iframe);
    proxyWindowObject = iframe.contentWindow;

    // Helper function to determine if the item is an object (not including arrays)
    function isObject(item) {
        return (item instanceof Object && typeof item === 'object' && !(item instanceof Array));
    }

    // Helper to return a random string to serve as a simple hash
    function randomHash() {
        return Math.random().toString(36).substr(2);
    }

     // Helper to create the functions for promises
    function createPromisefunction(event, item) {
        return function (resolve, reject) {
            // Message to set the storage
            var hash = randomHash(),
                message = JSON.stringify({
                    'event': event,
                    'storageKey': storageKey,
                    'deferredHash': hash,
                    'item': item
                });
            // Set the deferred object reference
            deferredObject[hash] = {
                resolve: resolve,
                reject: reject
            };
            // Send the message and target URI
            proxyWindowObject.postMessage(message, '*');
        };
    }

    // Function to get localStorage from proxy
    function getStorage(property) {
        return new Deferred(
            createPromisefunction('get', property)
        );
    }

    // Function to set localStorage on proxy
    function setStorage(property, value) {
        if (typeof property !== 'string' && typeof property !== 'number') {
            throw new Error('Property argument must be a string or number to set a specific property');
        }
        return new Deferred(
            createPromisefunction('set', {
                'property': property,
                'value': value
            })
        );
    }

    // Function to merge xStorage on proxy with storageObject
    function mergeStorage(storageObject) {
        if (!isObject(storageObject)) {
            throw new Error('Argument must be an object to merge with xStorage object');
        }
        return new Deferred(
            createPromisefunction('merge', storageObject)
        );
    }

    // Delete a property from storage or entire storage if no property provided
    function deleteStorage(property) {
        return new Deferred(
            createPromisefunction('delete', {
                'property': property,
                'value': null
            })
        );
    }

    // Bind the message event for getting storage
    (function bindWindow() {
        // Bind the message back listener
        globals.addEventListener('message', function (event) {
            var response;
            if (event.origin === proxyDomain) {
                // Parse the response
                response = JSON.parse(event.data);
                // if there is a deferred object resolve and remove
                if (response.deferredHash) {
                    if (response.error) {
                        // Reject if error                        
                        deferredObject[response.deferredHash].reject(response.error);
                    } else {
                        // Resolve the deferred object
                        deferredObject[response.deferredHash].resolve(response.storageObject);
                    }
                    // Remove the deferred item
                    delete deferredObject[response.deferredIndex];
                } else if (response.error) {
                    throw new Error(response.error);
                }
            } else {
                throw new Error('Bad domain: ' + proxyDomain +  '  origin:' + event.origin);
            }
        }, false);
    }());
    // Return the public methods
    return {
        get: getStorage,
        set: setStorage,
        merge: mergeStorage,
        delete: deleteStorage
    };
}(this));