import Server    from './server';
import WebSocket from 'ws';

global.WebSocket = WebSocket;

before(done => {
  Server.listen(done);
});

export const server = Server.server;
