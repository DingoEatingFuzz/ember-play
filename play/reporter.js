const chalk = require('chalk');

class Spinner {
  constructor(ui, colorfn) {
    const passthrough = k => k;
    this.ui = ui;
    this.colorfn = colorfn || passthrough;
    this.frames = "_ _ _ - ` ` ' ´ - _ _ _".split(' ');
    this.frame = 0;

    process.on('SIGINT', () => {
      this.stop();
    });
  }

  spinner() {
    this.frame = (this.frame + 1) % this.frames.length;
    return this.colorfn(this.frames[this.frame]);
  }

  start(msg, prefix = '') {
    this.ui.write(prefix + this.spinner() + ' ' + msg);
    this.interval = setInterval(() => {
      resetLine();
      this.ui.write(prefix + this.spinner() + ' ' + msg);
    }, 70);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      resetLine();
    }
    this.frame = 0;
  }
}

class Reporter {
  constructor(runner, ui) {
    this.spinner = new Spinner(ui, chalk.yellow);

    // Run Events

    runner.on('runStart', ev => {
      if (ev.testCounts && ev.testCounts.total) {
        const total = ev.testCounts.total;
        ui.writeLine(`Running ${chalk.bold(total)} test${total !== 1 ? 's' : ''}...`);
      } else {
        ui.writeLine('Running tests...');
      }
    });

    runner.on('runEnd', ev => {
      ui.writeLine('');
      if (ev.status === 'failed') {
        ui.writeLine(chalk.red.bold('Run failed.'));
      } else if (ev.status === 'passed') {
        ui.writeLine(chalk.green.bold('Run passed!'));
      }

      ui.writeLine(`${chalk.bold(ev.testCounts.total)} test${ev.testCounts.total !== 1 ? 's' : ''} run in ${chalk.bold(humanDuration(ev.runtime))}`);
      const lines = [
        `Passes: ${ev.testCounts.passed > 0 ? chalk.green.bold(ev.testCounts.passed) : '0' }`,
        `Failures: ${ev.testCounts.failed > 0 ? chalk.red.bold(ev.testCounts.failed) : '0'}`,
        `Skipped: ${ev.testCounts.skipped > 0 ? chalk.gray.bold(ev.testCounts.skipped) : '0'}`,
        `Todo: ${ev.testCounts.todo > 0 ? chalk.yellow.bold(ev.testCounts.todo) : '0'}`
      ];
      ui.writeLine(lines.join(', '));
    });

    // Suite Events

    runner.on('suiteStart', ev => {
      ui.writeLine('');

      const indent = Math.max(0, ev.fullName.length - 1);
      ui.writeLine(`${space(indent)}${ev.name}`);
    });

    // Test Events

    runner.on('testStart', ev => {
      const indent = ev.fullName.length;
      this.spinner.start(chalk.gray(ev.name), space(indent));
    });

    runner.on('testEnd', ev => {
      this.spinner.stop();

      const prefix = {
        passed: '✓',
        failed: '✗',
        skipped: 'SKIPPED:',
        todo: 'TODO:',
      }[ev.status];
      const color = {
        passed: chalk.green,
        failed: chalk.red,
        skipped: chalk.gray,
        todo: chalk.yellow,
      }[ev.status];

      const indent = ev.fullName.length;
      const line = color(`${space(indent)}${prefix} ${ev.name}`)
      const timing = chalk.gray(humanDuration(ev.runtime));

      if (ev.status === 'failed') {
        // But space around failed tests to make them stand out.
        ui.writeLine('');
      }
      ui.writeLine(`${line} ${timing}`);

      // Only list assertions when the test failed
      if (ev.status === 'failed') {
        ev.assertions.forEach(assertion => {
          if (assertion.passed) {
            ui.writeLine(chalk.green(`${space(indent + 1)}✓ ${assertion.message}`));
          } else {
            ui.writeLine(chalk.red(`${space(indent + 1)}✗ ${assertion.message}`));
            ui.writeLine('');
            ui.writeLine(chalk.white('Expected:'));
            console.log(assertion.expected);
            ui.writeLine('');
            ui.writeLine(chalk.white('Actual:'));
            console.log(assertion.expected);
            ui.writeLine('');
            ui.writeLine(chalk.white('Stack:'));
            console.log(assertion.stack);
          }
        });
        ui.writeLine('');
      }
    });
  }
}

function space(len) {
  return '  '.repeat(len);
}

function humanDuration(duration) {
  duration = Math.round(duration);
  const ms = duration % 1000;
  const s = Math.floor((duration / 1000) % 60);
  const m = Math.floor(duration / 1000 / 60);

  const fs = s < 10 ? `0${s}` : `${s}`;
  const fms = ms < 10 ? `00${ms}` : ms < 100 ? `0${ms}` : `${ms}`;

  if (m) return `${m}m ${fs}s ${fms}ms`;
  else if (s) return `${fs}s ${fms}ms`;
  return `${ms}ms`;
}

function resetLine() {
  if (process.stdout.isTTY) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
  }
}

module.exports = Reporter;
