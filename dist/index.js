(function(f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = f();
    } else if (typeof define === "function" && define.amd) {
        define([], f);
    } else {
        var g;
        if (typeof window !== "undefined") {
            g = window;
        } else if (typeof global !== "undefined") {
            g = global;
        } else if (typeof self !== "undefined") {
            g = self;
        } else {
            g = this;
        }
        g.ShareJSWrapper = f();
    }
})(function() {
    var define, module, exports;
    return function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f;
                }
                var l = n[o] = {
                    exports: {}
                };
                t[o][0].call(l.exports, function(e) {
                    var n = t[o][1][e];
                    return s(n ? n : e);
                }, l, l.exports, e, t, n, r);
            }
            return n[o].exports;
        }
        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s;
    }({
        1: [ function(require, module, exports) {
            "use strict";
            Object.defineProperty(exports, "__esModule", {
                value: true
            });
            var _createClass = function() {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }
                return function(Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }();
            var _eventemitter = require("eventemitter3");
            var _eventemitter2 = _interopRequireDefault(_eventemitter);
            var _share = require("./vendor/share");
            var _share2 = _interopRequireDefault(_share);
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            function _toConsumableArray(arr) {
                if (Array.isArray(arr)) {
                    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
                        arr2[i] = arr[i];
                    }
                    return arr2;
                } else {
                    return Array.from(arr);
                }
            }
            function _classCallCheck(instance, Constructor) {
                if (!(instance instanceof Constructor)) {
                    throw new TypeError("Cannot call a class as a function");
                }
            }
            var ABNORMAL = 1006;
            var NORMAL = 1e3;
            var NOT_FOUND = 4040;
            var UNAUTHORIZED = 4010;
            var LOCAL_TIMEOUT = 4011;
            var ShareJSWrapper = function() {
                function ShareJSWrapper(config) {
                    _classCallCheck(this, ShareJSWrapper);
                    this.config = config;
                    this.eventEmitter = new _eventemitter2.default();
                }
                _createClass(ShareJSWrapper, [ {
                    key: "connect",
                    value: function connect(callback, isReconnect) {
                        var _this = this;
                        var _config = this.config;
                        var canvasID = _config.canvasID;
                        var orgID = _config.orgID;
                        var realtimeURL = _config.realtimeURL;
                        this.socket = new WebSocket(realtimeURL);
                        this.connection = this.getShareJSConnection();
                        if (isReconnect) {
                            return;
                        }
                        this.bindConnectionEvents();
                        this.document = this.connection.get(orgID, canvasID);
                        this.document.subscribe();
                        this.document.whenReady(function(_) {
                            _this.debug("whenReady");
                            if (!_this.document.type) {
                                _this.document.create("text");
                            }
                            _this.context = _this.getDocumentContext();
                            _this.context.onInsert = bind(_this, "onRemoteOperation");
                            _this.context.onRemove = bind(_this, "onRemoteOperation");
                            _this.content = _this.context.get();
                            if (callback) {
                                callback();
                            }
                        });
                    }
                }, {
                    key: "disconnect",
                    value: function disconnect() {
                        this.socket.close();
                    }
                }, {
                    key: "insert",
                    value: function insert(offset, text) {
                        var _this2 = this;
                        this.debug(function(_) {
                            return [ "insert", {
                                content: _this2.context.get(),
                                op: [ offset, text ]
                            } ];
                        });
                        this.context.insert(offset, text);
                        this.content = this.context.get();
                    }
                }, {
                    key: "on",
                    value: function on(event, fn, context) {
                        this.eventEmitter.on(event, fn, context);
                        return this;
                    }
                }, {
                    key: "once",
                    value: function once(event, fn, context) {
                        this.eventEmitter.once(event, fn, context);
                        return this;
                    }
                }, {
                    key: "remove",
                    value: function remove(start, length) {
                        var _this3 = this;
                        this.debug(function(_) {
                            return [ "remove", {
                                content: _this3.context.get(),
                                op: [ start, length ]
                            } ];
                        });
                        this.context.remove(start, length);
                        this.content = this.context.get();
                    }
                }, {
                    key: "removeAllListeners",
                    value: function removeAllListeners(event) {
                        this.eventEmitter.removeAllListeners(event);
                        return this;
                    }
                }, {
                    key: "removeListener",
                    value: function removeListener(event, fn, context, once) {
                        this.eventEmitter.removeListener(event, fn, context, once);
                        return this;
                    }
                }, {
                    key: "bindConnectionEvents",
                    value: function bindConnectionEvents() {
                        this.connection.on("connected", bind(this, "onConnectionConnected"));
                        this.connection.on("disconnected", bind(this, "onConnectionDisconnected"));
                    }
                }, {
                    key: "getDocumentContext",
                    value: function getDocumentContext() {
                        var context = this.document.createContext();
                        if (!context.provides.text) {
                            throw new Error("Cannot attach to a non-text document");
                        }
                        context.detach = null;
                        return context;
                    }
                }, {
                    key: "getShareJSConnection",
                    value: function getShareJSConnection() {
                        var connection = this.connection;
                        if (connection) {
                            connection.bindToSocket(this.socket);
                        } else {
                            connection = new _share2.default.Connection(this.socket);
                        }
                        this.setupSocketAuthentication();
                        this.setupSocketPing();
                        this.setupSocketOnMessage();
                        return connection;
                    }
                }, {
                    key: "onConnectionConnected",
                    value: function onConnectionConnected() {
                        this.debug("connectionConnected");
                        this.reconnectAttempts = 0;
                        this.connected = true;
                    }
                }, {
                    key: "onConnectionDisconnected",
                    value: function onConnectionDisconnected(event) {
                        this.debug.apply(this, [ "connectionDisconnected" ].concat(Array.prototype.slice.call(arguments), [ event.code ]));
                        this.connected = false;
                        clearTimeout(this.pongWait);
                        var error = void 0;
                        switch (event.code) {
                          case ABNORMAL:
                          case LOCAL_TIMEOUT:
                            if (this.reconnectAttempts > 5) {
                                var reason = event.code === ABNORMAL ? "abnormal" : "no_pong";
                                error = new Error(reason);
                            } else {
                                this.reconnect();
                            }
                            break;

                          case UNAUTHORIZED:
                            error = new Error("forbidden");
                            break;

                          case NOT_FOUND:
                            error = new Error("not_found");
                            break;

                          default:
                            if (event.code !== NORMAL) {
                                error = new Error("unexpected");
                            }
                        }
                        if (error) {
                            this.eventEmitter.emit("disconnect", error);
                        }
                    }
                }, {
                    key: "onRemoteOperation",
                    value: function onRemoteOperation(retain, value) {
                        this.content = this.context.get();
                        var type = "remove";
                        if (typeof value === "string") {
                            type = "insert";
                        }
                        this.eventEmitter.emit(type, retain, value);
                    }
                }, {
                    key: "onSocketPong",
                    value: function onSocketPong() {
                        var _this4 = this;
                        this.receivedPong = true;
                        setTimeout(function(_) {
                            _this4.sendPing();
                        }, 5e3);
                    }
                }, {
                    key: "reconnect",
                    value: function reconnect() {
                        var _this5 = this;
                        this.reconnectAttempts = this.reconnectAttempts || 0;
                        var attempts = this.reconnectAttempts;
                        var time = getInterval();
                        setTimeout(function(_) {
                            _this5.reconnectAttempts = _this5.reconnectAttempts + 1;
                            _this5.connect(null, true);
                        }, time);
                        function getInterval() {
                            var max = (Math.pow(2, attempts) - 1) * 1e3;
                            if (max > 5 * 1e3) {
                                max = 5 * 1e3;
                            }
                            return Math.random() * max;
                        }
                    }
                }, {
                    key: "sendPing",
                    value: function sendPing() {
                        var _this6 = this;
                        if (this.config.noPing) {
                            return;
                        }
                        var socket = this.socket;
                        if (socket.readyState === socket.OPEN) {
                            this.receivedPong = false;
                            socket.send("ping");
                            this.pongWait = setTimeout(function(_) {
                                if (!_this6.receivedPong) {
                                    _this6.socket.close(LOCAL_TIMEOUT);
                                }
                            }, 1e3);
                        }
                    }
                }, {
                    key: "setupSocketAuthentication",
                    value: function setupSocketAuthentication() {
                        var _this7 = this, _arguments = arguments;
                        var accessToken = this.config.accessToken;
                        var socket = this.socket;
                        var _onopen = bind(socket, "onopen");
                        socket.onopen = function(_) {
                            _this7.debug("sending auth token");
                            socket.send("auth-token:" + accessToken);
                            _onopen.apply(undefined, _arguments);
                        };
                    }
                }, {
                    key: "setupSocketOnMessage",
                    value: function setupSocketOnMessage() {
                        var socket = this.socket;
                        var _onmessage = bind(socket, "onmessage");
                        socket.onmessage = function onMessage(_ref) {
                            var data = _ref.data;
                            if (data === "pong") {
                                this.onSocketPong();
                                return null;
                            }
                            return _onmessage.apply(undefined, arguments);
                        }.bind(this);
                    }
                }, {
                    key: "setupSocketPing",
                    value: function setupSocketPing() {
                        var socket = this.socket;
                        var _onopen = bind(socket, "onopen");
                        socket.onopen = function onOpen() {
                            this.sendPing();
                            _onopen.apply(undefined, arguments);
                        }.bind(this);
                    }
                }, {
                    key: "debug",
                    value: function debug() {
                        if (this.config.debug) {
                            if (arguments.length === 1 && typeof arguments[0] === "function") {
                                var _console;
                                (_console = console).log.apply(_console, _toConsumableArray(arguments[0]()));
                            } else {
                                var _console2;
                                (_console2 = console).log.apply(_console2, arguments);
                            }
                        }
                    }
                } ]);
                return ShareJSWrapper;
            }();
            exports.default = ShareJSWrapper;
            function bind(target, method) {
                return target[method].bind(target);
            }
        }, {
            "./vendor/share": 7,
            eventemitter3: 2
        } ],
        2: [ function(require, module, exports) {
            "use strict";
            var prefix = typeof Object.create !== "function" ? "~" : false;
            function EE(fn, context, once) {
                this.fn = fn;
                this.context = context;
                this.once = once || false;
            }
            function EventEmitter() {}
            EventEmitter.prototype._events = undefined;
            EventEmitter.prototype.listeners = function listeners(event, exists) {
                var evt = prefix ? prefix + event : event, available = this._events && this._events[evt];
                if (exists) return !!available;
                if (!available) return [];
                if (available.fn) return [ available.fn ];
                for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
                    ee[i] = available[i].fn;
                }
                return ee;
            };
            EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
                var evt = prefix ? prefix + event : event;
                if (!this._events || !this._events[evt]) return false;
                var listeners = this._events[evt], len = arguments.length, args, i;
                if ("function" === typeof listeners.fn) {
                    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);
                    switch (len) {
                      case 1:
                        return listeners.fn.call(listeners.context), true;

                      case 2:
                        return listeners.fn.call(listeners.context, a1), true;

                      case 3:
                        return listeners.fn.call(listeners.context, a1, a2), true;

                      case 4:
                        return listeners.fn.call(listeners.context, a1, a2, a3), true;

                      case 5:
                        return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;

                      case 6:
                        return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
                    }
                    for (i = 1, args = new Array(len - 1); i < len; i++) {
                        args[i - 1] = arguments[i];
                    }
                    listeners.fn.apply(listeners.context, args);
                } else {
                    var length = listeners.length, j;
                    for (i = 0; i < length; i++) {
                        if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);
                        switch (len) {
                          case 1:
                            listeners[i].fn.call(listeners[i].context);
                            break;

                          case 2:
                            listeners[i].fn.call(listeners[i].context, a1);
                            break;

                          case 3:
                            listeners[i].fn.call(listeners[i].context, a1, a2);
                            break;

                          default:
                            if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                                args[j - 1] = arguments[j];
                            }
                            listeners[i].fn.apply(listeners[i].context, args);
                        }
                    }
                }
                return true;
            };
            EventEmitter.prototype.on = function on(event, fn, context) {
                var listener = new EE(fn, context || this), evt = prefix ? prefix + event : event;
                if (!this._events) this._events = prefix ? {} : Object.create(null);
                if (!this._events[evt]) this._events[evt] = listener; else {
                    if (!this._events[evt].fn) this._events[evt].push(listener); else this._events[evt] = [ this._events[evt], listener ];
                }
                return this;
            };
            EventEmitter.prototype.once = function once(event, fn, context) {
                var listener = new EE(fn, context || this, true), evt = prefix ? prefix + event : event;
                if (!this._events) this._events = prefix ? {} : Object.create(null);
                if (!this._events[evt]) this._events[evt] = listener; else {
                    if (!this._events[evt].fn) this._events[evt].push(listener); else this._events[evt] = [ this._events[evt], listener ];
                }
                return this;
            };
            EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
                var evt = prefix ? prefix + event : event;
                if (!this._events || !this._events[evt]) return this;
                var listeners = this._events[evt], events = [];
                if (fn) {
                    if (listeners.fn) {
                        if (listeners.fn !== fn || once && !listeners.once || context && listeners.context !== context) {
                            events.push(listeners);
                        }
                    } else {
                        for (var i = 0, length = listeners.length; i < length; i++) {
                            if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
                                events.push(listeners[i]);
                            }
                        }
                    }
                }
                if (events.length) {
                    this._events[evt] = events.length === 1 ? events[0] : events;
                } else {
                    delete this._events[evt];
                }
                return this;
            };
            EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
                if (!this._events) return this;
                if (event) delete this._events[prefix ? prefix + event : event]; else this._events = prefix ? {} : Object.create(null);
                return this;
            };
            EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
            EventEmitter.prototype.addListener = EventEmitter.prototype.on;
            EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
                return this;
            };
            EventEmitter.prefixed = prefix;
            if ("undefined" !== typeof module) {
                module.exports = EventEmitter;
            }
        }, {} ],
        3: [ function(require, module, exports) {
            function EventEmitter() {
                this._events = this._events || {};
                this._maxListeners = this._maxListeners || undefined;
            }
            module.exports = EventEmitter;
            EventEmitter.EventEmitter = EventEmitter;
            EventEmitter.prototype._events = undefined;
            EventEmitter.prototype._maxListeners = undefined;
            EventEmitter.defaultMaxListeners = 10;
            EventEmitter.prototype.setMaxListeners = function(n) {
                if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError("n must be a positive number");
                this._maxListeners = n;
                return this;
            };
            EventEmitter.prototype.emit = function(type) {
                var er, handler, len, args, i, listeners;
                if (!this._events) this._events = {};
                if (type === "error") {
                    if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
                        er = arguments[1];
                        if (er instanceof Error) {
                            throw er;
                        } else {
                            var err = new Error('Uncaught, unspecified "error" event. (' + er + ")");
                            err.context = er;
                            throw err;
                        }
                    }
                }
                handler = this._events[type];
                if (isUndefined(handler)) return false;
                if (isFunction(handler)) {
                    switch (arguments.length) {
                      case 1:
                        handler.call(this);
                        break;

                      case 2:
                        handler.call(this, arguments[1]);
                        break;

                      case 3:
                        handler.call(this, arguments[1], arguments[2]);
                        break;

                      default:
                        args = Array.prototype.slice.call(arguments, 1);
                        handler.apply(this, args);
                    }
                } else if (isObject(handler)) {
                    args = Array.prototype.slice.call(arguments, 1);
                    listeners = handler.slice();
                    len = listeners.length;
                    for (i = 0; i < len; i++) listeners[i].apply(this, args);
                }
                return true;
            };
            EventEmitter.prototype.addListener = function(type, listener) {
                var m;
                if (!isFunction(listener)) throw TypeError("listener must be a function");
                if (!this._events) this._events = {};
                if (this._events.newListener) this.emit("newListener", type, isFunction(listener.listener) ? listener.listener : listener);
                if (!this._events[type]) this._events[type] = listener; else if (isObject(this._events[type])) this._events[type].push(listener); else this._events[type] = [ this._events[type], listener ];
                if (isObject(this._events[type]) && !this._events[type].warned) {
                    if (!isUndefined(this._maxListeners)) {
                        m = this._maxListeners;
                    } else {
                        m = EventEmitter.defaultMaxListeners;
                    }
                    if (m && m > 0 && this._events[type].length > m) {
                        this._events[type].warned = true;
                        console.error("(node) warning: possible EventEmitter memory " + "leak detected. %d listeners added. " + "Use emitter.setMaxListeners() to increase limit.", this._events[type].length);
                        if (typeof console.trace === "function") {
                            console.trace();
                        }
                    }
                }
                return this;
            };
            EventEmitter.prototype.on = EventEmitter.prototype.addListener;
            EventEmitter.prototype.once = function(type, listener) {
                if (!isFunction(listener)) throw TypeError("listener must be a function");
                var fired = false;
                function g() {
                    this.removeListener(type, g);
                    if (!fired) {
                        fired = true;
                        listener.apply(this, arguments);
                    }
                }
                g.listener = listener;
                this.on(type, g);
                return this;
            };
            EventEmitter.prototype.removeListener = function(type, listener) {
                var list, position, length, i;
                if (!isFunction(listener)) throw TypeError("listener must be a function");
                if (!this._events || !this._events[type]) return this;
                list = this._events[type];
                length = list.length;
                position = -1;
                if (list === listener || isFunction(list.listener) && list.listener === listener) {
                    delete this._events[type];
                    if (this._events.removeListener) this.emit("removeListener", type, listener);
                } else if (isObject(list)) {
                    for (i = length; i-- > 0; ) {
                        if (list[i] === listener || list[i].listener && list[i].listener === listener) {
                            position = i;
                            break;
                        }
                    }
                    if (position < 0) return this;
                    if (list.length === 1) {
                        list.length = 0;
                        delete this._events[type];
                    } else {
                        list.splice(position, 1);
                    }
                    if (this._events.removeListener) this.emit("removeListener", type, listener);
                }
                return this;
            };
            EventEmitter.prototype.removeAllListeners = function(type) {
                var key, listeners;
                if (!this._events) return this;
                if (!this._events.removeListener) {
                    if (arguments.length === 0) this._events = {}; else if (this._events[type]) delete this._events[type];
                    return this;
                }
                if (arguments.length === 0) {
                    for (key in this._events) {
                        if (key === "removeListener") continue;
                        this.removeAllListeners(key);
                    }
                    this.removeAllListeners("removeListener");
                    this._events = {};
                    return this;
                }
                listeners = this._events[type];
                if (isFunction(listeners)) {
                    this.removeListener(type, listeners);
                } else if (listeners) {
                    while (listeners.length) this.removeListener(type, listeners[listeners.length - 1]);
                }
                delete this._events[type];
                return this;
            };
            EventEmitter.prototype.listeners = function(type) {
                var ret;
                if (!this._events || !this._events[type]) ret = []; else if (isFunction(this._events[type])) ret = [ this._events[type] ]; else ret = this._events[type].slice();
                return ret;
            };
            EventEmitter.prototype.listenerCount = function(type) {
                if (this._events) {
                    var evlistener = this._events[type];
                    if (isFunction(evlistener)) return 1; else if (evlistener) return evlistener.length;
                }
                return 0;
            };
            EventEmitter.listenerCount = function(emitter, type) {
                return emitter.listenerCount(type);
            };
            function isFunction(arg) {
                return typeof arg === "function";
            }
            function isNumber(arg) {
                return typeof arg === "number";
            }
            function isObject(arg) {
                return typeof arg === "object" && arg !== null;
            }
            function isUndefined(arg) {
                return arg === void 0;
            }
        }, {} ],
        4: [ function(require, module, exports) {
            module.exports = {
                type: require("./json0")
            };
        }, {
            "./json0": undefined
        } ],
        5: [ function(require, module, exports) {
            module.exports = {
                type: require("./text-tp2")
            };
        }, {
            "./text-tp2": undefined
        } ],
        6: [ function(require, module, exports) {
            var type = require("./text");
            type.api = require("./api");
            module.exports = {
                type: type
            };
        }, {
            "./api": undefined,
            "./text": undefined
        } ],
        7: [ function(require, module, exports) {
            (function(global) {
                "use strict";
                var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
                    return typeof obj;
                } : function(obj) {
                    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
                };
                (function(f) {
                    if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === "object" && typeof module !== "undefined") {
                        module.exports = f();
                    } else if (typeof define === "function" && define.amd) {
                        define([], f);
                    } else {
                        var g;
                        if (typeof window !== "undefined") {
                            g = window;
                        } else if (typeof global !== "undefined") {
                            g = global;
                        } else if (typeof self !== "undefined") {
                            g = self;
                        } else {
                            g = this;
                        }
                        g.sharejs = f();
                    }
                })(function() {
                    var define, module, exports;
                    return function e(t, n, r) {
                        function s(o, u) {
                            if (!n[o]) {
                                if (!t[o]) {
                                    var a = typeof require == "function" && require;
                                    if (!u && a) return a(o, !0);
                                    if (i) return i(o, !0);
                                    var f = new Error("Cannot find module '" + o + "'");
                                    throw f.code = "MODULE_NOT_FOUND", f;
                                }
                                var l = n[o] = {
                                    exports: {}
                                };
                                t[o][0].call(l.exports, function(e) {
                                    var n = t[o][1][e];
                                    return s(n ? n : e);
                                }, l, l.exports, e, t, n, r);
                            }
                            return n[o].exports;
                        }
                        var i = typeof require == "function" && require;
                        for (var o = 0; o < r.length; o++) {
                            s(r[o]);
                        }
                        return s;
                    }({
                        1: [ function(require, module, exports) {
                            var Doc = require("./doc").Doc;
                            var Query = require("./query").Query;
                            var emitter = require("./emitter");
                            var Connection = exports.Connection = function(socket) {
                                emitter.EventEmitter.call(this);
                                this.collections = {};
                                this.nextQueryId = 1;
                                this.queries = {};
                                this.state = "disconnected";
                                this.canSend = false;
                                this._retryInterval = null;
                                this.reset();
                                this.debug = false;
                                this.messageBuffer = [];
                                this.bindToSocket(socket);
                            };
                            emitter.mixin(Connection);
                            Connection.prototype.bindToSocket = function(socket) {
                                if (this.socket) {
                                    delete this.socket.onopen;
                                    delete this.socket.onclose;
                                    delete this.socket.onmessage;
                                    delete this.socket.onerror;
                                }
                                this.socket = socket;
                                this.state = socket.readyState === 0 || socket.readyState === 1 ? "connecting" : "disconnected";
                                this.canSend = this.state === "connecting" && socket.canSendWhileConnecting;
                                this._setupRetry();
                                var connection = this;
                                socket.onmessage = function(msg) {
                                    var data = msg.data;
                                    if (!data) data = msg;
                                    if (typeof data === "string") data = JSON.parse(data);
                                    if (connection.debug) console.log("RECV", JSON.stringify(data));
                                    connection.messageBuffer.push({
                                        t: new Date().toTimeString(),
                                        recv: JSON.stringify(data)
                                    });
                                    while (connection.messageBuffer.length > 100) {
                                        connection.messageBuffer.shift();
                                    }
                                    try {
                                        connection.handleMessage(data);
                                    } catch (err) {
                                        connection.emit("error", err, data);
                                    }
                                };
                                socket.onopen = function() {
                                    connection._setState("connecting");
                                };
                                socket.onerror = function(e) {
                                    connection.emit("connection error", e);
                                };
                                socket.onclose = function(reason) {
                                    connection._setState("disconnected", reason);
                                    if (reason === "Closed" || reason === "Stopped by server") {
                                        connection._setState("stopped", reason);
                                    }
                                };
                            };
                            Connection.prototype.handleMessage = function(msg) {
                                switch (msg.a) {
                                  case "init":
                                    if (msg.protocol !== 0) throw new Error("Invalid protocol version");
                                    if (typeof msg.id != "string") throw new Error("Invalid client id");
                                    this.id = msg.id;
                                    this._setState("connected");
                                    break;

                                  case "qfetch":
                                  case "qsub":
                                  case "q":
                                  case "qunsub":
                                    var query = this.queries[msg.id];
                                    if (query) query._onMessage(msg);
                                    break;

                                  case "bs":
                                    var result = msg.s;
                                    for (var cName in result) {
                                        for (var docName in result[cName]) {
                                            var doc = this.get(cName, docName);
                                            if (!doc) {
                                                console.warn("Message for unknown doc. Ignoring.", msg);
                                                break;
                                            }
                                            var msg = result[cName][docName];
                                            if ((typeof msg === "undefined" ? "undefined" : _typeof(msg)) === "object") {
                                                doc._handleSubscribe(msg.error, msg);
                                            } else {
                                                doc._handleSubscribe(null, null);
                                            }
                                        }
                                    }
                                    break;

                                  default:
                                    var doc = this.getExisting(msg.c, msg.d);
                                    if (doc) doc._onMessage(msg);
                                }
                            };
                            Connection.prototype.reset = function() {
                                this.id = null;
                                this.seq = 1;
                            };
                            Connection.prototype._setupRetry = function() {
                                if (!this.canSend) {
                                    clearInterval(this._retryInterval);
                                    this._retryInterval = null;
                                    return;
                                }
                                if (this._retryInterval != null) return;
                                var connection = this;
                                this._retryInterval = setInterval(function() {
                                    for (var collectionName in connection.collections) {
                                        var collection = connection.collections[collectionName];
                                        for (var docName in collection) {
                                            collection[docName].retry();
                                        }
                                    }
                                }, 1e3);
                            };
                            Connection.prototype._setState = function(newState, data) {
                                if (this.state === newState) return;
                                if (newState === "connecting" && this.state !== "disconnected" && this.state !== "stopped" || newState === "connected" && this.state !== "connecting") {
                                    throw new Error("Cannot transition directly from " + this.state + " to " + newState);
                                }
                                this.state = newState;
                                this.canSend = newState === "connecting" && this.socket.canSendWhileConnecting || newState === "connected";
                                this._setupRetry();
                                if (newState === "disconnected") this.reset();
                                this.emit(newState, data);
                                this.bsStart();
                                for (var id in this.queries) {
                                    var query = this.queries[id];
                                    query._onConnectionStateChanged(newState, data);
                                }
                                for (var c in this.collections) {
                                    var collection = this.collections[c];
                                    for (var docName in collection) {
                                        collection[docName]._onConnectionStateChanged(newState, data);
                                    }
                                }
                                this.bsEnd();
                            };
                            Connection.prototype.bsStart = function() {
                                this.subscribeData = this.subscribeData || {};
                            };
                            Connection.prototype.bsEnd = function() {
                                if (hasKeys(this.subscribeData)) {
                                    this.send({
                                        a: "bs",
                                        s: this.subscribeData
                                    });
                                }
                                this.subscribeData = null;
                            };
                            Connection.prototype.sendSubscribe = function(doc, version) {
                                this._addDoc(doc);
                                if (this.subscribeData) {
                                    var data = this.subscribeData;
                                    if (!data[doc.collection]) data[doc.collection] = {};
                                    data[doc.collection][doc.name] = version || null;
                                } else {
                                    var msg = {
                                        a: "sub",
                                        c: doc.collection,
                                        d: doc.name
                                    };
                                    if (version != null) msg.v = version;
                                    this.send(msg);
                                }
                            };
                            Connection.prototype.sendFetch = function(doc, version) {
                                this._addDoc(doc);
                                var msg = {
                                    a: "fetch",
                                    c: doc.collection,
                                    d: doc.name
                                };
                                if (version != null) msg.v = version;
                                this.send(msg);
                            };
                            Connection.prototype.sendUnsubscribe = function(doc) {
                                this._addDoc(doc);
                                var msg = {
                                    a: "unsub",
                                    c: doc.collection,
                                    d: doc.name
                                };
                                this.send(msg);
                            };
                            Connection.prototype.sendOp = function(doc, data) {
                                this._addDoc(doc);
                                var msg = {
                                    a: "op",
                                    c: doc.collection,
                                    d: doc.name,
                                    v: doc.version,
                                    src: data.src,
                                    seq: data.seq
                                };
                                if (data.op) msg.op = data.op;
                                if (data.create) msg.create = data.create;
                                if (data.del) msg.del = data.del;
                                this.send(msg);
                            };
                            Connection.prototype.send = function(msg) {
                                if (this.debug) console.log("SEND", JSON.stringify(msg));
                                this.messageBuffer.push({
                                    t: Date.now(),
                                    send: JSON.stringify(msg)
                                });
                                while (this.messageBuffer.length > 100) {
                                    this.messageBuffer.shift();
                                }
                                if (!this.socket.canSendJSON) {
                                    msg = JSON.stringify(msg);
                                }
                                this.socket.send(msg);
                            };
                            Connection.prototype.disconnect = function() {
                                this.socket.close();
                            };
                            Connection.prototype.getExisting = function(collection, name) {
                                if (this.collections[collection]) return this.collections[collection][name];
                            };
                            Connection.prototype.getOrCreate = function(collection, name, data) {
                                console.trace("getOrCreate is deprecated. Use get() instead");
                                return this.get(collection, name, data);
                            };
                            Connection.prototype.get = function(collection, name, data) {
                                var collectionObject = this.collections[collection];
                                if (!collectionObject) collectionObject = this.collections[collection] = {};
                                var doc = collectionObject[name];
                                if (!doc) {
                                    doc = collectionObject[name] = new Doc(this, collection, name);
                                    this.emit("doc", doc);
                                }
                                if (data && data.data !== undefined && !doc.state) {
                                    doc.ingestData(data);
                                }
                                return doc;
                            };
                            Connection.prototype._destroyDoc = function(doc) {
                                var collectionObject = this.collections[doc.collection];
                                if (!collectionObject) return;
                                delete collectionObject[doc.name];
                                if (!hasKeys(collectionObject)) delete this.collections[doc.collection];
                            };
                            Connection.prototype._addDoc = function(doc) {
                                var collectionObject = this.collections[doc.collection];
                                if (!collectionObject) {
                                    collectionObject = this.collections[doc.collection] = {};
                                }
                                if (collectionObject[doc.name] !== doc) {
                                    collectionObject[doc.name] = doc;
                                }
                            };
                            function hasKeys(object) {
                                for (var key in object) {
                                    return true;
                                }
                                return false;
                            }
                            Connection.prototype._createQuery = function(type, collection, q, options, callback) {
                                if (type !== "fetch" && type !== "sub") throw new Error("Invalid query type: " + type);
                                if (!options) options = {};
                                var id = this.nextQueryId++;
                                var query = new Query(type, this, id, collection, q, options, callback);
                                this.queries[id] = query;
                                query._execute();
                                return query;
                            };
                            Connection.prototype._destroyQuery = function(query) {
                                delete this.queries[query.id];
                            };
                            Connection.prototype.createFetchQuery = function(index, q, options, callback) {
                                return this._createQuery("fetch", index, q, options, callback);
                            };
                            Connection.prototype.createSubscribeQuery = function(index, q, options, callback) {
                                return this._createQuery("sub", index, q, options, callback);
                            };
                        }, {
                            "./doc": 2,
                            "./emitter": 3,
                            "./query": 5
                        } ],
                        2: [ function(require, module, exports) {
                            var types = require("../types").ottypes;
                            var emitter = require("./emitter");
                            var Doc = exports.Doc = function(connection, collection, name) {
                                emitter.EventEmitter.call(this);
                                this.connection = connection;
                                this.collection = collection;
                                this.name = name;
                                this.version = this.type = null;
                                this.snapshot = undefined;
                                this.action = null;
                                this.state = null;
                                this.subscribed = false;
                                this.wantSubscribe = false;
                                this._subscribeCallbacks = [];
                                this.provides = {};
                                this.editingContexts = [];
                                this.inflightData = null;
                                this.pendingData = [];
                                this.type = null;
                                this._getLatestTimeout = null;
                            };
                            emitter.mixin(Doc);
                            Doc.prototype.destroy = function(callback) {
                                var doc = this;
                                this.unsubscribe(function() {
                                    if (doc.hasPending()) {
                                        doc.once("nothing pending", function() {
                                            doc.connection._destroyDoc(doc);
                                        });
                                    } else {
                                        doc.connection._destroyDoc(doc);
                                    }
                                    doc.removeContexts();
                                    if (callback) callback();
                                });
                            };
                            Doc.prototype._setType = function(newType) {
                                if (typeof newType === "string") {
                                    if (!types[newType]) throw new Error("Missing type " + newType + " " + this.collection + " " + this.name);
                                    newType = types[newType];
                                }
                                this.removeContexts();
                                this.type = newType;
                                if (!newType) {
                                    this.provides = {};
                                    this.snapshot = undefined;
                                } else if (newType.api) {
                                    this.provides = newType.api.provides;
                                }
                            };
                            Doc.prototype.ingestData = function(data) {
                                if (typeof data.v !== "number") {
                                    throw new Error("Missing version in ingested data " + this.collection + " " + this.name);
                                }
                                if (this.state) {
                                    if (this.version >= data.v) return;
                                    console.warn("Ignoring ingest data for", this.collection, this.name, "\n  in state:", this.state, "\n  version:", this.version, "\n  snapshot:\n", this.snapshot, "\n  incoming data:\n", data);
                                    return;
                                }
                                this.version = data.v;
                                this.snapshot = data.data;
                                this._setType(data.type);
                                this.state = "ready";
                                this.emit("ready");
                            };
                            Doc.prototype.getSnapshot = function() {
                                return this.snapshot;
                            };
                            Doc.prototype.whenReady = function(fn) {
                                if (this.state === "ready") {
                                    fn();
                                } else {
                                    this.once("ready", fn);
                                }
                            };
                            Doc.prototype.hasPending = function() {
                                return this.action != null || this.inflightData != null || !!this.pendingData.length;
                            };
                            Doc.prototype._emitNothingPending = function() {
                                if (this.hasPending()) return;
                                this.emit("nothing pending");
                            };
                            Doc.prototype._handleSubscribe = function(err, data) {
                                if (err && err !== "Already subscribed") {
                                    console.error("Could not subscribe:", err, this.collection, this.name);
                                    this.emit("error", err);
                                    this._setWantSubscribe(false, null, err);
                                    return;
                                }
                                if (data) this.ingestData(data);
                                this.subscribed = true;
                                this._clearAction();
                                this.emit("subscribe");
                                this._finishSub();
                            };
                            Doc.prototype._onMessage = function(msg) {
                                if (!(msg.c === this.collection && msg.d === this.name)) {
                                    var err = "Got message for wrong document.";
                                    console.error(err, this.collection, this.name, msg);
                                    throw new Error(err);
                                }
                                switch (msg.a) {
                                  case "fetch":
                                    if (msg.data) this.ingestData(msg.data);
                                    if (this.wantSubscribe === "fetch") this.wantSubscribe = false;
                                    this._clearAction();
                                    this._finishSub(msg.error);
                                    break;

                                  case "sub":
                                    this._handleSubscribe(msg.error, msg.data);
                                    break;

                                  case "unsub":
                                    this.subscribed = false;
                                    this.emit("unsubscribe");
                                    this._clearAction();
                                    this._finishSub(msg.error);
                                    break;

                                  case "ack":
                                    if (msg.error && msg.error !== "Op already submitted") {
                                        if (this.inflightData) {
                                            console.warn("Operation was rejected (" + msg.error + "). Trying to rollback change locally.");
                                            this._tryRollback(this.inflightData);
                                            this._clearInflightOp(msg.error);
                                        } else {
                                            console.warn("Second acknowledgement message (error) received", msg, this);
                                        }
                                    }
                                    break;

                                  case "op":
                                    if (this.inflightData && msg.src === this.inflightData.src && msg.seq === this.inflightData.seq) {
                                        this._opAcknowledged(msg);
                                        break;
                                    }
                                    if (this.version == null || msg.v > this.version) {
                                        this._getLatestOps();
                                        break;
                                    }
                                    if (msg.v < this.version) {
                                        break;
                                    }
                                    if (this.inflightData) xf(this.inflightData, msg);
                                    for (var i = 0; i < this.pendingData.length; i++) {
                                        xf(this.pendingData[i], msg);
                                    }
                                    this.version++;
                                    this._otApply(msg, false);
                                    break;

                                  case "meta":
                                    console.warn("Unhandled meta op:", msg);
                                    break;

                                  default:
                                    console.warn("Unhandled document message:", msg);
                                    break;
                                }
                            };
                            Doc.prototype._getLatestOps = function() {
                                var doc = this;
                                var debounced = false;
                                if (doc._getLatestTimeout) {
                                    debounced = true;
                                } else {
                                    doc.connection.sendFetch(doc, doc.version);
                                }
                                clearTimeout(doc._getLatestTimeout);
                                doc._getLatestTimeout = setTimeout(function() {
                                    doc._getLatestTimeout = null;
                                    if (debounced) {
                                        doc.connection.sendFetch(doc, doc.version);
                                    }
                                }, 5e3);
                                return;
                            };
                            Doc.prototype._onConnectionStateChanged = function() {
                                if (this.connection.canSend) {
                                    this.flush();
                                } else {
                                    this.subscribed = false;
                                    this._clearAction();
                                }
                            };
                            Doc.prototype._clearAction = function() {
                                this.action = null;
                                this.flush();
                                this._emitNothingPending();
                            };
                            Doc.prototype.flush = function() {
                                if (!this.connection.canSend || this.inflightData) return;
                                var opData;
                                while (this.pendingData.length && isNoOp(opData = this.pendingData[0])) {
                                    var callbacks = opData.callbacks;
                                    for (var i = 0; i < callbacks.length; i++) {
                                        callbacks[i](opData.error);
                                    }
                                    this.pendingData.shift();
                                }
                                if (!this.paused && this.pendingData.length) {
                                    this._sendOpData();
                                    return;
                                }
                                if (this.action) return;
                                var version = this.state === "ready" ? this.version : null;
                                if (this.subscribed && !this.wantSubscribe) {
                                    this.action = "unsubscribe";
                                    this.connection.sendUnsubscribe(this);
                                } else if (!this.subscribed && this.wantSubscribe === "fetch") {
                                    this.action = "fetch";
                                    this.connection.sendFetch(this, version);
                                } else if (!this.subscribed && this.wantSubscribe) {
                                    this.action = "subscribe";
                                    this.connection.sendSubscribe(this, version);
                                }
                            };
                            Doc.prototype._setWantSubscribe = function(value, callback, err) {
                                if (this.subscribed === this.wantSubscribe && (this.subscribed === value || value === "fetch" && this.subscribed)) {
                                    if (callback) callback(err);
                                    return;
                                }
                                if (value !== "fetch" || this.wantSubscribe !== true) {
                                    this.wantSubscribe = value;
                                }
                                if (callback) this._subscribeCallbacks.push(callback);
                                this.flush();
                            };
                            Doc.prototype.subscribe = function(callback) {
                                this._setWantSubscribe(true, callback);
                            };
                            Doc.prototype.unsubscribe = function(callback) {
                                this._setWantSubscribe(false, callback);
                            };
                            Doc.prototype.fetch = function(callback) {
                                this._setWantSubscribe("fetch", callback);
                            };
                            Doc.prototype._finishSub = function(err) {
                                if (!this._subscribeCallbacks.length) return;
                                for (var i = 0; i < this._subscribeCallbacks.length; i++) {
                                    this._subscribeCallbacks[i](err);
                                }
                                this._subscribeCallbacks.length = 0;
                            };
                            var setNoOp = function setNoOp(opData) {
                                delete opData.op;
                                delete opData.create;
                                delete opData.del;
                            };
                            var isNoOp = function isNoOp(opData) {
                                return !opData.op && !opData.create && !opData.del;
                            };
                            var tryCompose = function tryCompose(type, data1, data2) {
                                if (data1.create && data2.del) {
                                    setNoOp(data1);
                                } else if (data1.create && data2.op) {
                                    var data = data1.create.data === undefined ? type.create() : data1.create.data;
                                    data1.create.data = type.apply(data, data2.op);
                                } else if (isNoOp(data1)) {
                                    data1.create = data2.create;
                                    data1.del = data2.del;
                                    data1.op = data2.op;
                                } else if (data1.op && data2.op && type.compose) {
                                    data1.op = type.compose(data1.op, data2.op);
                                } else {
                                    return false;
                                }
                                return true;
                            };
                            var xf = function xf(client, server) {
                                if (server.create || server.del) return setNoOp(client);
                                if (client.create) throw new Error("Invalid state. This is a bug. " + this.collection + " " + this.name);
                                if (client.del) return setNoOp(server);
                                if (!server.op || !client.op) return;
                                if (client.type.transformX) {
                                    var result = client.type.transformX(client.op, server.op);
                                    client.op = result[0];
                                    server.op = result[1];
                                } else {
                                    var _c = client.type.transform(client.op, server.op, "left");
                                    var _s = client.type.transform(server.op, client.op, "right");
                                    client.op = _c;
                                    server.op = _s;
                                }
                            };
                            Doc.prototype._otApply = function(opData, context) {
                                this.locked = true;
                                if (opData.create) {
                                    var create = opData.create;
                                    this._setType(create.type);
                                    this.snapshot = this.type.create(create.data);
                                    this.once("unlock", function() {
                                        this.emit("create", context);
                                    });
                                } else if (opData.del) {
                                    var oldSnapshot = this.snapshot;
                                    this._setType(null);
                                    this.once("unlock", function() {
                                        this.emit("del", context, oldSnapshot);
                                    });
                                } else if (opData.op) {
                                    if (!this.type) throw new Error("Document does not exist. " + this.collection + " " + this.name);
                                    var type = this.type;
                                    var op = opData.op;
                                    for (var i = 0; i < this.editingContexts.length; i++) {
                                        var c = this.editingContexts[i];
                                        if (c != context && c._beforeOp) c._beforeOp(opData.op);
                                    }
                                    this.emit("before op", op, context);
                                    if (this.incremental && type.incrementalApply) {
                                        var _this = this;
                                        type.incrementalApply(this.snapshot, op, function(o, snapshot) {
                                            _this.snapshot = snapshot;
                                            _this.emit("op", o, context);
                                        });
                                    } else {
                                        this.snapshot = type.apply(this.snapshot, op);
                                        this.emit("op", op, context);
                                    }
                                }
                                this.locked = false;
                                this.emit("unlock");
                                if (opData.op) {
                                    var contexts = this.editingContexts;
                                    for (var i = 0; i < contexts.length; i++) {
                                        var c = contexts[i];
                                        if (c != context && c._onOp) c._onOp(opData.op);
                                    }
                                    for (var i = 0; i < contexts.length; i++) {
                                        if (contexts[i].shouldBeRemoved) contexts.splice(i--, 1);
                                    }
                                    return this.emit("after op", opData.op, context);
                                }
                            };
                            Doc.prototype.retry = function() {
                                if (!this.inflightData) return;
                                var threshold = 5e3 * Math.pow(2, this.inflightData.retries);
                                if (this.inflightData.sentAt < Date.now() - threshold) {
                                    this.connection.emit("retry", this);
                                    this._sendOpData();
                                }
                            };
                            Doc.prototype._sendOpData = function() {
                                var src = this.connection.id;
                                if (!src) return;
                                if (!this.inflightData) {
                                    this.inflightData = this.pendingData.shift();
                                }
                                var data = this.inflightData;
                                if (!data) {
                                    throw new Error("no data to send on call to _sendOpData");
                                }
                                data.sentAt = Date.now();
                                data.retries = data.retries == null ? 0 : data.retries + 1;
                                if (data.seq == null) data.seq = this.connection.seq++;
                                this.connection.sendOp(this, data);
                                if (data.src == null) data.src = src;
                            };
                            Doc.prototype._submitOpData = function(opData, context, callback) {
                                if (typeof context === "function") {
                                    callback = context;
                                    context = true;
                                }
                                if (context == null) context = true;
                                if (this.locked) {
                                    var err = "Cannot call submitOp from inside an 'op' event handler. " + this.collection + " " + this.name;
                                    if (callback) return callback(err);
                                    throw new Error(err);
                                }
                                if (opData.op) {
                                    if (!this.type) {
                                        var err = "Document has not been created";
                                        if (callback) return callback(err);
                                        throw new Error(err);
                                    }
                                    if (this.type.normalize) opData.op = this.type.normalize(opData.op);
                                }
                                if (!this.state) {
                                    this.state = "floating";
                                }
                                opData.type = this.type;
                                opData.callbacks = [];
                                var operation;
                                var previous = this.pendingData[this.pendingData.length - 1];
                                if (previous && tryCompose(this.type, previous, opData)) {
                                    operation = previous;
                                } else {
                                    operation = opData;
                                    this.pendingData.push(opData);
                                }
                                if (callback) operation.callbacks.push(callback);
                                this._otApply(opData, context);
                                var _this = this;
                                setTimeout(function() {
                                    _this.flush();
                                }, 0);
                            };
                            Doc.prototype.submitOp = function(op, context, callback) {
                                this._submitOpData({
                                    op: op
                                }, context, callback);
                            };
                            Doc.prototype.create = function(type, data, context, callback) {
                                if (typeof data === "function") {
                                    context = data;
                                    data = undefined;
                                }
                                if (this.type) {
                                    var err = "Document already exists";
                                    if (callback) return callback(err);
                                    throw new Error(err);
                                }
                                var op = {
                                    create: {
                                        type: type,
                                        data: data
                                    }
                                };
                                this._submitOpData(op, context, callback);
                            };
                            Doc.prototype.del = function(context, callback) {
                                if (!this.type) {
                                    var err = "Document does not exist";
                                    if (callback) return callback(err);
                                    throw new Error(err);
                                }
                                this._submitOpData({
                                    del: true
                                }, context, callback);
                            };
                            Doc.prototype.pause = function() {
                                this.paused = true;
                            };
                            Doc.prototype.resume = function() {
                                this.paused = false;
                                this.flush();
                            };
                            Doc.prototype._tryRollback = function(opData) {
                                if (opData.create) {
                                    this._setType(null);
                                    if (this.state === "floating") this.state = null; else console.warn("Rollback a create from state " + this.state);
                                } else if (opData.op && opData.type.invert) {
                                    opData.op = opData.type.invert(opData.op);
                                    for (var i = 0; i < this.pendingData.length; i++) {
                                        xf(this.pendingData[i], opData);
                                    }
                                    this._otApply(opData, false);
                                } else if (opData.op || opData.del) {
                                    this._setType(null);
                                    this.version = null;
                                    this.state = null;
                                    this.subscribed = false;
                                    this.emit("error", "Op apply failed and the operation could not be reverted");
                                    this.fetch();
                                    this.flush();
                                }
                            };
                            Doc.prototype._clearInflightOp = function(error) {
                                var callbacks = this.inflightData.callbacks;
                                for (var i = 0; i < callbacks.length; i++) {
                                    callbacks[i](error || this.inflightData.error);
                                }
                                this.inflightData = null;
                                this.flush();
                                this._emitNothingPending();
                            };
                            Doc.prototype._opAcknowledged = function(msg) {
                                if (!this.state) {
                                    throw new Error("opAcknowledged called from a null state. This should never happen. " + this.collection + " " + this.name);
                                } else if (this.state === "floating") {
                                    if (!this.inflightData.create) throw new Error("Cannot acknowledge an op. " + this.collection + " " + this.name);
                                    this.version = msg.v;
                                    this.state = "ready";
                                    var _this = this;
                                    setTimeout(function() {
                                        _this.emit("ready");
                                    }, 0);
                                } else {
                                    if (msg.v !== this.version) {
                                        console.warn("Invalid version from server. This can happen when you submit ops in a submitOp callback. Expected: " + this.version + " Message version: " + msg.v + " " + this.collection + " " + this.name);
                                        return this.fetch();
                                    }
                                }
                                this.version++;
                                this._clearInflightOp();
                            };
                            Doc.prototype.createContext = function() {
                                var type = this.type;
                                if (!type) throw new Error("Missing type " + this.collection + " " + this.name);
                                var doc = this;
                                var context = {
                                    getSnapshot: function getSnapshot() {
                                        return doc.snapshot;
                                    },
                                    submitOp: function submitOp(op, callback) {
                                        doc.submitOp(op, context, callback);
                                    },
                                    destroy: function destroy() {
                                        if (this.detach) {
                                            this.detach();
                                            delete this.detach;
                                        }
                                        delete this._onOp;
                                        this.shouldBeRemoved = true;
                                    },
                                    _doc: this
                                };
                                if (type.api) {
                                    for (var k in type.api) {
                                        context[k] = type.api[k];
                                    }
                                } else {
                                    context.provides = {};
                                }
                                this.editingContexts.push(context);
                                return context;
                            };
                            Doc.prototype.removeContexts = function() {
                                for (var i = 0; i < this.editingContexts.length; i++) {
                                    this.editingContexts[i].destroy();
                                }
                                this.editingContexts.length = 0;
                            };
                        }, {
                            "../types": 7,
                            "./emitter": 3
                        } ],
                        3: [ function(require, module, exports) {
                            var EventEmitter = require("events").EventEmitter;
                            exports.EventEmitter = EventEmitter;
                            exports.mixin = mixin;
                            function mixin(Constructor) {
                                for (var key in EventEmitter.prototype) {
                                    Constructor.prototype[key] = EventEmitter.prototype[key];
                                }
                            }
                        }, {
                            events: 10
                        } ],
                        4: [ function(require, module, exports) {
                            exports.Connection = require("./connection").Connection;
                            exports.Doc = require("./doc").Doc;
                            require("./textarea");
                            var types = require("../types");
                            exports.ottypes = types.ottypes;
                            exports.registerType = types.registerType;
                        }, {
                            "../types": 7,
                            "./connection": 1,
                            "./doc": 2,
                            "./textarea": 6
                        } ],
                        5: [ function(require, module, exports) {
                            var emitter = require("./emitter");
                            var Query = exports.Query = function(type, connection, id, collection, query, options, callback) {
                                emitter.EventEmitter.call(this);
                                this.type = type;
                                this.connection = connection;
                                this.id = id;
                                this.collection = collection;
                                this.query = query;
                                this.docMode = options.docMode;
                                if (this.docMode === "subscribe") this.docMode = "sub";
                                this.poll = options.poll;
                                this.backend = options.backend || options.source;
                                this.knownDocs = options.knownDocs || [];
                                this.results = [];
                                this.ready = false;
                                this.callback = callback;
                            };
                            emitter.mixin(Query);
                            Query.prototype.action = "qsub";
                            Query.prototype._execute = function() {
                                if (!this.connection.canSend) return;
                                if (this.docMode) {
                                    var collectionVersions = {};
                                    for (var i = 0; i < this.knownDocs.length; i++) {
                                        var doc = this.knownDocs[i];
                                        if (doc.version == null) continue;
                                        var c = collectionVersions[doc.collection] = collectionVersions[doc.collection] || {};
                                        c[doc.name] = doc.version;
                                    }
                                }
                                var msg = {
                                    a: "q" + this.type,
                                    id: this.id,
                                    c: this.collection,
                                    o: {},
                                    q: this.query
                                };
                                if (this.docMode) {
                                    msg.o.m = this.docMode;
                                    msg.o.vs = collectionVersions;
                                }
                                if (this.backend != null) msg.o.b = this.backend;
                                if (this.poll !== undefined) msg.o.p = this.poll;
                                this.connection.send(msg);
                            };
                            Query.prototype._dataToDocs = function(data) {
                                var results = [];
                                var lastType;
                                for (var i = 0; i < data.length; i++) {
                                    var docData = data[i];
                                    if (docData.type) {
                                        lastType = docData.type;
                                    } else {
                                        docData.type = lastType;
                                    }
                                    var doc = this.connection.get(docData.c || this.collection, docData.d, docData);
                                    results.push(doc);
                                }
                                return results;
                            };
                            Query.prototype.destroy = function() {
                                if (this.connection.canSend && this.type === "sub") {
                                    this.connection.send({
                                        a: "qunsub",
                                        id: this.id
                                    });
                                }
                                this.connection._destroyQuery(this);
                            };
                            Query.prototype._onConnectionStateChanged = function(state, reason) {
                                if (this.connection.state === "connecting") {
                                    this._execute();
                                }
                            };
                            Query.prototype._onMessage = function(msg) {
                                if (msg.a === "qfetch" !== (this.type === "fetch")) {
                                    console.warn("Invalid message sent to query", msg, this);
                                    return;
                                }
                                if (msg.error) this.emit("error", msg.error);
                                switch (msg.a) {
                                  case "qfetch":
                                    var results = msg.data ? this._dataToDocs(msg.data) : undefined;
                                    if (this.callback) this.callback(msg.error, results, msg.extra);
                                    this.connection._destroyQuery(this);
                                    break;

                                  case "q":
                                    if (msg.diff) {
                                        for (var i = 0; i < msg.diff.length; i++) {
                                            var d = msg.diff[i];
                                            if (d.type === "insert") d.values = this._dataToDocs(d.values);
                                        }
                                        for (var i = 0; i < msg.diff.length; i++) {
                                            var d = msg.diff[i];
                                            switch (d.type) {
                                              case "insert":
                                                var newDocs = d.values;
                                                Array.prototype.splice.apply(this.results, [ d.index, 0 ].concat(newDocs));
                                                this.emit("insert", newDocs, d.index);
                                                break;

                                              case "remove":
                                                var howMany = d.howMany || 1;
                                                var removed = this.results.splice(d.index, howMany);
                                                this.emit("remove", removed, d.index);
                                                break;

                                              case "move":
                                                var howMany = d.howMany || 1;
                                                var docs = this.results.splice(d.from, howMany);
                                                Array.prototype.splice.apply(this.results, [ d.to, 0 ].concat(docs));
                                                this.emit("move", docs, d.from, d.to);
                                                break;
                                            }
                                        }
                                    }
                                    if (msg.extra !== void 0) {
                                        this.emit("extra", msg.extra);
                                    }
                                    break;

                                  case "qsub":
                                    if (!msg.error) {
                                        var previous = this.results;
                                        this.results = this.knownDocs = this._dataToDocs(msg.data);
                                        this.extra = msg.extra;
                                        this.ready = true;
                                        this.emit("change", this.results, previous);
                                    }
                                    if (this.callback) {
                                        this.callback(msg.error, this.results, this.extra);
                                        delete this.callback;
                                    }
                                    break;
                                }
                            };
                            Query.prototype.setQuery = function(q) {
                                if (this.type !== "sub") throw new Error("cannot change a fetch query");
                                this.query = q;
                                if (this.connection.canSend) {
                                    this.connection.send({
                                        a: "qunsub",
                                        id: this.id
                                    });
                                    this._execute();
                                }
                            };
                        }, {
                            "./emitter": 3
                        } ],
                        6: [ function(require, module, exports) {
                            var Doc = require("./doc").Doc;
                            var applyChange = function applyChange(ctx, oldval, newval) {
                                if (oldval === newval) return;
                                var commonStart = 0;
                                while (oldval.charAt(commonStart) === newval.charAt(commonStart)) {
                                    commonStart++;
                                }
                                var commonEnd = 0;
                                while (oldval.charAt(oldval.length - 1 - commonEnd) === newval.charAt(newval.length - 1 - commonEnd) && commonEnd + commonStart < oldval.length && commonEnd + commonStart < newval.length) {
                                    commonEnd++;
                                }
                                if (oldval.length !== commonStart + commonEnd) {
                                    ctx.remove(commonStart, oldval.length - commonStart - commonEnd);
                                }
                                if (newval.length !== commonStart + commonEnd) {
                                    ctx.insert(commonStart, newval.slice(commonStart, newval.length - commonEnd));
                                }
                            };
                            Doc.prototype.attachTextarea = function(elem, ctx) {
                                if (!ctx) ctx = this.createContext();
                                if (!ctx.provides.text) throw new Error("Cannot attach to non-text document");
                                elem.value = ctx.get();
                                var prevvalue;
                                var replaceText = function replaceText(newText, transformCursor) {
                                    if (transformCursor) {
                                        var newSelection = [ transformCursor(elem.selectionStart), transformCursor(elem.selectionEnd) ];
                                    }
                                    var scrollTop = elem.scrollTop;
                                    elem.value = newText;
                                    prevvalue = elem.value;
                                    if (elem.scrollTop !== scrollTop) elem.scrollTop = scrollTop;
                                    if (newSelection && window.document.activeElement === elem) {
                                        elem.selectionStart = newSelection[0];
                                        elem.selectionEnd = newSelection[1];
                                    }
                                };
                                replaceText(ctx.get());
                                ctx.onInsert = function(pos, text) {
                                    var transformCursor = function transformCursor(cursor) {
                                        return pos < cursor ? cursor + text.length : cursor;
                                    };
                                    var prev = elem.value.replace(/\r\n/g, "\n");
                                    replaceText(prev.slice(0, pos) + text + prev.slice(pos), transformCursor);
                                };
                                ctx.onRemove = function(pos, length) {
                                    var transformCursor = function transformCursor(cursor) {
                                        return pos < cursor ? cursor - Math.min(length, cursor - pos) : cursor;
                                    };
                                    var prev = elem.value.replace(/\r\n/g, "\n");
                                    replaceText(prev.slice(0, pos) + prev.slice(pos + length), transformCursor);
                                };
                                var genOp = function genOp(event) {
                                    setTimeout(function() {
                                        if (elem.value !== prevvalue) {
                                            prevvalue = elem.value;
                                            applyChange(ctx, ctx.get(), elem.value.replace(/\r\n/g, "\n"));
                                        }
                                    }, 0);
                                };
                                var eventNames = [ "textInput", "keydown", "keyup", "select", "cut", "paste" ];
                                for (var i = 0; i < eventNames.length; i++) {
                                    var e = eventNames[i];
                                    if (elem.addEventListener) {
                                        elem.addEventListener(e, genOp, false);
                                    } else {
                                        elem.attachEvent("on" + e, genOp);
                                    }
                                }
                                ctx.detach = function() {
                                    for (var i = 0; i < eventNames.length; i++) {
                                        var e = eventNames[i];
                                        if (elem.removeEventListener) {
                                            elem.removeEventListener(e, genOp, false);
                                        } else {
                                            elem.detachEvent("on" + e, genOp);
                                        }
                                    }
                                };
                                return ctx;
                            };
                        }, {
                            "./doc": 2
                        } ],
                        7: [ function(require, module, exports) {
                            exports.ottypes = {};
                            exports.registerType = function(type) {
                                if (type.name) exports.ottypes[type.name] = type;
                                if (type.uri) exports.ottypes[type.uri] = type;
                            };
                            exports.registerType(require("ot-json0").type);
                            exports.registerType(require("ot-text").type);
                            exports.registerType(require("ot-text-tp2").type);
                            require("./text-api");
                            require("./text-tp2-api");
                        }, {
                            "./text-api": 8,
                            "./text-tp2-api": 9,
                            "ot-json0": 12,
                            "ot-text": 18,
                            "ot-text-tp2": 15
                        } ],
                        8: [ function(require, module, exports) {
                            var type = require("ot-text").type;
                            type.api = {
                                provides: {
                                    text: true
                                },
                                getLength: function getLength() {
                                    return this.getSnapshot().length;
                                },
                                get: function get() {
                                    return this.getSnapshot();
                                },
                                getText: function getText() {
                                    console.warn("`getText()` is deprecated; use `get()` instead.");
                                    return this.get();
                                },
                                insert: function insert(pos, text, callback) {
                                    return this.submitOp([ pos, text ], callback);
                                },
                                remove: function remove(pos, length, callback) {
                                    return this.submitOp([ pos, {
                                        d: length
                                    } ], callback);
                                },
                                _onOp: function _onOp(op) {
                                    var pos = 0;
                                    var spos = 0;
                                    for (var i = 0; i < op.length; i++) {
                                        var component = op[i];
                                        switch (typeof component === "undefined" ? "undefined" : _typeof(component)) {
                                          case "number":
                                            pos += component;
                                            spos += component;
                                            break;

                                          case "string":
                                            if (this.onInsert) this.onInsert(pos, component);
                                            pos += component.length;
                                            break;

                                          case "object":
                                            if (this.onRemove) this.onRemove(pos, component.d);
                                            spos += component.d;
                                        }
                                    }
                                }
                            };
                        }, {
                            "ot-text": 18
                        } ],
                        9: [ function(require, module, exports) {
                            var type = require("ot-text-tp2").type;
                            var takeDoc = type._takeDoc;
                            var append = type._append;
                            var appendSkipChars = function appendSkipChars(op, doc, pos, maxlength) {
                                while ((maxlength == null || maxlength > 0) && pos.index < doc.data.length) {
                                    var part = takeDoc(doc, pos, maxlength, true);
                                    if (maxlength != null && typeof part === "string") {
                                        maxlength -= part.length;
                                    }
                                    append(op, part.length || part);
                                }
                            };
                            type.api = {
                                provides: {
                                    text: true
                                },
                                getLength: function getLength() {
                                    return this.getSnapshot().charLength;
                                },
                                get: function get() {
                                    var snapshot = this.getSnapshot();
                                    var strings = [];
                                    for (var i = 0; i < snapshot.data.length; i++) {
                                        var elem = snapshot.data[i];
                                        if (typeof elem == "string") {
                                            strings.push(elem);
                                        }
                                    }
                                    return strings.join("");
                                },
                                getText: function getText() {
                                    console.warn("`getText()` is deprecated; use `get()` instead.");
                                    return this.get();
                                },
                                insert: function insert(pos, text, callback) {
                                    if (pos == null) pos = 0;
                                    var op = [];
                                    var docPos = {
                                        index: 0,
                                        offset: 0
                                    };
                                    var snapshot = this.getSnapshot();
                                    appendSkipChars(op, snapshot, docPos, pos);
                                    append(op, {
                                        i: text
                                    });
                                    appendSkipChars(op, snapshot, docPos);
                                    this.submitOp(op, callback);
                                    return op;
                                },
                                remove: function remove(pos, len, callback) {
                                    var op = [];
                                    var docPos = {
                                        index: 0,
                                        offset: 0
                                    };
                                    var snapshot = this.getSnapshot();
                                    appendSkipChars(op, snapshot, docPos, pos);
                                    while (len > 0) {
                                        var part = takeDoc(snapshot, docPos, len, true);
                                        if (typeof part === "string") {
                                            append(op, {
                                                d: part.length
                                            });
                                            len -= part.length;
                                        } else {
                                            append(op, part);
                                        }
                                    }
                                    appendSkipChars(op, snapshot, docPos);
                                    this.submitOp(op, callback);
                                    return op;
                                },
                                _beforeOp: function _beforeOp() {
                                    this.__prevSnapshot = this.getSnapshot();
                                },
                                _onOp: function _onOp(op) {
                                    var textPos = 0;
                                    var docPos = {
                                        index: 0,
                                        offset: 0
                                    };
                                    var prevSnapshot = this.__prevSnapshot;
                                    for (var i = 0; i < op.length; i++) {
                                        var component = op[i];
                                        var part, remainder;
                                        if (typeof component == "number") {
                                            for (remainder = component; remainder > 0; remainder -= part.length || part) {
                                                part = takeDoc(prevSnapshot, docPos, remainder);
                                                if (typeof part === "string") textPos += part.length;
                                            }
                                        } else if (component.i != null) {
                                            if (typeof component.i == "string") {
                                                if (this.onInsert) this.onInsert(textPos, component.i);
                                                textPos += component.i.length;
                                            }
                                        } else {
                                            for (remainder = component.d; remainder > 0; remainder -= part.length || part) {
                                                part = takeDoc(prevSnapshot, docPos, remainder);
                                                if (typeof part == "string" && this.onRemove) this.onRemove(textPos, part.length);
                                            }
                                        }
                                    }
                                }
                            };
                        }, {
                            "ot-text-tp2": 15
                        } ],
                        10: [ function(require, module, exports) {
                            function EventEmitter() {
                                this._events = this._events || {};
                                this._maxListeners = this._maxListeners || undefined;
                            }
                            module.exports = EventEmitter;
                            EventEmitter.EventEmitter = EventEmitter;
                            EventEmitter.prototype._events = undefined;
                            EventEmitter.prototype._maxListeners = undefined;
                            EventEmitter.defaultMaxListeners = 10;
                            EventEmitter.prototype.setMaxListeners = function(n) {
                                if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError("n must be a positive number");
                                this._maxListeners = n;
                                return this;
                            };
                            EventEmitter.prototype.emit = function(type) {
                                var er, handler, len, args, i, listeners;
                                if (!this._events) this._events = {};
                                if (type === "error") {
                                    if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
                                        er = arguments[1];
                                        if (er instanceof Error) {
                                            throw er;
                                        }
                                        throw TypeError('Uncaught, unspecified "error" event.');
                                    }
                                }
                                handler = this._events[type];
                                if (isUndefined(handler)) return false;
                                if (isFunction(handler)) {
                                    switch (arguments.length) {
                                      case 1:
                                        handler.call(this);
                                        break;

                                      case 2:
                                        handler.call(this, arguments[1]);
                                        break;

                                      case 3:
                                        handler.call(this, arguments[1], arguments[2]);
                                        break;

                                      default:
                                        len = arguments.length;
                                        args = new Array(len - 1);
                                        for (i = 1; i < len; i++) {
                                            args[i - 1] = arguments[i];
                                        }
                                        handler.apply(this, args);
                                    }
                                } else if (isObject(handler)) {
                                    len = arguments.length;
                                    args = new Array(len - 1);
                                    for (i = 1; i < len; i++) {
                                        args[i - 1] = arguments[i];
                                    }
                                    listeners = handler.slice();
                                    len = listeners.length;
                                    for (i = 0; i < len; i++) {
                                        listeners[i].apply(this, args);
                                    }
                                }
                                return true;
                            };
                            EventEmitter.prototype.addListener = function(type, listener) {
                                var m;
                                if (!isFunction(listener)) throw TypeError("listener must be a function");
                                if (!this._events) this._events = {};
                                if (this._events.newListener) this.emit("newListener", type, isFunction(listener.listener) ? listener.listener : listener);
                                if (!this._events[type]) this._events[type] = listener; else if (isObject(this._events[type])) this._events[type].push(listener); else this._events[type] = [ this._events[type], listener ];
                                if (isObject(this._events[type]) && !this._events[type].warned) {
                                    var m;
                                    if (!isUndefined(this._maxListeners)) {
                                        m = this._maxListeners;
                                    } else {
                                        m = EventEmitter.defaultMaxListeners;
                                    }
                                    if (m && m > 0 && this._events[type].length > m) {
                                        this._events[type].warned = true;
                                        console.error("(node) warning: possible EventEmitter memory " + "leak detected. %d listeners added. " + "Use emitter.setMaxListeners() to increase limit.", this._events[type].length);
                                        if (typeof console.trace === "function") {
                                            console.trace();
                                        }
                                    }
                                }
                                return this;
                            };
                            EventEmitter.prototype.on = EventEmitter.prototype.addListener;
                            EventEmitter.prototype.once = function(type, listener) {
                                if (!isFunction(listener)) throw TypeError("listener must be a function");
                                var fired = false;
                                function g() {
                                    this.removeListener(type, g);
                                    if (!fired) {
                                        fired = true;
                                        listener.apply(this, arguments);
                                    }
                                }
                                g.listener = listener;
                                this.on(type, g);
                                return this;
                            };
                            EventEmitter.prototype.removeListener = function(type, listener) {
                                var list, position, length, i;
                                if (!isFunction(listener)) throw TypeError("listener must be a function");
                                if (!this._events || !this._events[type]) return this;
                                list = this._events[type];
                                length = list.length;
                                position = -1;
                                if (list === listener || isFunction(list.listener) && list.listener === listener) {
                                    delete this._events[type];
                                    if (this._events.removeListener) this.emit("removeListener", type, listener);
                                } else if (isObject(list)) {
                                    for (i = length; i-- > 0; ) {
                                        if (list[i] === listener || list[i].listener && list[i].listener === listener) {
                                            position = i;
                                            break;
                                        }
                                    }
                                    if (position < 0) return this;
                                    if (list.length === 1) {
                                        list.length = 0;
                                        delete this._events[type];
                                    } else {
                                        list.splice(position, 1);
                                    }
                                    if (this._events.removeListener) this.emit("removeListener", type, listener);
                                }
                                return this;
                            };
                            EventEmitter.prototype.removeAllListeners = function(type) {
                                var key, listeners;
                                if (!this._events) return this;
                                if (!this._events.removeListener) {
                                    if (arguments.length === 0) this._events = {}; else if (this._events[type]) delete this._events[type];
                                    return this;
                                }
                                if (arguments.length === 0) {
                                    for (key in this._events) {
                                        if (key === "removeListener") continue;
                                        this.removeAllListeners(key);
                                    }
                                    this.removeAllListeners("removeListener");
                                    this._events = {};
                                    return this;
                                }
                                listeners = this._events[type];
                                if (isFunction(listeners)) {
                                    this.removeListener(type, listeners);
                                } else {
                                    while (listeners.length) {
                                        this.removeListener(type, listeners[listeners.length - 1]);
                                    }
                                }
                                delete this._events[type];
                                return this;
                            };
                            EventEmitter.prototype.listeners = function(type) {
                                var ret;
                                if (!this._events || !this._events[type]) ret = []; else if (isFunction(this._events[type])) ret = [ this._events[type] ]; else ret = this._events[type].slice();
                                return ret;
                            };
                            EventEmitter.listenerCount = function(emitter, type) {
                                var ret;
                                if (!emitter._events || !emitter._events[type]) ret = 0; else if (isFunction(emitter._events[type])) ret = 1; else ret = emitter._events[type].length;
                                return ret;
                            };
                            function isFunction(arg) {
                                return typeof arg === "function";
                            }
                            function isNumber(arg) {
                                return typeof arg === "number";
                            }
                            function isObject(arg) {
                                return (typeof arg === "undefined" ? "undefined" : _typeof(arg)) === "object" && arg !== null;
                            }
                            function isUndefined(arg) {
                                return arg === void 0;
                            }
                        }, {} ],
                        11: [ function(require, module, exports) {
                            module.exports = bootstrapTransform;
                            function bootstrapTransform(type, transformComponent, checkValidOp, append) {
                                var transformComponentX = function transformComponentX(left, right, destLeft, destRight) {
                                    transformComponent(destLeft, left, right, "left");
                                    transformComponent(destRight, right, left, "right");
                                };
                                var transformX = type.transformX = function(leftOp, rightOp) {
                                    checkValidOp(leftOp);
                                    checkValidOp(rightOp);
                                    var newRightOp = [];
                                    for (var i = 0; i < rightOp.length; i++) {
                                        var rightComponent = rightOp[i];
                                        var newLeftOp = [];
                                        var k = 0;
                                        while (k < leftOp.length) {
                                            var nextC = [];
                                            transformComponentX(leftOp[k], rightComponent, newLeftOp, nextC);
                                            k++;
                                            if (nextC.length === 1) {
                                                rightComponent = nextC[0];
                                            } else if (nextC.length === 0) {
                                                for (var j = k; j < leftOp.length; j++) {
                                                    append(newLeftOp, leftOp[j]);
                                                }
                                                rightComponent = null;
                                                break;
                                            } else {
                                                var pair = transformX(leftOp.slice(k), nextC);
                                                for (var l = 0; l < pair[0].length; l++) {
                                                    append(newLeftOp, pair[0][l]);
                                                }
                                                for (var r = 0; r < pair[1].length; r++) {
                                                    append(newRightOp, pair[1][r]);
                                                }
                                                rightComponent = null;
                                                break;
                                            }
                                        }
                                        if (rightComponent != null) {
                                            append(newRightOp, rightComponent);
                                        }
                                        leftOp = newLeftOp;
                                    }
                                    return [ leftOp, newRightOp ];
                                };
                                type.transform = function(op, otherOp, type) {
                                    if (!(type === "left" || type === "right")) throw new Error("type must be 'left' or 'right'");
                                    if (otherOp.length === 0) return op;
                                    if (op.length === 1 && otherOp.length === 1) return transformComponent([], op[0], otherOp[0], type);
                                    if (type === "left") return transformX(op, otherOp)[0]; else return transformX(otherOp, op)[1];
                                };
                            }
                        }, {} ],
                        12: [ function(require, module, exports) {
                            module.exports = {
                                type: require("./json0")
                            };
                        }, {
                            "./json0": 13
                        } ],
                        13: [ function(require, module, exports) {
                            var isArray = function isArray(obj) {
                                return Object.prototype.toString.call(obj) == "[object Array]";
                            };
                            var isObject = function isObject(obj) {
                                return !!obj && obj.constructor === Object;
                            };
                            var clone = function clone(o) {
                                return JSON.parse(JSON.stringify(o));
                            };
                            var json = {
                                name: "json0",
                                uri: "http://sharejs.org/types/JSONv0"
                            };
                            var subtypes = {};
                            json.registerSubtype = function(subtype) {
                                subtypes[subtype.name] = subtype;
                            };
                            json.create = function(data) {
                                return data === undefined ? null : clone(data);
                            };
                            json.invertComponent = function(c) {
                                var c_ = {
                                    p: c.p
                                };
                                if (c.t && subtypes[c.t]) {
                                    c_.t = c.t;
                                    c_.o = subtypes[c.t].invert(c.o);
                                }
                                if (c.si !== void 0) c_.sd = c.si;
                                if (c.sd !== void 0) c_.si = c.sd;
                                if (c.oi !== void 0) c_.od = c.oi;
                                if (c.od !== void 0) c_.oi = c.od;
                                if (c.li !== void 0) c_.ld = c.li;
                                if (c.ld !== void 0) c_.li = c.ld;
                                if (c.na !== void 0) c_.na = -c.na;
                                if (c.lm !== void 0) {
                                    c_.lm = c.p[c.p.length - 1];
                                    c_.p = c.p.slice(0, c.p.length - 1).concat([ c.lm ]);
                                }
                                return c_;
                            };
                            json.invert = function(op) {
                                var op_ = op.slice().reverse();
                                var iop = [];
                                for (var i = 0; i < op_.length; i++) {
                                    iop.push(json.invertComponent(op_[i]));
                                }
                                return iop;
                            };
                            json.checkValidOp = function(op) {
                                for (var i = 0; i < op.length; i++) {
                                    if (!isArray(op[i].p)) throw new Error("Missing path");
                                }
                            };
                            json.checkList = function(elem) {
                                if (!isArray(elem)) throw new Error("Referenced element not a list");
                            };
                            json.checkObj = function(elem) {
                                if (!isObject(elem)) {
                                    throw new Error("Referenced element not an object (it was " + JSON.stringify(elem) + ")");
                                }
                            };
                            function convertFromText(c) {
                                c.t = "text0";
                                var o = {
                                    p: c.p.pop()
                                };
                                if (c.si != null) o.i = c.si;
                                if (c.sd != null) o.d = c.sd;
                                c.o = [ o ];
                            }
                            function convertToText(c) {
                                c.p.push(c.o[0].p);
                                if (c.o[0].i != null) c.si = c.o[0].i;
                                if (c.o[0].d != null) c.sd = c.o[0].d;
                                delete c.t;
                                delete c.o;
                            }
                            json.apply = function(snapshot, op) {
                                json.checkValidOp(op);
                                op = clone(op);
                                var container = {
                                    data: snapshot
                                };
                                for (var i = 0; i < op.length; i++) {
                                    var c = op[i];
                                    if (c.si != null || c.sd != null) convertFromText(c);
                                    var parent = null;
                                    var parentKey = null;
                                    var elem = container;
                                    var key = "data";
                                    for (var j = 0; j < c.p.length; j++) {
                                        var p = c.p[j];
                                        parent = elem;
                                        parentKey = key;
                                        elem = elem[key];
                                        key = p;
                                        if (parent == null) throw new Error("Path invalid");
                                    }
                                    if (c.t && c.o !== void 0 && subtypes[c.t]) {
                                        elem[key] = subtypes[c.t].apply(elem[key], c.o);
                                    } else if (c.na !== void 0) {
                                        if (typeof elem[key] != "number") throw new Error("Referenced element not a number");
                                        elem[key] += c.na;
                                    } else if (c.li !== void 0 && c.ld !== void 0) {
                                        json.checkList(elem);
                                        elem[key] = c.li;
                                    } else if (c.li !== void 0) {
                                        json.checkList(elem);
                                        elem.splice(key, 0, c.li);
                                    } else if (c.ld !== void 0) {
                                        json.checkList(elem);
                                        elem.splice(key, 1);
                                    } else if (c.lm !== void 0) {
                                        json.checkList(elem);
                                        if (c.lm != key) {
                                            var e = elem[key];
                                            elem.splice(key, 1);
                                            elem.splice(c.lm, 0, e);
                                        }
                                    } else if (c.oi !== void 0) {
                                        json.checkObj(elem);
                                        elem[key] = c.oi;
                                    } else if (c.od !== void 0) {
                                        json.checkObj(elem);
                                        delete elem[key];
                                    } else {
                                        throw new Error("invalid / missing instruction in op");
                                    }
                                }
                                return container.data;
                            };
                            json.shatter = function(op) {
                                var results = [];
                                for (var i = 0; i < op.length; i++) {
                                    results.push([ op[i] ]);
                                }
                                return results;
                            };
                            json.incrementalApply = function(snapshot, op, _yield) {
                                for (var i = 0; i < op.length; i++) {
                                    var smallOp = [ op[i] ];
                                    snapshot = json.apply(snapshot, smallOp);
                                    _yield(smallOp, snapshot);
                                }
                                return snapshot;
                            };
                            var pathMatches = json.pathMatches = function(p1, p2, ignoreLast) {
                                if (p1.length != p2.length) return false;
                                for (var i = 0; i < p1.length; i++) {
                                    if (p1[i] !== p2[i] && (!ignoreLast || i !== p1.length - 1)) return false;
                                }
                                return true;
                            };
                            json.append = function(dest, c) {
                                c = clone(c);
                                if (dest.length === 0) {
                                    dest.push(c);
                                    return;
                                }
                                var last = dest[dest.length - 1];
                                if ((c.si != null || c.sd != null) && (last.si != null || last.sd != null)) {
                                    convertFromText(c);
                                    convertFromText(last);
                                }
                                if (pathMatches(c.p, last.p)) {
                                    if (c.t && last.t && c.t === last.t && subtypes[c.t]) {
                                        last.o = subtypes[c.t].compose(last.o, c.o);
                                        if (c.si != null || c.sd != null) {
                                            var p = c.p;
                                            for (var i = 0; i < last.o.length - 1; i++) {
                                                c.o = [ last.o.pop() ];
                                                c.p = p.slice();
                                                convertToText(c);
                                                dest.push(c);
                                            }
                                            convertToText(last);
                                        }
                                    } else if (last.na != null && c.na != null) {
                                        dest[dest.length - 1] = {
                                            p: last.p,
                                            na: last.na + c.na
                                        };
                                    } else if (last.li !== undefined && c.li === undefined && c.ld === last.li) {
                                        if (last.ld !== undefined) {
                                            delete last.li;
                                        } else {
                                            dest.pop();
                                        }
                                    } else if (last.od !== undefined && last.oi === undefined && c.oi !== undefined && c.od === undefined) {
                                        last.oi = c.oi;
                                    } else if (last.oi !== undefined && c.od !== undefined) {
                                        if (c.oi !== undefined) {
                                            last.oi = c.oi;
                                        } else if (last.od !== undefined) {
                                            delete last.oi;
                                        } else {
                                            dest.pop();
                                        }
                                    } else if (c.lm !== undefined && c.p[c.p.length - 1] === c.lm) {} else {
                                        dest.push(c);
                                    }
                                } else {
                                    if ((c.si != null || c.sd != null) && (last.si != null || last.sd != null)) {
                                        convertToText(c);
                                        convertToText(last);
                                    }
                                    dest.push(c);
                                }
                            };
                            json.compose = function(op1, op2) {
                                json.checkValidOp(op1);
                                json.checkValidOp(op2);
                                var newOp = clone(op1);
                                for (var i = 0; i < op2.length; i++) {
                                    json.append(newOp, op2[i]);
                                }
                                return newOp;
                            };
                            json.normalize = function(op) {
                                var newOp = [];
                                op = isArray(op) ? op : [ op ];
                                for (var i = 0; i < op.length; i++) {
                                    var c = op[i];
                                    if (c.p == null) c.p = [];
                                    json.append(newOp, c);
                                }
                                return newOp;
                            };
                            json.commonLengthForOps = function(a, b) {
                                var alen = a.p.length;
                                var blen = b.p.length;
                                if (a.na != null || a.t) alen++;
                                if (b.na != null || b.t) blen++;
                                if (alen === 0) return -1;
                                if (blen === 0) return null;
                                alen--;
                                blen--;
                                for (var i = 0; i < alen; i++) {
                                    var p = a.p[i];
                                    if (i >= blen || p !== b.p[i]) return null;
                                }
                                return alen;
                            };
                            json.canOpAffectPath = function(op, path) {
                                return json.commonLengthForOps({
                                    p: path
                                }, op) != null;
                            };
                            json.transformComponent = function(dest, c, otherC, type) {
                                c = clone(c);
                                var common = json.commonLengthForOps(otherC, c);
                                var common2 = json.commonLengthForOps(c, otherC);
                                var cplength = c.p.length;
                                var otherCplength = otherC.p.length;
                                if (c.na != null || c.t) cplength++;
                                if (otherC.na != null || otherC.t) otherCplength++;
                                if (common2 != null && otherCplength > cplength && c.p[common2] == otherC.p[common2]) {
                                    if (c.ld !== void 0) {
                                        var oc = clone(otherC);
                                        oc.p = oc.p.slice(cplength);
                                        c.ld = json.apply(clone(c.ld), [ oc ]);
                                    } else if (c.od !== void 0) {
                                        var oc = clone(otherC);
                                        oc.p = oc.p.slice(cplength);
                                        c.od = json.apply(clone(c.od), [ oc ]);
                                    }
                                }
                                if (common != null) {
                                    var commonOperand = cplength == otherCplength;
                                    var oc = otherC;
                                    if ((c.si != null || c.sd != null) && (otherC.si != null || otherC.sd != null)) {
                                        convertFromText(c);
                                        oc = clone(otherC);
                                        convertFromText(oc);
                                    }
                                    if (oc.t && subtypes[oc.t]) {
                                        if (c.t && c.t === oc.t) {
                                            var res = subtypes[c.t].transform(c.o, oc.o, type);
                                            if (res.length > 0) {
                                                if (c.si != null || c.sd != null) {
                                                    var p = c.p;
                                                    for (var i = 0; i < res.length; i++) {
                                                        c.o = [ res[i] ];
                                                        c.p = p.slice();
                                                        convertToText(c);
                                                        json.append(dest, c);
                                                    }
                                                } else {
                                                    c.o = res;
                                                    json.append(dest, c);
                                                }
                                            }
                                            return dest;
                                        }
                                    } else if (otherC.na !== void 0) {} else if (otherC.li !== void 0 && otherC.ld !== void 0) {
                                        if (otherC.p[common] === c.p[common]) {
                                            if (!commonOperand) {
                                                return dest;
                                            } else if (c.ld !== void 0) {
                                                if (c.li !== void 0 && type === "left") {
                                                    c.ld = clone(otherC.li);
                                                } else {
                                                    return dest;
                                                }
                                            }
                                        }
                                    } else if (otherC.li !== void 0) {
                                        if (c.li !== void 0 && c.ld === undefined && commonOperand && c.p[common] === otherC.p[common]) {
                                            if (type === "right") c.p[common]++;
                                        } else if (otherC.p[common] <= c.p[common]) {
                                            c.p[common]++;
                                        }
                                        if (c.lm !== void 0) {
                                            if (commonOperand) {
                                                if (otherC.p[common] <= c.lm) c.lm++;
                                            }
                                        }
                                    } else if (otherC.ld !== void 0) {
                                        if (c.lm !== void 0) {
                                            if (commonOperand) {
                                                if (otherC.p[common] === c.p[common]) {
                                                    return dest;
                                                }
                                                var p = otherC.p[common];
                                                var from = c.p[common];
                                                var to = c.lm;
                                                if (p < to || p === to && from < to) c.lm--;
                                            }
                                        }
                                        if (otherC.p[common] < c.p[common]) {
                                            c.p[common]--;
                                        } else if (otherC.p[common] === c.p[common]) {
                                            if (otherCplength < cplength) {
                                                return dest;
                                            } else if (c.ld !== void 0) {
                                                if (c.li !== void 0) {
                                                    delete c.ld;
                                                } else {
                                                    return dest;
                                                }
                                            }
                                        }
                                    } else if (otherC.lm !== void 0) {
                                        if (c.lm !== void 0 && cplength === otherCplength) {
                                            var from = c.p[common];
                                            var to = c.lm;
                                            var otherFrom = otherC.p[common];
                                            var otherTo = otherC.lm;
                                            if (otherFrom !== otherTo) {
                                                if (from === otherFrom) {
                                                    if (type === "left") {
                                                        c.p[common] = otherTo;
                                                        if (from === to) c.lm = otherTo;
                                                    } else {
                                                        return dest;
                                                    }
                                                } else {
                                                    if (from > otherFrom) c.p[common]--;
                                                    if (from > otherTo) c.p[common]++; else if (from === otherTo) {
                                                        if (otherFrom > otherTo) {
                                                            c.p[common]++;
                                                            if (from === to) c.lm++;
                                                        }
                                                    }
                                                    if (to > otherFrom) {
                                                        c.lm--;
                                                    } else if (to === otherFrom) {
                                                        if (to > from) c.lm--;
                                                    }
                                                    if (to > otherTo) {
                                                        c.lm++;
                                                    } else if (to === otherTo) {
                                                        if (otherTo > otherFrom && to > from || otherTo < otherFrom && to < from) {
                                                            if (type === "right") c.lm++;
                                                        } else {
                                                            if (to > from) c.lm++; else if (to === otherFrom) c.lm--;
                                                        }
                                                    }
                                                }
                                            }
                                        } else if (c.li !== void 0 && c.ld === undefined && commonOperand) {
                                            var from = otherC.p[common];
                                            var to = otherC.lm;
                                            p = c.p[common];
                                            if (p > from) c.p[common]--;
                                            if (p > to) c.p[common]++;
                                        } else {
                                            var from = otherC.p[common];
                                            var to = otherC.lm;
                                            p = c.p[common];
                                            if (p === from) {
                                                c.p[common] = to;
                                            } else {
                                                if (p > from) c.p[common]--;
                                                if (p > to) c.p[common]++; else if (p === to && from > to) c.p[common]++;
                                            }
                                        }
                                    } else if (otherC.oi !== void 0 && otherC.od !== void 0) {
                                        if (c.p[common] === otherC.p[common]) {
                                            if (c.oi !== void 0 && commonOperand) {
                                                if (type === "right") {
                                                    return dest;
                                                } else {
                                                    c.od = otherC.oi;
                                                }
                                            } else {
                                                return dest;
                                            }
                                        }
                                    } else if (otherC.oi !== void 0) {
                                        if (c.oi !== void 0 && c.p[common] === otherC.p[common]) {
                                            if (type === "left") {
                                                json.append(dest, {
                                                    p: c.p,
                                                    od: otherC.oi
                                                });
                                            } else {
                                                return dest;
                                            }
                                        }
                                    } else if (otherC.od !== void 0) {
                                        if (c.p[common] == otherC.p[common]) {
                                            if (!commonOperand) return dest;
                                            if (c.oi !== void 0) {
                                                delete c.od;
                                            } else {
                                                return dest;
                                            }
                                        }
                                    }
                                }
                                json.append(dest, c);
                                return dest;
                            };
                            require("./bootstrapTransform")(json, json.transformComponent, json.checkValidOp, json.append);
                            var text = require("./text0");
                            json.registerSubtype(text);
                            module.exports = json;
                        }, {
                            "./bootstrapTransform": 11,
                            "./text0": 14
                        } ],
                        14: [ function(require, module, exports) {
                            var text = module.exports = {
                                name: "text0",
                                uri: "http://sharejs.org/types/textv0",
                                create: function create(initial) {
                                    if (initial != null && typeof initial !== "string") {
                                        throw new Error("Initial data must be a string");
                                    }
                                    return initial || "";
                                }
                            };
                            var strInject = function strInject(s1, pos, s2) {
                                return s1.slice(0, pos) + s2 + s1.slice(pos);
                            };
                            var checkValidComponent = function checkValidComponent(c) {
                                if (typeof c.p !== "number") throw new Error("component missing position field");
                                if (typeof c.i === "string" === (typeof c.d === "string")) throw new Error("component needs an i or d field");
                                if (c.p < 0) throw new Error("position cannot be negative");
                            };
                            var checkValidOp = function checkValidOp(op) {
                                for (var i = 0; i < op.length; i++) {
                                    checkValidComponent(op[i]);
                                }
                            };
                            text.apply = function(snapshot, op) {
                                var deleted;
                                checkValidOp(op);
                                for (var i = 0; i < op.length; i++) {
                                    var component = op[i];
                                    if (component.i != null) {
                                        snapshot = strInject(snapshot, component.p, component.i);
                                    } else {
                                        deleted = snapshot.slice(component.p, component.p + component.d.length);
                                        if (component.d !== deleted) throw new Error("Delete component '" + component.d + "' does not match deleted text '" + deleted + "'");
                                        snapshot = snapshot.slice(0, component.p) + snapshot.slice(component.p + component.d.length);
                                    }
                                }
                                return snapshot;
                            };
                            var append = text._append = function(newOp, c) {
                                if (c.i === "" || c.d === "") return;
                                if (newOp.length === 0) {
                                    newOp.push(c);
                                } else {
                                    var last = newOp[newOp.length - 1];
                                    if (last.i != null && c.i != null && last.p <= c.p && c.p <= last.p + last.i.length) {
                                        newOp[newOp.length - 1] = {
                                            i: strInject(last.i, c.p - last.p, c.i),
                                            p: last.p
                                        };
                                    } else if (last.d != null && c.d != null && c.p <= last.p && last.p <= c.p + c.d.length) {
                                        newOp[newOp.length - 1] = {
                                            d: strInject(c.d, last.p - c.p, last.d),
                                            p: c.p
                                        };
                                    } else {
                                        newOp.push(c);
                                    }
                                }
                            };
                            text.compose = function(op1, op2) {
                                checkValidOp(op1);
                                checkValidOp(op2);
                                var newOp = op1.slice();
                                for (var i = 0; i < op2.length; i++) {
                                    append(newOp, op2[i]);
                                }
                                return newOp;
                            };
                            text.normalize = function(op) {
                                var newOp = [];
                                if (op.i != null || op.p != null) op = [ op ];
                                for (var i = 0; i < op.length; i++) {
                                    var c = op[i];
                                    if (c.p == null) c.p = 0;
                                    append(newOp, c);
                                }
                                return newOp;
                            };
                            var transformPosition = function transformPosition(pos, c, insertAfter) {
                                if (c.i != null) {
                                    if (c.p < pos || c.p === pos && insertAfter) {
                                        return pos + c.i.length;
                                    } else {
                                        return pos;
                                    }
                                } else {
                                    if (pos <= c.p) {
                                        return pos;
                                    } else if (pos <= c.p + c.d.length) {
                                        return c.p;
                                    } else {
                                        return pos - c.d.length;
                                    }
                                }
                            };
                            text.transformCursor = function(position, op, side) {
                                var insertAfter = side === "right";
                                for (var i = 0; i < op.length; i++) {
                                    position = transformPosition(position, op[i], insertAfter);
                                }
                                return position;
                            };
                            var transformComponent = text._tc = function(dest, c, otherC, side) {
                                checkValidComponent(c);
                                checkValidComponent(otherC);
                                if (c.i != null) {
                                    append(dest, {
                                        i: c.i,
                                        p: transformPosition(c.p, otherC, side === "right")
                                    });
                                } else {
                                    if (otherC.i != null) {
                                        var s = c.d;
                                        if (c.p < otherC.p) {
                                            append(dest, {
                                                d: s.slice(0, otherC.p - c.p),
                                                p: c.p
                                            });
                                            s = s.slice(otherC.p - c.p);
                                        }
                                        if (s !== "") append(dest, {
                                            d: s,
                                            p: c.p + otherC.i.length
                                        });
                                    } else {
                                        if (c.p >= otherC.p + otherC.d.length) append(dest, {
                                            d: c.d,
                                            p: c.p - otherC.d.length
                                        }); else if (c.p + c.d.length <= otherC.p) append(dest, c); else {
                                            var newC = {
                                                d: "",
                                                p: c.p
                                            };
                                            if (c.p < otherC.p) newC.d = c.d.slice(0, otherC.p - c.p);
                                            if (c.p + c.d.length > otherC.p + otherC.d.length) newC.d += c.d.slice(otherC.p + otherC.d.length - c.p);
                                            var intersectStart = Math.max(c.p, otherC.p);
                                            var intersectEnd = Math.min(c.p + c.d.length, otherC.p + otherC.d.length);
                                            var cIntersect = c.d.slice(intersectStart - c.p, intersectEnd - c.p);
                                            var otherIntersect = otherC.d.slice(intersectStart - otherC.p, intersectEnd - otherC.p);
                                            if (cIntersect !== otherIntersect) throw new Error("Delete ops delete different text in the same region of the document");
                                            if (newC.d !== "") {
                                                newC.p = transformPosition(newC.p, otherC);
                                                append(dest, newC);
                                            }
                                        }
                                    }
                                }
                                return dest;
                            };
                            var invertComponent = function invertComponent(c) {
                                return c.i != null ? {
                                    d: c.i,
                                    p: c.p
                                } : {
                                    i: c.d,
                                    p: c.p
                                };
                            };
                            text.invert = function(op) {
                                op = op.slice().reverse();
                                for (var i = 0; i < op.length; i++) {
                                    op[i] = invertComponent(op[i]);
                                }
                                return op;
                            };
                            require("./bootstrapTransform")(text, transformComponent, checkValidOp, append);
                        }, {
                            "./bootstrapTransform": 11
                        } ],
                        15: [ function(require, module, exports) {
                            module.exports = {
                                type: require("./text-tp2")
                            };
                        }, {
                            "./text-tp2": 16
                        } ],
                        16: [ function(require, module, exports) {
                            var type = module.exports = {
                                name: "text-tp2",
                                tp2: true,
                                uri: "http://sharejs.org/types/text-tp2v1",
                                create: function create(initial) {
                                    if (initial == null) {
                                        initial = "";
                                    } else {
                                        if (typeof initial != "string") throw new Error("Initial data must be a string");
                                    }
                                    return {
                                        charLength: initial.length,
                                        totalLength: initial.length,
                                        data: initial.length ? [ initial ] : []
                                    };
                                },
                                serialize: function serialize(doc) {
                                    if (!doc.data) {
                                        throw new Error("invalid doc snapshot");
                                    }
                                    return doc.data;
                                },
                                deserialize: function deserialize(data) {
                                    var doc = type.create();
                                    doc.data = data;
                                    for (var i = 0; i < data.length; i++) {
                                        var component = data[i];
                                        if (typeof component === "string") {
                                            doc.charLength += component.length;
                                            doc.totalLength += component.length;
                                        } else {
                                            doc.totalLength += component;
                                        }
                                    }
                                    return doc;
                                }
                            };
                            var isArray = Array.isArray || function(obj) {
                                return Object.prototype.toString.call(obj) == "[object Array]";
                            };
                            var checkOp = function checkOp(op) {
                                if (!isArray(op)) throw new Error("Op must be an array of components");
                                var last = null;
                                for (var i = 0; i < op.length; i++) {
                                    var c = op[i];
                                    if ((typeof c === "undefined" ? "undefined" : _typeof(c)) == "object") {
                                        if (c.i !== undefined) {
                                            if (!(typeof c.i === "string" && c.i.length > 0 || typeof c.i === "number" && c.i > 0)) throw new Error("Inserts must insert a string or a +ive number");
                                        } else if (c.d !== undefined) {
                                            if (!(typeof c.d === "number" && c.d > 0)) throw new Error("Deletes must be a +ive number");
                                        } else throw new Error("Operation component must define .i or .d");
                                    } else {
                                        if (typeof c != "number") throw new Error("Op components must be objects or numbers");
                                        if (c <= 0) throw new Error("Skip components must be a positive number");
                                        if (typeof last === "number") throw new Error("Adjacent skip components should be combined");
                                    }
                                    last = c;
                                }
                            };
                            var takeDoc = type._takeDoc = function(doc, position, maxlength, tombsIndivisible) {
                                if (position.index >= doc.data.length) throw new Error("Operation goes past the end of the document");
                                var part = doc.data[position.index];
                                var result;
                                if (typeof part == "string") {
                                    if (maxlength != null) {
                                        result = part.slice(position.offset, position.offset + maxlength);
                                    } else {
                                        result = part.slice(position.offset);
                                    }
                                } else {
                                    if (maxlength == null || tombsIndivisible) {
                                        result = part - position.offset;
                                    } else {
                                        result = Math.min(maxlength, part - position.offset);
                                    }
                                }
                                var resultLen = result.length || result;
                                if ((part.length || part) - position.offset > resultLen) {
                                    position.offset += resultLen;
                                } else {
                                    position.index++;
                                    position.offset = 0;
                                }
                                return result;
                            };
                            var appendDoc = type._appendDoc = function(doc, p) {
                                if (p === 0 || p === "") return;
                                if (typeof p === "string") {
                                    doc.charLength += p.length;
                                    doc.totalLength += p.length;
                                } else {
                                    doc.totalLength += p;
                                }
                                var data = doc.data;
                                if (data.length === 0) {
                                    data.push(p);
                                } else if (_typeof(data[data.length - 1]) === (typeof p === "undefined" ? "undefined" : _typeof(p))) {
                                    data[data.length - 1] += p;
                                } else {
                                    data.push(p);
                                }
                            };
                            type.apply = function(doc, op) {
                                if (doc.totalLength == null || doc.charLength == null || !isArray(doc.data)) {
                                    throw new Error("Snapshot is invalid");
                                }
                                checkOp(op);
                                var newDoc = type.create();
                                var position = {
                                    index: 0,
                                    offset: 0
                                };
                                for (var i = 0; i < op.length; i++) {
                                    var component = op[i];
                                    var remainder, part;
                                    if (typeof component == "number") {
                                        remainder = component;
                                        while (remainder > 0) {
                                            part = takeDoc(doc, position, remainder);
                                            appendDoc(newDoc, part);
                                            remainder -= part.length || part;
                                        }
                                    } else if (component.i !== undefined) {
                                        appendDoc(newDoc, component.i);
                                    } else if (component.d !== undefined) {
                                        remainder = component.d;
                                        while (remainder > 0) {
                                            part = takeDoc(doc, position, remainder);
                                            remainder -= part.length || part;
                                        }
                                        appendDoc(newDoc, component.d);
                                    }
                                }
                                return newDoc;
                            };
                            var append = type._append = function(op, component) {
                                var last;
                                if (component === 0 || component.i === "" || component.i === 0 || component.d === 0) {} else if (op.length === 0) {
                                    op.push(component);
                                } else {
                                    last = op[op.length - 1];
                                    if (typeof component == "number" && typeof last == "number") {
                                        op[op.length - 1] += component;
                                    } else if (component.i != null && last.i != null && _typeof(last.i) === _typeof(component.i)) {
                                        last.i += component.i;
                                    } else if (component.d != null && last.d != null) {
                                        last.d += component.d;
                                    } else {
                                        op.push(component);
                                    }
                                }
                            };
                            var take = function take(op, cursor, maxlength, insertsIndivisible) {
                                if (cursor.index === op.length) return null;
                                var e = op[cursor.index];
                                var current;
                                var result;
                                var offset = cursor.offset;
                                if (typeof (current = e) == "number" || typeof (current = e.i) == "number" || (current = e.d) != null) {
                                    var c;
                                    if (maxlength == null || current - offset <= maxlength || insertsIndivisible && e.i != null) {
                                        c = current - offset;
                                        ++cursor.index;
                                        cursor.offset = 0;
                                    } else {
                                        cursor.offset += maxlength;
                                        c = maxlength;
                                    }
                                    if (e.i != null) {
                                        return {
                                            i: c
                                        };
                                    } else if (e.d != null) {
                                        return {
                                            d: c
                                        };
                                    } else {
                                        return c;
                                    }
                                } else {
                                    if (maxlength == null || e.i.length - offset <= maxlength || insertsIndivisible) {
                                        result = {
                                            i: e.i.slice(offset)
                                        };
                                        ++cursor.index;
                                        cursor.offset = 0;
                                    } else {
                                        result = {
                                            i: e.i.slice(offset, offset + maxlength)
                                        };
                                        cursor.offset += maxlength;
                                    }
                                    return result;
                                }
                            };
                            var componentLength = function componentLength(component) {
                                if (typeof component === "number") {
                                    return component;
                                } else if (typeof component.i === "string") {
                                    return component.i.length;
                                } else {
                                    return component.d || component.i;
                                }
                            };
                            type.normalize = function(op) {
                                var newOp = [];
                                for (var i = 0; i < op.length; i++) {
                                    append(newOp, op[i]);
                                }
                                return newOp;
                            };
                            var transformer = function transformer(op, otherOp, goForwards, side) {
                                checkOp(op);
                                checkOp(otherOp);
                                var newOp = [];
                                var cursor = {
                                    index: 0,
                                    offset: 0
                                };
                                for (var i = 0; i < otherOp.length; i++) {
                                    var component = otherOp[i];
                                    var len = componentLength(component);
                                    var chunk;
                                    if (component.i != null) {
                                        if (goForwards) {
                                            if (side === "left") {
                                                var next;
                                                while ((next = op[cursor.index]) && next.i != null) {
                                                    append(newOp, take(op, cursor));
                                                }
                                            }
                                            append(newOp, len);
                                        } else {
                                            while (len > 0) {
                                                chunk = take(op, cursor, len, true);
                                                if (chunk === null) throw new Error("The transformed op is invalid");
                                                if (chunk.d != null) throw new Error("The transformed op deletes locally inserted characters - it cannot be purged of the insert.");
                                                if (typeof chunk == "number") len -= chunk; else append(newOp, chunk);
                                            }
                                        }
                                    } else {
                                        while (len > 0) {
                                            chunk = take(op, cursor, len, true);
                                            if (chunk === null) throw new Error("The op traverses more elements than the document has");
                                            append(newOp, chunk);
                                            if (!chunk.i) len -= componentLength(chunk);
                                        }
                                    }
                                }
                                var component;
                                while (component = take(op, cursor)) {
                                    if (component.i === undefined) {
                                        throw new Error("Remaining fragments in the op: " + component);
                                    }
                                    append(newOp, component);
                                }
                                return newOp;
                            };
                            type.transform = function(op, otherOp, side) {
                                if (side != "left" && side != "right") throw new Error("side (" + side + ") should be 'left' or 'right'");
                                return transformer(op, otherOp, true, side);
                            };
                            type.prune = function(op, otherOp) {
                                return transformer(op, otherOp, false);
                            };
                            type.compose = function(op1, op2) {
                                if (op1 == null) return op2;
                                checkOp(op1);
                                checkOp(op2);
                                var result = [];
                                var cursor = {
                                    index: 0,
                                    offset: 0
                                };
                                var component;
                                for (var i = 0; i < op2.length; i++) {
                                    component = op2[i];
                                    var len, chunk;
                                    if (typeof component === "number") {
                                        len = component;
                                        while (len > 0) {
                                            chunk = take(op1, cursor, len);
                                            if (chunk === null) throw new Error("The op traverses more elements than the document has");
                                            append(result, chunk);
                                            len -= componentLength(chunk);
                                        }
                                    } else if (component.i !== undefined) {
                                        append(result, {
                                            i: component.i
                                        });
                                    } else {
                                        len = component.d;
                                        while (len > 0) {
                                            chunk = take(op1, cursor, len);
                                            if (chunk === null) throw new Error("The op traverses more elements than the document has");
                                            var chunkLength = componentLength(chunk);
                                            if (chunk.i !== undefined) append(result, {
                                                i: chunkLength
                                            }); else append(result, {
                                                d: chunkLength
                                            });
                                            len -= chunkLength;
                                        }
                                    }
                                }
                                while (component = take(op1, cursor)) {
                                    if (component.i === undefined) {
                                        throw new Error("Remaining fragments in op1: " + component);
                                    }
                                    append(result, component);
                                }
                                return result;
                            };
                        }, {} ],
                        17: [ function(require, module, exports) {
                            module.exports = api;
                            function api(getSnapshot, submitOp) {
                                return {
                                    get: function get() {
                                        return getSnapshot();
                                    },
                                    getLength: function getLength() {
                                        return getSnapshot().length;
                                    },
                                    insert: function insert(pos, text, callback) {
                                        return submitOp([ pos, text ], callback);
                                    },
                                    remove: function remove(pos, length, callback) {
                                        return submitOp([ pos, {
                                            d: length
                                        } ], callback);
                                    },
                                    _onOp: function _onOp(op) {
                                        var pos = 0;
                                        var spos = 0;
                                        for (var i = 0; i < op.length; i++) {
                                            var component = op[i];
                                            switch (typeof component === "undefined" ? "undefined" : _typeof(component)) {
                                              case "number":
                                                pos += component;
                                                spos += component;
                                                break;

                                              case "string":
                                                if (this.onInsert) this.onInsert(pos, component);
                                                pos += component.length;
                                                break;

                                              case "object":
                                                if (this.onRemove) this.onRemove(pos, component.d);
                                                spos += component.d;
                                            }
                                        }
                                    }
                                };
                            }
                            api.provides = {
                                text: true
                            };
                        }, {} ],
                        18: [ function(require, module, exports) {
                            var type = require("./text");
                            type.api = require("./api");
                            module.exports = {
                                type: type
                            };
                        }, {
                            "./api": 17,
                            "./text": 19
                        } ],
                        19: [ function(require, module, exports) {
                            exports.name = "text";
                            exports.uri = "http://sharejs.org/types/textv1";
                            exports.create = function(initial) {
                                if (initial != null && typeof initial !== "string") {
                                    throw Error("Initial data must be a string");
                                }
                                return initial || "";
                            };
                            var isArray = Array.isArray || function(obj) {
                                return Object.prototype.toString.call(obj) === "[object Array]";
                            };
                            var checkOp = function checkOp(op) {
                                if (!isArray(op)) throw Error("Op must be an array of components");
                                var last = null;
                                for (var i = 0; i < op.length; i++) {
                                    var c = op[i];
                                    switch (typeof c === "undefined" ? "undefined" : _typeof(c)) {
                                      case "object":
                                        if (!(typeof c.d === "number" && c.d > 0)) throw Error("Object components must be deletes of size > 0");
                                        break;

                                      case "string":
                                        if (!(c.length > 0)) throw Error("Inserts cannot be empty");
                                        break;

                                      case "number":
                                        if (!(c > 0)) throw Error("Skip components must be >0");
                                        if (typeof last === "number") throw Error("Adjacent skip components should be combined");
                                        break;
                                    }
                                    last = c;
                                }
                                if (typeof last === "number") throw Error("Op has a trailing skip");
                            };
                            var checkSelection = function checkSelection(selection) {
                                if (typeof selection !== "number" && (typeof selection[0] !== "number" || typeof selection[1] !== "number")) throw Error("Invalid selection");
                            };
                            var makeAppend = function makeAppend(op) {
                                return function(component) {
                                    if (!component || component.d === 0) {} else if (op.length === 0) {
                                        return op.push(component);
                                    } else if ((typeof component === "undefined" ? "undefined" : _typeof(component)) === _typeof(op[op.length - 1])) {
                                        if ((typeof component === "undefined" ? "undefined" : _typeof(component)) === "object") {
                                            return op[op.length - 1].d += component.d;
                                        } else {
                                            return op[op.length - 1] += component;
                                        }
                                    } else {
                                        return op.push(component);
                                    }
                                };
                            };
                            var makeTake = function makeTake(op) {
                                var idx = 0;
                                var offset = 0;
                                var take = function take(n, indivisableField) {
                                    if (idx === op.length) return n === -1 ? null : n;
                                    var part;
                                    var c = op[idx];
                                    if (typeof c === "number") {
                                        if (n === -1 || c - offset <= n) {
                                            part = c - offset;
                                            ++idx;
                                            offset = 0;
                                            return part;
                                        } else {
                                            offset += n;
                                            return n;
                                        }
                                    } else if (typeof c === "string") {
                                        if (n === -1 || indivisableField === "i" || c.length - offset <= n) {
                                            part = c.slice(offset);
                                            ++idx;
                                            offset = 0;
                                            return part;
                                        } else {
                                            part = c.slice(offset, offset + n);
                                            offset += n;
                                            return part;
                                        }
                                    } else {
                                        if (n === -1 || indivisableField === "d" || c.d - offset <= n) {
                                            part = {
                                                d: c.d - offset
                                            };
                                            ++idx;
                                            offset = 0;
                                            return part;
                                        } else {
                                            offset += n;
                                            return {
                                                d: n
                                            };
                                        }
                                    }
                                };
                                var peekType = function peekType() {
                                    return op[idx];
                                };
                                return [ take, peekType ];
                            };
                            var componentLength = function componentLength(c) {
                                if (typeof c === "number") {
                                    return c;
                                } else {
                                    return c.length || c.d;
                                }
                            };
                            var trim = function trim(op) {
                                if (op.length > 0 && typeof op[op.length - 1] === "number") {
                                    op.pop();
                                }
                                return op;
                            };
                            exports.normalize = function(op) {
                                var newOp = [];
                                var append = makeAppend(newOp);
                                for (var i = 0; i < op.length; i++) {
                                    append(op[i]);
                                }
                                return trim(newOp);
                            };
                            exports.apply = function(str, op) {
                                if (typeof str !== "string") {
                                    throw Error("Snapshot should be a string");
                                }
                                checkOp(op);
                                var newDoc = [];
                                for (var i = 0; i < op.length; i++) {
                                    var component = op[i];
                                    switch (typeof component === "undefined" ? "undefined" : _typeof(component)) {
                                      case "number":
                                        if (component > str.length) throw Error("The op is too long for this document");
                                        newDoc.push(str.slice(0, component));
                                        str = str.slice(component);
                                        break;

                                      case "string":
                                        newDoc.push(component);
                                        break;

                                      case "object":
                                        str = str.slice(component.d);
                                        break;
                                    }
                                }
                                return newDoc.join("") + str;
                            };
                            exports.transform = function(op, otherOp, side) {
                                if (side != "left" && side != "right") throw Error("side (" + side + ") must be 'left' or 'right'");
                                checkOp(op);
                                checkOp(otherOp);
                                var newOp = [];
                                var append = makeAppend(newOp);
                                var _fns = makeTake(op);
                                var take = _fns[0], peek = _fns[1];
                                for (var i = 0; i < otherOp.length; i++) {
                                    var component = otherOp[i];
                                    var length, chunk;
                                    switch (typeof component === "undefined" ? "undefined" : _typeof(component)) {
                                      case "number":
                                        length = component;
                                        while (length > 0) {
                                            chunk = take(length, "i");
                                            append(chunk);
                                            if (typeof chunk !== "string") {
                                                length -= componentLength(chunk);
                                            }
                                        }
                                        break;

                                      case "string":
                                        if (side === "left") {
                                            if (typeof peek() === "string") {
                                                append(take(-1));
                                            }
                                        }
                                        append(component.length);
                                        break;

                                      case "object":
                                        length = component.d;
                                        while (length > 0) {
                                            chunk = take(length, "i");
                                            switch (typeof chunk === "undefined" ? "undefined" : _typeof(chunk)) {
                                              case "number":
                                                length -= chunk;
                                                break;

                                              case "string":
                                                append(chunk);
                                                break;

                                              case "object":
                                                length -= chunk.d;
                                            }
                                        }
                                        break;
                                    }
                                }
                                while (component = take(-1)) {
                                    append(component);
                                }
                                return trim(newOp);
                            };
                            exports.compose = function(op1, op2) {
                                checkOp(op1);
                                checkOp(op2);
                                var result = [];
                                var append = makeAppend(result);
                                var take = makeTake(op1)[0];
                                for (var i = 0; i < op2.length; i++) {
                                    var component = op2[i];
                                    var length, chunk;
                                    switch (typeof component === "undefined" ? "undefined" : _typeof(component)) {
                                      case "number":
                                        length = component;
                                        while (length > 0) {
                                            chunk = take(length, "d");
                                            append(chunk);
                                            if ((typeof chunk === "undefined" ? "undefined" : _typeof(chunk)) !== "object") {
                                                length -= componentLength(chunk);
                                            }
                                        }
                                        break;

                                      case "string":
                                        append(component);
                                        break;

                                      case "object":
                                        length = component.d;
                                        while (length > 0) {
                                            chunk = take(length, "d");
                                            switch (typeof chunk === "undefined" ? "undefined" : _typeof(chunk)) {
                                              case "number":
                                                append({
                                                    d: chunk
                                                });
                                                length -= chunk;
                                                break;

                                              case "string":
                                                length -= chunk.length;
                                                break;

                                              case "object":
                                                append(chunk);
                                            }
                                        }
                                        break;
                                    }
                                }
                                while (component = take(-1)) {
                                    append(component);
                                }
                                return trim(result);
                            };
                            var transformPosition = function transformPosition(cursor, op) {
                                var pos = 0;
                                for (var i = 0; i < op.length; i++) {
                                    var c = op[i];
                                    if (cursor <= pos) break;
                                    switch (typeof c === "undefined" ? "undefined" : _typeof(c)) {
                                      case "number":
                                        if (cursor <= pos + c) return cursor;
                                        pos += c;
                                        break;

                                      case "string":
                                        pos += c.length;
                                        cursor += c.length;
                                        break;

                                      case "object":
                                        cursor -= Math.min(c.d, cursor - pos);
                                        break;
                                    }
                                }
                                return cursor;
                            };
                            exports.transformSelection = function(selection, op, isOwnOp) {
                                var pos = 0;
                                if (isOwnOp) {
                                    for (var i = 0; i < op.length; i++) {
                                        var c = op[i];
                                        switch (typeof c === "undefined" ? "undefined" : _typeof(c)) {
                                          case "number":
                                            pos += c;
                                            break;

                                          case "string":
                                            pos += c.length;
                                            break;
                                        }
                                    }
                                    return pos;
                                } else {
                                    return typeof selection === "number" ? transformPosition(selection, op) : [ transformPosition(selection[0], op), transformPosition(selection[1], op) ];
                                }
                            };
                            exports.selectionEq = function(c1, c2) {
                                if (c1[0] != null && c1[0] === c1[1]) c1 = c1[0];
                                if (c2[0] != null && c2[0] === c2[1]) c2 = c2[0];
                                return c1 === c2 || c1[0] != null && c2[0] != null && c1[0] === c2[0] && c1[1] == c2[1];
                            };
                        }, {} ]
                    }, {}, [ 4 ])(4);
                });
            }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
        }, {
            "../types": undefined,
            "./api": undefined,
            "./bootstrapTransform": undefined,
            "./connection": undefined,
            "./doc": undefined,
            "./emitter": undefined,
            "./json0": undefined,
            "./query": undefined,
            "./text": undefined,
            "./text-api": undefined,
            "./text-tp2": undefined,
            "./text-tp2-api": undefined,
            "./text0": undefined,
            "./textarea": undefined,
            events: 3,
            "ot-json0": 4,
            "ot-text": 6,
            "ot-text-tp2": 5
        } ]
    }, {}, [ 1 ])(1);
});
