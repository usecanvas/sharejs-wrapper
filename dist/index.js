'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _share = require('share');

var _share2 = _interopRequireDefault(_share);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ABNORMAL = 1006;
var NORMAL = 1000;
var NOT_FOUND = 4040;
var UNAUTHORIZED = 4010;

/**
 * @class ShareJSWrapper
 * @param {Object} options An object of configuration options for this client
 * @param {string} options.accessToken A Canvas API authentication token
 * @param {string} options.canvasID An ID of a Canvas to connect to
 * @param {string} options.realtimeURL The URL of the realtime server
 * @param {string} options.orgID The ID of the org the canvas belongs to
 */

var ShareJSWrapper = function () {
  function ShareJSWrapper(_ref) {
    var accessToken = _ref.accessToken;
    var canvasID = _ref.canvasID;
    var realtimeURL = _ref.realtimeURL;
    var orgID = _ref.orgID;

    _classCallCheck(this, ShareJSWrapper);

    this.accessToken = accessToken;
    this.eventEmitter = new _eventemitter2.default();
    this.canvasID = canvasID;
    this.orgID = orgID;

    this.socket = new WebSocket(realtimeURL);
    this.connection = this.getShareJSConnection();
    this.bindConnectionEvents();

    this.document = this.connection.get(orgID, canvasID);
    this.document.subscribe();
    this.context = this.getDocumentContext();
    this.document.whenReady(bind(this, 'onDocumentReady'));
  }

  /**
   * Add a listener to an event.
   *
   * @example
   * share.on('connect', function onConnect() {
   *   // ...
   * });
   *
   * @param {string} event The name of the event
   * @param {function} fn The function to call when the event occurs
   * @param {*} context The context on which to call the function
   * @return {ShareJSWrapper} This same instance
   */

  _createClass(ShareJSWrapper, [{
    key: 'on',
    value: function on(event, fn, context) {
      this.eventEmitter.on(event, fn, context);
      return this;
    }

    /**
     * Add a listener to an event which will fire once.
     *
     * @example
     * share.once('connect', function onConnect() {
     *   // ...
     * });
     *
     * @param {string} event The name of the event
     * @param {function} fn The function to call when the event occurs
     * @param {*} context The context on which to call the function
     * @return {ShareJSWrapper} This same instance
     */

  }, {
    key: 'once',
    value: function once(event, fn, context) {
      this.eventEmitter.once(event, fn, context);
      return this;
    }

    /**
     * Remove all listeners or only for the specified event.
     *
     * @example
     * share.removeAllListeners();
     *
     * @param {string} [event] The event to remove all listeners for
     * @return {ShareJSWrapper} This same instance
     */

  }, {
    key: 'removeAllListeners',
    value: function removeAllListeners(event) {
      this.eventEmitter.removeAllListeners(event);
      return this;
    }

    /**
     * Remove a listener from an event.
     *
     * @example
     * share.removeListener('connect', connectHandler, this, true);
     *
     * @param {string} event The event to remove listener(s) from
     * @param {function} [fn] The listener to remove
     * @param {*} [context] Only match listeners matching this context
     * @param {boolean} once Only remove "once" listeners
     * @return {ShareJSWrapper} This same instance
     */

  }, {
    key: 'removeListener',
    value: function removeListener(event, fn, context, once) {
      this.eventEmitter.removeListener(event, fn, context, once);
      return this;
    }

    /**
     * Bind to events on the connection and handle them.
     *
     * @private
     */

  }, {
    key: 'bindConnectionEvents',
    value: function bindConnectionEvents() {
      this.connection.on('connected', bind(this, 'onConnectionConnected'));
      this.connection.on('disconnected', bind(this, 'onConnectionDisonnected'));
    }

    /**
     * Get an editing context for the ShareJS document.
     *
     * @private
     * @return {ShareJS.Context}
     */

  }, {
    key: 'getDocumentContext',
    value: function getDocumentContext() {
      var _this = this;

      var context = this.document.createContext();

      if (!context.provides.text) {
        throw new Error('Cannot attach to a non-text document');
      }

      context.onInsert = function (op) {
        return _this.eventEmitter.emit('insert', op);
      };
      context.onRemove = function (op) {
        return _this.eventEmitter.emit('remove', op);
      };
      context.detach = null;

      return context;
    }

    /**
     * Get a new ShareJS connection for this wrapper client.
     *
     * @private
     * @return {ShareJS.Connection}
     */

  }, {
    key: 'getShareJSConnection',
    value: function getShareJSConnection() {
      var connection = new _share2.default.Connection(this.socket);
      this.setupSocketAuthentication();
      return connection;
    }

    /**
     * Handle the ShareJS connection connecting successfully.
     *
     * @private
     */

  }, {
    key: 'onConnectionConnected',
    value: function onConnectionConnected() {
      this.connectionAttempts = 1;
      this.connected = true;
    }

    /**
     * Handle the ShareJS connection disconnecting by matching error codes.
     *
     * @private
     * @param {Event} event A disconnection event
     */

  }, {
    key: 'onConnectionDisonnected',
    value: function onConnectionDisonnected(event) {
      this.connected = false;

      var error = undefined,
          reason = undefined;
      switch (event.code) {
        case ABNORMAL:
          this.reconnect();
          break;
        case UNAUTHORIZED:
          reason = 'forbidden';
          error = new Error(reason);
          error.status = 403;
          break;
        case NOT_FOUND:
          reason = 'not_found';
          error = new Error(reason);
          error.status = 404;
          break;
        default:
          if (event.code === NORMAL) {
            reason = 'normal';
          } else {
            reason = 'unexpected';
            error = new Error(reason);
            error.status = 500;
          }
      }

      this.eventEmitter.emit('disconnected', error, reason);
    }

    /**
     * Handle the document ready event, meaning the WebSocket is set up and
     * messages are being received successfully.
     *
     * @private
     */

  }, {
    key: 'onDocumentReady',
    value: function onDocumentReady() {
      if (!document.type) {
        document.create('text');
      }

      this.text = this.document.snapshot;
      this.eventEmitter.emit('ready');
    }

    /**
     * Set up the authentication step.
     *
     * ShareJS immediately sets `socket.onopen` so we override that and ensure
     * that an authentication message is sent to the realtime server as early as
     * possible.
     *
     * @private
     */

  }, {
    key: 'setupSocketAuthentication',
    value: function setupSocketAuthentication() {
      var accessToken = this.accessToken;
      var socket = this.socket;

      socket._onopen = socket.onopen; // Override ShareJS's socket.onopen

      socket.onopen = function onSocketOpen() {
        socket.send('auth-token:' + accessToken);
        socket._onopen.apply(socket, arguments); // Call ShareJS's socket.onopen
      };
    }
  }]);

  return ShareJSWrapper;
}();

exports.default = ShareJSWrapper;

function bind(target, method) {
  return target[method].bind(target);
}