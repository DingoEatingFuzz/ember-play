'use strict';

const { chromium } = require('playwright');
const queryString = require('query-string');

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
    page.on('websocket', ws => {
      console.log('Opened a connection:', ws.url());
      ws.on('framesent', e => {
        const payload = JSON.parse(e.payload);
        if (payload.emberplay) {
          console.log(payload.type, payload.event);
          if (payload.type === 'runEnd') {
            WaitForRunner.resolve();
          }
        }
      });
    });

    await page.goto(url);
    await WaitForRunner.promise;
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
