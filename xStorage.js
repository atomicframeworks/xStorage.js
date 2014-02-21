/*!
                        
       ##    #####      Copyright (c) - Kevin McGinty
     # _ #  ###        
    #   #  #            AtomicFrameworks
    
*/
/*global document, setInterval*/
var xStorage = (function (globals) {
    'use strict';
    // Setting - The base domain of the proxy
    var proxyDomain = 'http://localhost:8000',
        // Setting - The page where the proxy JavaScript is stored
        proxyPage = '/proxy.html',
        // Setting - The variable on proxy localStorage that wil used as an object store
        storageKey = 'xStorage',
        // Object to store deferred callbacks
        deferredObject = {},
        // Create proxy iframe
        iframe = document.createElement("iframe"),
        // Window object used to pass messages between the iframes
        proxyWindowObject,
        // Token returned from addEventListener used to detach the listener for non IE
        listenerToken,
        // Script var used to insert JSON3 script if JSON is unsupported
        script,
        // Check if postMessage supported
        usePostMessage = (globals.postMessage !== undefined),
        // Used to cache bust hash changes for browsers that do not support postMessage (<=IE7)
        cacheBust = 0,
        // Used to store current hash for browsers that do not support postMessage (<=IE7)
        hash = globals.location.hash,
        // Polling delay used to check hash change for browsers that do not support postMessage (<=IE7)
        delay = 333,
        // Function to add proxy iFrame to document when DOM is ready
        addProxy = function () {
            iframe = document.body.appendChild(iframe);
            proxyWindowObject = iframe.contentWindow;
        },
        // IE function for DOM ready. Retain a reference to it so we can detach the event
        handleReadyStateChange = function () {
            if (document.readyState === "complete") {
                document.detachEvent("onreadystatechange", handleReadyStateChange);
                addProxy();
            }
        },
        // Function that is fired on window message or hash change for browsers that do not support postMessage (<=IE7)
        handleMessageEvent = function (event) {
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
        },
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
    // Set iFrame attributes
    iframe.src = proxyDomain + proxyPage;
    iframe.style.display = "none";

    // If JSON is not supported add it
    if (!globals.JSON) {
        script = document.createElement('script');
        script.setAttribute('src', '//cdnjs.cloudflare.com/ajax/libs/json3/3.3.0/json3.min.js');
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    // If postMessage not supported set up polling for hash change
    if (!usePostMessage) {
        // Poll for hash changes
        setInterval(function () {
            if (globals.location.hash !== hash) {
                // Set new hash
                hash = globals.location.hash;
                handleMessageEvent({
                    origin: proxyDomain,
                    data: hash.substr(1)
                });
            }
        }, delay);
    }

    // Cross browser document ready
    if (globals.addEventListener) {
        listenerToken = document.addEventListener("DOMContentLoaded", function () {
            document.removeEventListener("DOMContentLoaded", listenerToken);
            addProxy();
        });
    } else if (globals.attachEvent) {
        // IE will have to check readyState on change
        listenerToken = document.attachEvent("onreadystatechange", handleReadyStateChange);
    }

    // IE7 and lower uses attachEvent
    globals.addEventListener = globals.addEventListener || globals.attachEvent;

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
            var deferredHash = randomHash(),
                message = JSON.stringify({
                    'event': event,
                    'storageKey': storageKey,
                    'deferredHash': deferredHash,
                    'item': item
                });
            // Set the deferred object reference
            deferredObject[hash] = {
                resolve: resolve,
                reject: reject
            };
            // Send the message and target URI
            //proxyWindowObject.postMessage(message, '*');
            if (usePostMessage) {
                // Post the message as JSON
                proxyWindowObject.postMessage(message, '*');
            } else {
                // postMessage not available so set  hash
                if (iframe !== null) {
                    // Cache bust messages with the same info
                    cacheBust += 1;
                    message.cacheBust = ((+new Date()) + cacheBust);
                    if (iframe.src) {
                        iframe.src = proxyDomain + proxyPage + '#' + JSON.stringify(message);
                    } else if (iframe.contentWindow !== null && iframe.contentWindow.location !== null) {
                        iframe.contentWindow.location = proxyDomain + proxyPage + '#' + JSON.stringify(message);
                    } else {
                        iframe.setAttribute('src', proxyDomain + proxyPage + '#' + JSON.stringify(message));
                    }
                }
            }
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
        globals.addEventListener('message', handleMessageEvent, false);
    }());
    // Return the public methods
    return {
        'get': getStorage,
        'set': setStorage,
        'merge': mergeStorage,
        'delete': deleteStorage
    };
}(this));