import EventEmitter from 'eventemitter3';
import ShareJS      from 'share/lib/client';

const ABNORMAL      = 1006;
const NORMAL        = 1000;
const NOT_FOUND     = 4040;
const UNAUTHORIZED  = 4010;
const LOCAL_TIMEOUT = 4011;

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
 */
export default class ShareJSWrapper {
  constructor(config) {
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
   */
  connect(callback) {
    const { canvasID, orgID, realtimeURL } = this.config;

    this.socket = new WebSocket(realtimeURL);
    this.connection = this.getShareJSConnection();
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
    this.debug('insert', ...arguments);
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
    this.debug('remove', ...arguments);
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
    this.connection.on('disconnected', bind(this, 'onConnectionDisonnected'));
  }

  /**
   * Get an editing context for the ShareJS document.
   *
   * @private
   * @return {ShareJS.Context}
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
   * @return {ShareJS.Connection}
   */
  getShareJSConnection() {
    const connection = new ShareJS.Connection(this.socket);
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
   * @emits ShareJSWrapper#disconnected
   */
  onConnectionDisonnected(event) {
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
       * @event ShareJSWrapper#disconnected
       * @type {Error}
       */
      this.eventEmitter.emit('disconnected', error);
    }
  }

  /**
   * Handle a remote operation from the server to this client.
   *
   * @private
   * @emits ShareJSWrapper#insert
   * @emits ShareJSWrapper#remove
   */
  onRemoteOperation(...op) {
    this.content = this.context.get();

    let type = 'remove';
    if (typeof value === 'string') {
      type = 'insert';
    }

    /**
     * An event emitted when the client receives an insert operation.
     *
     * An insert operation will look like `[0, "foo"]`.
     *
     * @event ShareJSWrapper#insert
     * @type {Array.<(number|string)>}
     */
    /**
     * An event emitted when the client receives a remove operation.
     *
     * A remove operation will look like `[0, 5]`.
     *
     * @event ShareJSWrapper#remove
     * @type {Array.<number>}
     */
    this.eventEmitter.emit(type, op);
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
      this.connect();
    }, time);

    function getInterval() {
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
        return;
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
      console.log(...arguments);
    }
  }
}

function bind(target, method) {
  return target[method].bind(target);
}
