import QUnitAdapter from './qunit';
import WebSocketReporter from './web-socket-reporter';

export default function setup() {
  // Don't do anything unless ember play has been opted into.
  const enabled = /[?&]__emberplay/.test(window.location.search);
  if (!enabled) return;

  // Discover the test runner
  let runner;
  if (window.QUnit) {
    runner = new QUnitAdapter(QUnit);
  } else if (window.mocha) {
    // TODO: Make a Mocha adapter
  }

  if (!runner) {
    console.warn('Could not discover a test runner. Ember Play has aborted');
  }

  // Use the existing live reload socket to sink test output to
  const socket = window.LiveReload.connector.socket;
  console.log('EMBER PLAY: socket', socket);

  if (runner && socket) {
    WebSocketReporter.init(runner, socket);
  } else {
    throw new Error('A runner and a live reload socket are both needed.');
  }
}
