import { autoRegister } from 'js-reporters';

class WebSocketReporter {
  constructor(runner, socket, options = {}) {
    // Socket can be a reference to a web socket or an address to make a web socket from
    // e.g., ws://localhost:1111
    if (socket instanceof window.WebSocket) {
      this.socket = socket;
    } else {
      this.socket = new window.WebSocket(socket);
    }

    // Optionally set a token to verify events on the receiving end
    const token = options.token || true;

    // Pipe all event data as is through the web socket
    const events = ['runStart', 'runEnd', 'suiteStart', 'suiteEnd', 'testStart', 'testEnd'];
    for (const ev of events) {
      runner.on(ev, d => this.socket.send(JSON.stringify({
        emberplay: token,
        type: ev,
        event: d,
      })));
    }
  }

  static init(runner, socket) {
    return new WebSocketReporter(runner, socket);
  }
}

export default function setup() {
  // Don't do anything unless ember play has been opted into.
  const enabled = !/[?&]__emberplay/.test(window.location.search);
  if (!enabled) return;

  // Discover the test runner (QUnit, Mocha, Jasmine, or anything js-reporters supports)
  const runner = autoRegister();

  // Use the existing live reload socket to sink test output to
  const socket = window.LiveReload.connector.socket;

  if (runner && socket) {
    WebSocketReporter.init(runner, socket);
  } else {
    throw new Error('A runner and a live reload socket are both needed.');
  }
}
