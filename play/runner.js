'use strict';

const { chromium } = require('playwright');
const queryString = require('query-string');

class QUnitAdapter {
  getHandle = () => window.QUnit;
  setup = () => {
    window.emitTestMessage = (type, ...args) => {
      console.log('$$EMIT$$', type, ...args);
    };
  };
  getQueue = qunit => qunit.config.queue;
  bindReporter = qunit => {
    const socket = window.LiveReload.connector.socket;
    const pub = args => {
      socket.send(JSON.stringify({ testrunner: true, args }));
    };

    qunit.on('runStart', ev => {
      window.emitTestMessage('start', 'Starting test suite...');
      pub(ev);
    });

    qunit.on('suiteStart', ev => {
      window.emitTestMessage('suite', ev.fullName.join(' > '), ev);
      pub(ev);
    });

    qunit.on('testEnd', ev => {
      const prefix = {
        passed: '✓',
        failed: '✗',
        skipped: ' SKIPPED: ',
        todo: ' TODO: ',
      }[ev.status];

      const indent = 2 + ev.fullName.length;
      window.emitTestMessage('test', ev.status, `${' '.repeat(indent)}${prefix} ${ev.name}`, ev);
      pub(ev);
    });
  };
  run = qunit => {
    qunit.start();
    return new Promise(resolve => {
      qunit.on('runEnd', resolve);
    });
  };
}

const adapterForFramework = framework => {
  const mapping = {
    qunit: QUnitAdapter,
  };

  return mapping[framework];
};

class Runner {
  constructor({ host, framework, ui }) {
    this.host = host;
    this.framework = framework;
    this.ui = ui;

    const Adapter = adapterForFramework(this.framework);
    if (!Adapter) {
      ui.writeError(`No adapter found for framework ${this.framework}`);
    } else {
      this.adapter = new Adapter();
    }
  }

  async run(filter) {
    if (!this.adapter) return;

    const { ui, adapter } = this;
    const params = { __newrunner: true };
    if (filter) {
      params.filter = filter;
    }

    ui.writeLine('Launching Chrome...');
    const browser = await chromium.launch({});

    const url = `${appendPath(this.host, 'tests')}?${queryString.stringify(params)}`;
    ui.writeLine(`Opening ${url}...`);
    const page = await browser.newPage();

    // Listen to page console to report test status
    const cdpClient = await page.context().newCDPSession(page);
    cdpClient.send('Runtime.enable');
    cdpClient.on('Runtime.consoleAPICalled', entry => {
      if (isValidMessage(entry)) {
        this.print(entry.args.slice(1).map(a => a && a.value));
      }
    });
    page.on('websocket', ws => {
      console.log('Opened a connection:', ws.url());
      ws.on('framesent', e => {
        const payload = JSON.parse(e.payload);
        if (payload.testrunner) {
          console.log(payload.args);
        }
      });
    });

    await page.goto(url);

    // Capture a handle to the reporter object
    const reporterHandle = await page.evaluateHandle(adapter.getHandle);
    await reporterHandle.evaluate(adapter.setup);
    await reporterHandle.evaluate(adapter.bindReporter);

    await reporterHandle.evaluate(adapter.run);
  }

  print([type, ...args]) {
    const ui = this.ui;

    if (['start', 'end'].includes(type)) {
      ui.writeLine(args[0]);
    } else if (type === 'suite') {
      ui.writeLine('');
      ui.writeLine(args[0]);
    } else if (type === 'test') {
      const level = {
        failed: 'ERROR',
        skipped: 'DEBUG',
        todo: 'WARNING',
      }[args[0]];

      ui.writeLine(args[1], level);
    }
  }
}

function isValidMessage(entry) {
  return entry.type === 'log' && entry.args[0] && entry.args[0].value === '$$EMIT$$';
}

function appendPath(base, path) {
  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }
  if (path.startsWith('/')) {
    path = path.slice(1);
  }

  return `${base}/${path}`;
}

module.exports = Runner;
