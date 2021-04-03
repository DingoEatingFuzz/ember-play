'use strict';

const { chromium } = require('playwright');
const queryString = require('query-string');
const EventEmitter = require('events');

class TestRunner extends EventEmitter {
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

class Reporter {
  constructor(runner, ui) {
    runner.on('suiteStart', ev => {
      ui.writeLine('');
      ui.writeLine(ev.fullName.join(' > '));
    });

    runner.on('testEnd', ev => {
      const prefix = {
        passed: '✓',
        failed: '✗',
        skipped: ' SKIPPED: ',
        todo: ' TODO: ',
      }[ev.status];

      const indent = 2 + ev.fullName.length;
      ui.writeLine(`${' '.repeat(indent)}${prefix} ${ev.name}`);
    });
  }
}

class CoPromise {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

class Runner {
  constructor({ host, framework, ui }) {
    this.host = host;
    this.framework = framework;
    this.ui = ui;
  }

  async run(filter) {
    const ui = this.ui;
    const params = { __emberplay: true };
    if (filter) {
      params.filter = filter;
    }

    ui.writeLine('Launching Chrome...');
    const browser = await chromium.launch({ headless: true });

    const url = `${appendPath(this.host, 'tests')}?${queryString.stringify(params)}`;
    ui.writeLine(`Opening ${url}...`);
    const page = await browser.newPage();

    const WaitForRunner = new CoPromise();
    const runner = new TestRunner();
    const reporter = new Reporter(runner, ui);
    runner.on('runEnd', () => WaitForRunner.resolve());

    page.on('websocket', ws => {
      ws.on('framesent', e => {
        runner.send(e);
      });
    });

    await page.goto(url);
    await WaitForRunner.promise;
  }
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
