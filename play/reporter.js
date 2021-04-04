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


module.exports = Reporter;
