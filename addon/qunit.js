import EventEmitter from 'events';

export default class QUnitAdapter extends EventEmitter {
  constructor(qunit) {
    super();

    // QUnit already supports the Common Reporter Interface. Just pipe on through.
    const events = ['runStart', 'runEnd', 'suiteStart', 'suiteEnd', 'testStart', 'testEnd'];
    for (const ev of events) {
      qunit.on(ev, d => this.emit(ev, d));
    }
  }
}
