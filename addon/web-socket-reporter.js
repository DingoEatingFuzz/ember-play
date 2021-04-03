export default class WebSocketReporter {
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
