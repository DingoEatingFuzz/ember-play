const EventEmitter = require('events');

class Runner extends EventEmitter {
  constructor(token) {
    super();
    this.token = token || true;
  }

  send(ev) {
    const payload = JSON.parse(ev.payload);
    if (payload.emberplay === this.token) {
      this.emit(payload.type, payload.event);
    }
  }
}

module.exports = Runner;
