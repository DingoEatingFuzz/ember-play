'use strict';

const { chromium } = require('playwright');
const chalk = require('chalk');
const queryString = require('query-string');
const Runner = require('./runner');
const Reporter = require('./reporter');
const { resetLine } = require('./utils');

class CoPromise {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

class Play {
  firstRun = true;

  constructor({ host, framework, ui, watch }) {
    this.host = host;
    this.framework = framework;
    this.ui = ui;
    this.watch = watch;
  }

  async run(filter) {
    const ui = this.ui;
    const params = { __emberplay: true };
    if (filter) {
      params.filter = filter;
    }
    const url = `${appendPath(this.host, 'tests')}?${queryString.stringify(params)}`;

    ui.writeLine('Launching Chrome...');
    const browser = await chromium.launch({ headless: true });

    ui.writeLine(`Opening ${url}...`);
    const page = await browser.newPage();

    ui.writeLine('');
    const WaitForRunner = new CoPromise();
    const runner = new Runner();
    const reporter = new Reporter(runner, ui);

    runner.on('runEnd', () => {
      if (this.watch) {
        ui.writeLine('');
        ui.write(chalk.yellow('Watching tests. ^C to Quit'));
      } else {
        WaitForRunner.resolve();
      }
    })

    page.on('websocket', ws => {
      ws.on('framesent', e => {
        runner.send(e);
      });
    });

    if (this.watch) {
      page.on('framenavigated', () => {
        if (!this.firstRun) {
          resetLine();
          ui.writeLine(chalk.yellow('Livereload, restarting tests.'));
          ui.writeLine('');
        } else {
          this.firstRun = false;
        }
      });
    } else {
      process.on('SIGINT', () => {
        this.ui.writeLine('');
        this.ui.writeWarnLine('SIGINT, Exiting early');
      });
    }

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

module.exports = Play;
