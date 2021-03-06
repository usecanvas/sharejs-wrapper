import EventEmitter from 'eventemitter3';
import ShareJS      from './vendor/share';

const ABNORMAL      = 1006;
const NORMAL        = 1000;
const NOT_FOUND     = 4040;
const UNAUTHORIZED  = 4010;
const LOCAL_TIMEOUT = 4011;

/**
 * A two-element array consisting of a length of text to retain and a string to
 * insert
 *
 * @example
 * [10, "Foo"]
 *
 * @typedef {Array<(number|string)>} ShareJSWrapper~Insert
 */

/**
 * A two-element array consisting of a length of text to retain and a length of
 * text to remove
 *
 * @example
 * [10, 12]
 *
 * @typedef {Array<number>} ShareJSWrapper~Remove
 */

/**
 * @class ShareJSWrapper
 * @classdesc A wrapper around a
 *   [ShareJS](https://github.com/share/ShareJS/tree/v0.7.40) client, providing
 *   easier use for a single document per connection
 *
 * @param {Object} config An object of configuration options for this client
 * @param {string} config.accessToken A Canvas API authentication token
 * @param {string} config.canvasID An ID of a Canvas to connect to
 * @param {string} config.realtimeURL The URL of the realtime server
 * @param {string} config.orgID The ID of the org the canvas belongs to
 * @param {string} config.debug Whether to ignore or log internal log calls
 */
export default class ShareJSWrapper {
  constructor(config) { // eslint-disable-line require-jsdoc
    this.config = config;
    this.eventEmitter = new EventEmitter();
  }

  /**
   * A callback called on successful connection after a `connect` call
   *
   * @callback ShareJSWrapper~connectCallback
   */
  /**
   * Tell the wrapper client to connect to the configured ShareJS server.
   *
   * @example
   * share.connect(function onConnected() {
   *   console.log(share.content);
   * });
   *
   * @param {ShareJSWrapper~connectCallback} callback A callback to call once
   *   connected
   * @param {Boolean} isReconnect Whether this connect call is a reconnect,
   *   meaning ShareJS event handlers need not be re-bound and the context
   *   already exists
   */
  connect(callback, isReconnect) {
    const { canvasID, orgID, realtimeURL } = this.config;

    this.socket = new WebSocket(realtimeURL);
    this.connection = this.getShareJSConnection();

    if (isReconnect) {
      return;
    }

    this.bindConnectionEvents();

    this.document = this.connection.get(orgID, canvasID);
    this.document.subscribe();

    this.document.whenReady(_ => {
      this.debug('whenReady');

      if (!this.document.type) {
        this.document.create('text');
      }

      this.context = this.getDocumentContext();
      this.context.onInsert = bind(this, 'onRemoteOperation');
      this.context.onRemove = bind(this, 'onRemoteOperation');

      /**
       * The current content of the ShareJS document
       *
       * @type {string}
       */
      this.content = this.context.get();

      if (callback) {
        callback();
      }
    });
  }

  /**
   * Tell the wrapper client to close the ShareJS connection and socket.
   *
   * @example
   * share.disconnect();
   */
  disconnect() {
    this.socket.close();
  }

