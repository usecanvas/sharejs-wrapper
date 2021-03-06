'use strict';

var ARGV        = require('optimist').argv;
var Connect     = require('connect');
var Duplex      = require('stream').Duplex;
var HTTP        = require('http');
var LiveDB      = require('livedb');
var Path        = require('path');
var ShareJS     = require('share');
var WS          = require('ws');
var serveStatic = require('serve-static');

var app = new Connect();
app.use(serveStatic(Path.join(__dirname, './public')));
app.use(serveStatic(Path.join(__dirname, '../../dist')));
app.use(serveStatic(ShareJS.scriptsDir));

var backend  = LiveDB.client(LiveDB.memory())
var shareJS  = ShareJS.server.createClient({ backend: backend });
var server   = HTTP.createServer(app);
var wsServer = new WS.Server({ server: server });

wsServer.on('connection', function onConnection(client) {
  var stream = new Duplex({ objectMode: true });
  stream._write = function stream__write(chunk, encoding, callback) {
    log('server -> client\n ', chunk, '\n');
    clientSend(JSON.stringify(chunk));
    callback();
  };

  stream._read = function stream__read() {};

  stream.headers = client.upgradeReq.headers;
  stream.remoteAddress = client.upgradeReq.connection.remoteAddress;

  client.on('message', function onMessage(msg) {
    log('client -> server\n ', msg, '\n');

    if (msg === 'ping') {
      clientSend('pong');
      log('server -> client\n', 'pong\n');
      return;
    }

    if (/^auth-token/.test(msg)) {
      return;
    }

    stream.push(JSON.parse(msg));
  });

  stream.on('error', function onError(err) {
    client.close(err);
  });

  client.on('close', function onClose(reason) {
    stream.push(null);
    stream.emit('close');
    log('client went away');
    client.close(reason);
  });

  stream.on('end', function onEnd() {
    client.close();
  });

  shareJS.listen(stream);

  function clientSend(message) {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  }
});

var port = ARGV.p || 3000;

if (process.env.NODE_ENV === 'test') {
  exports.server = server;

  exports.listen = function listen(cb) {
    server.listen(port, function onListening() {
      log('listening on port', this.address().port);
      cb();
    });
  };
} else {
  server.listen(port, function onListening() {
    log('listening on port', this.address().port);
  });
}

function log() {
  if (process.env.NODE_ENV !== 'test') {
    console.log.apply(console, arguments);
  }
}
