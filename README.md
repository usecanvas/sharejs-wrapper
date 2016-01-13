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

var wrapper = new ShareJSWrapper({
  accessToken: user.apiAccessToken,
  canvasID: canvasID,
  realtimeURL: 'https://api.usecanvas.com/realtime',
  orgID: orgID
});

wrapper.on('ready', function onReady() {
  // The ShareJS document is ready to use.

  wrapper.on('insert', function onInsert(op) {
  });

  wrapper.on('remove', function onRemove(op) {
  });
});

wrapper.on('disconnect', function onDisconnect(error, reason) {
  if (error) {
    // Unexpected disconnection...
  }
});
```
