# ShareJS Wrapper

**AIN'T READY**

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

share.conect(function onConnect() {
  // The ShareJS document is ready to use.

  share.insert([0, 'insert some text']);
  share.remove([0, 'insert some text'.length]);

  share.on('insert', function onInsert(op) {
    // Handle an insert
  });

  share.on('remove', function onRemove(op) {
    // Handle a remove
  });
});
```

## Example

An example can be found in
[`test/server/public/main.js`](https://github.com/usecanvas/sharejs-wrapper/blob/master/test/server/public/main.js).