  /**
   * Send an insert operation from this client to the server.
   *
   * @example
   * share.insert(10, 'Foo');
   *
   * @param {number} offset The offset at which to start the insert operation
   * @param {string} text The text to be inserted
   */
  insert(offset, text) {
    this.debug(_ => {
      return ['insert', {
        content: this.context.get(),
        op: [offset, text]
      }];
    });

    this.context.insert(offset, text);
    this.content = this.context.get();
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
  on(event, fn, context) {
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
  once(event, fn, context) {
    this.eventEmitter.once(event, fn, context);
    return this;
  }

  /**
   * Send a remove operation from this client to the server.
   *
   * @example
   * share.remove(0, 3);
   *
   * @param {number} start The position at which to start the remove
   * @param {number} length The number of characters to remove
   */
  remove(start, length) {
    this.debug(_ => {
      return ['remove', {
        content: this.context.get(),
        op: [start, length]
      }];
    });

    this.context.remove(start, length);
    this.content = this.context.get();
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
  removeAllListeners(event) {
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
  removeListener(event, fn, context, once) {
    this.eventEmitter.removeListener(event, fn, context, once);
    return this;
  }

  /**
   * Bind to events on the connection and handle them.
   *
   * @private
   */
  bindConnectionEvents() {
    this.connection.on('connected', bind(this, 'onConnectionConnected'));
    this.connection.on('disconnected', bind(this, 'onConnectionDisconnected'));
  }

  /**
   * Get an editing context for the ShareJS document.
   *
   * @private
   * @return {ShareJS.Context} A ShareJS editing context
   */
  getDocumentContext() {
    const context = this.document.createContext();

    if (!context.provides.text) {
      throw new Error('Cannot attach to a non-text document');
    }

    context.detach = null;

    return context;
  }

  /**
   * Get a new ShareJS connection for this wrapper client.
   *
   * @private
   * @return {ShareJS.Connection} A ShareJS connection object
   */
  getShareJSConnection() {
    let connection = this.connection;

    if (connection) {
      connection.bindToSocket(this.socket);
    } else {
      connection = new ShareJS.Connection(this.socket);
    }

    this.setupSocketAuthentication();
    this.setupSocketPing();
    this.setupSocketOnMessage();

    return connection;
  }

  /**
   * Handle the ShareJS connection connecting successfully.
   *
   * @private
   */
  onConnectionConnected() {
    this.debug('connectionConnected');
    this.reconnectAttempts = 0;
    this.connected = true;
  }

  /**
   * Handle the ShareJS connection disconnecting by matching error codes.
   *
   * @private
   * @param {Event} event A disconnection event
   * @emits ShareJSWrapper#disconnect
   */
  onConnectionDisconnected(event) {
    this.debug('connectionDisconnected', ...arguments, event.code);
    this.connected = false;

    clearTimeout(this.pongWait);

    let error;
    switch (event.code) {
      case ABNORMAL:
      case LOCAL_TIMEOUT:
        if (this.reconnectAttempts > 5) {
          const reason = event.code === ABNORMAL ?
            'abnormal' : 'no_pong';
          error = new Error(reason);
        } else {
          this.reconnect();
        }

        break;
      case UNAUTHORIZED:
        error = new Error('forbidden');
        break;
      case NOT_FOUND:
        error = new Error('not_found');
        break;
      default:
        if (event.code !== NORMAL) {
          error = new Error('unexpected');
        }
    }

    if (error) {
      /**
       * An event emitted when the client has fatally disconnected and will no
       * longer attempt reconnects.
       *
       * Check `err.message` for "abnormal", "no_pong", "forbidden",
       * "not_found", or "unexpected".
       *
       * @event ShareJSWrapper#disconnect
       * @type {Error}
       */
      this.eventEmitter.emit('disconnect', error);
    }
  }

  /**
   * Handle a remote operation from the server to this client.
   *
   * @private
   * @param {number} retain The number of characters to retain before
   *   insert/remove
   * @param {(number|string)} value The value of the operation—a string for an
   *   insert or a number for a remove
   * @emits ShareJSWrapper#insert
   * @emits ShareJSWrapper#remove
   */
  onRemoteOperation(retain, value) {
    this.content = this.context.get();

    let type = 'remove';
    if (typeof value === 'string') {
      type = 'insert';
    }

    /**
     * An event emitted when the client receives an insert operation. Emits an
     * event with an exploded {@link ShareJSWrapper~Insert Insert} operation.
     *
     * @event ShareJSWrapper#insert
     * @param {number} retain The length being retained in the insert
     * @param {string} value The value being inserted
     */
    /**
     * An event emitted when the client receives a remove operation. Emits an
     * exploded {@link ShareJSWrapper~Remove Remove} operation.
     *
     * @event ShareJSWrapper#remove
     * @param {number} retain The length being retained in the insert
     * @param {number} value The length being removed
     */
    this.eventEmitter.emit(type, retain, value);
  }

  /**
   * Handle a pong by waiting a few seconds and sending another ping.
   *
   * @private
   */
  onSocketPong() {
    this.receivedPong = true;

    setTimeout(_ => {
      this.sendPing();
    }, 5000);
  }

  /**
   * Attempt to reconnect to the server, using a backoff algorithm.
   *
   * @private
   */
  reconnect() {
    this.reconnectAttempts = this.reconnectAttempts || 0;

    const attempts = this.reconnectAttempts;
    const time     = getInterval();

    setTimeout(_ => {
      this.reconnectAttempts = this.reconnectAttempts + 1;
      this.connect(null, true);
    }, time);

    function getInterval() { // eslint-disable-line require-jsdoc
      let max = (Math.pow(2, attempts) - 1) * 1000;

      if (max > 5 * 1000) {
        max = 5 * 1000;
      }

      return Math.random() * max;
    }
  }

  /**
   * Send a ping over the WebSocket, and await pong.
   *
   * @private
   */
  sendPing() {
    if (this.config.noPing) {
      return;
    }

    const { socket } = this;

    if (socket.readyState === socket.OPEN) {
      this.receivedPong = false;
      socket.send('ping');
      this.pongWait = setTimeout(_ => {
        if (!this.receivedPong) {
          this.socket.close(LOCAL_TIMEOUT);
        }
      }, 1000);
    }
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
  setupSocketAuthentication() {
    const { accessToken } = this.config;
    const { socket      } = this;

    const _onopen = bind(socket, 'onopen');
    socket.onopen = _ => {
      this.debug('sending auth token');

      socket.send(`auth-token:${accessToken}`);
      _onopen(...arguments);
    };
  }

  /**
   * Set up the message handler for the socket.
   *
   * ShareJS immediately sets `socket.onmessage`, so we override that and ensure
   * it does not try to parse messages like "pong".
   *
   * @private
   */
  setupSocketOnMessage() {
    const { socket } = this;

    const _onmessage = bind(socket, 'onmessage');
    socket.onmessage = function onMessage({ data }) {
      if (data === 'pong') {
        this.onSocketPong();
        return null;
      }

      return _onmessage(...arguments);
    }.bind(this);
  }

  /**
   * Set up a ping/pong cycle for this socket.
   *
   * @private
   */
  setupSocketPing() {
    const { socket } = this;

    const _onopen = bind(socket, 'onopen');
    socket.onopen = function onOpen() {
      this.sendPing();
      _onopen(...arguments);
    }.bind(this);
  }

  /**
   * Conditionally log a debug statement.
   *
   * @private
   */
  debug() {
    if (this.config.debug) {
      if (arguments.length === 1 && typeof arguments[0] === 'function') {
        console.log(...arguments[0]());
      } else {
        console.log(...arguments);
      }
    }
  }
}

/**
 * @private
 * @param {*} target The target of the method call
 * @param {string} method The name of the method to call
 * @return {*} The return value of the method call
 */
function bind(target, method) {
  return target[method].bind(target);
}
