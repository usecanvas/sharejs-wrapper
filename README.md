# ShareJS Wrapper

This is a wrapper around the somewhat confusing
[ShareJS API](https://github.com/share/ShareJS/tree/v0.7.40), and it also tries
to simplify handling disconnected WebSocket clients.

## Usage

The ShareJS Wrapper object is an event emitter. Create a wrapper, and the
wrapper should take care of setting itself up and emitting events at the proper
times.

```javascript
var ShareJSWrapper = require('sharejs-wrapper');

var share = new ShareJSWrapper({
  accessToken: user.apiAccessToken,
  canvasID: canvasID,
  realtimeURL: 'wss://api.usecanvas.com/realtime',
  orgID: orgID
});

// Tell the client to connect to the ShareJS server.
share.connect(function onConnect() {
  // Get the current content of the document.
  console.log(share.content);

  // Send insert/remove operations to the server.
  share.insert([0, 'insert some text']);
  share.remove([0, 'remove some text'.length]);

  // Handle an `insert` event from the server.
  share.on('insert', function onInsert(op) {
    // Handle an insert
  });

  // Handle a `remove` event from the server.
  share.on('remove', function onRemove(op) {
    // Handle a remove
  });
});

/*
 * Handle an unexpected disconnect event from the server. This happens when the
 * client disconnects without having `.disconnect()` called, and several
 * reconnection attempts fail.
 */
share.on('disconnect', function onDisconnect(err) {
  console.log(err.message);
});

// Manually disconnect the client.
share.disconnect();
```

## Example

An example can be found in
[`test/server/public/main.js`](https://github.com/usecanvas/sharejs-wrapper/blob/master/test/server/public/main.js).
