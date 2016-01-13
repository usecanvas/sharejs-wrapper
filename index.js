import EventEmitter from 'eventemitter3';
import ShareJS      from 'share/lib/client';

const ABNORMAL     = 1006;
const NORMAL       = 1000;
const NOT_FOUND    = 4040;
const UNAUTHORIZED = 4010;

/**
 * @class ShareJSWrapper
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
   * Tell the wrapper client to connect to the configured ShareJS server.
   *
   * @example
   * share.connect(function onConnected() {
   *   console.log(share.content);
   * });
   *
   * @param {function} callback A callback to call once connected
   */
  connect(callback) {
    const { canvasID, orgID, realtimeURL } = this.config;

    this.socket = new WebSocket(realtimeURL);
    this.connection = this.getShareJSConnection();
    this.bindConnectionEvents();

    this.pingInterval = setInterval(function sendPing() {
      if (this.socket.readyState === this.socket.OPEN) {
        this.socket.send('ping');
      }
    }.bind(this), 3000);

    this.document = this.connection.get(orgID, canvasID);
    this.document.subscribe();

    this.document.whenReady(_ => {
      if (!this.document.type) {
        this.document.create('text');
      }

      this.context = this.getDocumentContext();
      this.context.onInsert = bind(this, 'onRemoteOperation');
      this.context.onRemove = bind(this, 'onRemoteOperation');

      this.content = this.document.snapshot;
      this.eventEmitter.emit('ready');

      if (callback) {
        callback();
      }
    });
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
    this.context.insert(offset, text);
    this.content = this.document.snapshot;
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
    this.context.remove(start, length);
    this.content = this.document.snapshot;
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

    context.onInsert = op => this.eventEmitter.emit('insert', op);
    context.onRemove = op => this.eventEmitter.emit('remove', op);
    context.detach   = null;

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
    this.setupSocketOnMessage();
    return connection;
  }

  /**
   * Handle the ShareJS connection connecting successfully.
   *
   * @private
   */
  onConnectionConnected() {
    this.connectionAttempts = 1;
    this.connected = true;
  }

  /**
   * Handle the ShareJS connection disconnecting by matching error codes.
   *
   * @private
   * @param {Event} event A disconnection event
   */
  onConnectionDisonnected(event) {
    this.connected = false;

    let error, reason;
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
   * Handle a remote operation from the server to this client.
   *
   * @private
   */
  onRemoteOperation(...op) {
    this.content = this.document.snapshot;

    let type = 'remove';
    if (typeof value === 'string') {
      type = 'insert';
    }

    this.eventEmitter.emit(type, op);
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

    socket._onopen = socket.onopen; // Override ShareJS's socket.onopen

    socket.onopen = function onSocketOpen() {
      socket.send(`auth-token:${accessToken}`);
      socket._onopen(...arguments); // Call ShareJS's socket.onopen
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

    socket._onmessage = socket.onmessage;
    socket.onmessage = function onSocketMessage(message) {
      if (message.data === 'pong') {
        return;
      }

      return socket._onmessage(message);
    };
  }
}

function bind(target, method) {
  return target[method].bind(target);
}
