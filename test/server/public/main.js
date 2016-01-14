(function() {
  'use strict';

  var ShareJSWrapper = window.ShareJSWrapper.default;

  // Create the editable shareJS connection
  var shareJSA = new ShareJSWrapper({
    accessToken: 'abc123',
    canvasID: '1',
    realtimeURL: 'ws://localhost:3000',
    orgID: '1',
    debug: true,
  });

  var shareJSB;
  shareJSA.connect(function onConnected() {
    areaA.value = shareJSA.content;

    areaA.removeAttribute('disabled');
    reconnect.setAttribute('disabled', true);
    disconnect.removeAttribute('disabled');

    // So that we don't try to create the document twice, we wait until
    // shareJSA has connected.
    shareJSB = new ShareJSWrapper({
      accessToken: 'abc123',
      canvasID: '1',
      realtimeURL: 'ws://localhost:3000',
      orgID: '1',
      noPing: true,
    });

    // Set the value of the listening text box on connect
    shareJSB.connect(function onConnected() {
      areaB.value = shareJSB.content;
    });

    // Set the value of the listening text box on remote operations
    shareJSB.on('insert', _op => areaB.value = shareJSB.content);
    shareJSB.on('remove', _op => areaB.value = shareJSB.content);
  });

  shareJSA.on('disconnected', function onDisconnected(err) {
    console.log('disconnected', err.message, err);
    areaA.setAttribute('disabled', true);
    disconnect.setAttribute('disabled', true);
    reconnect.removeAttribute('disabled');
  });

  // Create the connection that will just mirror content in this example
  var areaA      = document.querySelector('#area-a');
  var areaB      = document.querySelector('#area-b');
  var disconnect = document.querySelector('#disconnect');
  var reconnect  = document.querySelector('#reconnect');

  // Listen for input events on the editable textarea and generate ops
  areaA.addEventListener('input', function onChange(_event) {
    var newText = areaA.value;
    var oldText = shareJSA.content;
    applyChange(shareJSA, oldText, newText);
  });

  disconnect.addEventListener('click', function onClick() {
    shareJSA.disconnect();
    areaA.setAttribute('disabled', true);
    disconnect.setAttribute('disabled', true);
    reconnect.removeAttribute('disabled');
  });

  reconnect.addEventListener('click', function onClick() {
    shareJSA.connect();
  });

  /*
   * Some clients may generate operations without diffing if they know where
   * the cursor is at all times. This example uses text diffing to generate
   * insert and remove operations.
   */
  function applyChange(shareJS, oldText, newText) {
    if (newText === oldText) {
      return;
    }

    let commonStart = 0;
    while (oldText.charAt(commonStart) === newText.charAt(commonStart)) {
      commonStart++;
    }

    let commonEnd = 0;
    while (oldText.charAt(oldText.length - 1 - commonEnd) === newText.charAt(newText.length - 1 - commonEnd) &&
          commonEnd + commonStart < oldText.length && commonEnd + commonStart < newText.length) {
      commonEnd++;
    }

    if (oldText.length !== commonStart + commonEnd) {
      shareJS.remove(commonStart, oldText.length - commonStart - commonEnd);
    }

    if (newText.length !== commonStart + commonEnd) {
      shareJS.insert(commonStart, newText.slice(commonStart, newText.length - commonEnd));
    }
  }
}());
