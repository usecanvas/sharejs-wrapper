import ShareJSWrapper from '..';
import { expect }     from 'chai';
import { server }     from './test-helper';

describe('ShareJSWrapper', () => {
  let canvasID = 0;
  let clientA, clientB;
  beforeEach(done => {
    canvasID++;

    clientA = new ShareJSWrapper({
      accessToken: 'tokenA',
      canvasID: canvasID.toString(),
      realtimeURL: `ws://localhost:${server.address().port}`,
      orgID: 'orgID',
    });

    clientB = new ShareJSWrapper({
      accessToken: 'tokenB',
      canvasID: canvasID.toString(),
      realtimeURL: `ws://localhost:${server.address().port}`,
      orgID: 'orgID',
    });

    clientA.connect(_ => clientB.connect(done));
  });

  afterEach(() => {
    clientA.disconnect();
    clientB.disconnect();
  });

  describe('#insert', () => {
    it('sends an insert event', done => {
      clientB.on('insert', (retain, value) => {
        expect([retain, value]).to.eql([0, 'Foo']);
        done();
      });

      clientA.insert(0, 'Foo');
    });
  });

  describe('#remove', () => {
    it('sends a remove event', done => {
      clientB.on('remove', (retain, length) => {
        expect([retain, length]).to.eql([0, 10]);
        done();
      });

      clientA.remove(0, 10);
    });
  });
});
