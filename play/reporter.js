class Reporter {
  constructor(runner, ui) {

    // Run Events

    runner.on('runStart', ev => {
      if (ev.testCounts && ev.testCounts.total) {
        const total = ev.testCounts.total;
        ui.writeLine(`Running ${total} test${total !== 1 ? 's' : ''}...`);
      } else {
        ui.writeLine('Running tests...');
      }
    });

    runner.on('runEnd', ev => {
      ui.writeLine('');
      if (ev.status === 'failed') {
        ui.writeLine('Run failed.');
      } else if (ev.status === 'passed') {
        ui.writeLine('Run passed!');
      }

      ui.writeLine(`${ev.testCounts.total} test${ev.testCounts.total !== 1 ? 's' : ''} run in ${humanDuration(ev.runtime)}`);
      ui.writeLine(`Passes: ${ev.testCounts.passed}, Failures: ${ev.testCounts.failed}, Skipped: ${ev.testCounts.skipped}, Todo: ${ev.testCounts.todo}`);
    });

    // Suite Events

    runner.on('suiteStart', ev => {
      ui.writeLine('');

      const indent = ev.fullName.length - 1;
      ui.writeLine(`${space(indent)}${ev.name}`);
    });

    // Test Events

    runner.on('testEnd', ev => {
      const prefix = {
        passed: '✓',
        failed: '✗',
        skipped: ' SKIPPED: ',
        todo: ' TODO: ',
      }[ev.status];

      const indent = ev.fullName.length;
      if (ev.status === 'failed') {
        // But space around failed tests to make them stand out.
        ui.writeLine('');
      }
      ui.writeLine(`${space(indent)}${prefix} ${ev.name} [${humanDuration(ev.runtime)}]`);

      // Only list assertions when the test failed
      if (ev.status === 'failed') {
        ev.assertions.forEach(assertion => {
          if (assertion.passed) {
            ui.writeLine(`${space(indent + 1)}✓ ${assertion.message}`);
          } else {
            ui.writeLine(`${space(indent + 1)}✗ ${assertion.message}`);
            ui.writeLine('');
            ui.writeLine('Expected:');
            console.log(assertion.expected);
            ui.writeLine('');
            ui.writeLine('Actual:');
            console.log(assertion.expected);
            ui.writeLine('');
            ui.writeLine('Stack:');
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

module.exports = Reporter;
