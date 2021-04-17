'use strict';
const Play = require('./play');

module.exports = {
  name: require('./package').name,

  isDevelopingAddon() {
    return true;
  },

  includedCommands() {
    return {
      play: {
        name: 'play',
        works: 'insideProject',
        description:
          'Run tests faster by relaying the output from the /tests route to stdout',
        availableOptions: [
          { name: 'filter', type: String, default: false, aliases: ['f'] },
          { name: 'watch', type: Boolean, default: false, aliases: ['w'] },
        ],

        async run({ filter, watch }) {
          this.ui.writeLine("Ember Play starting...");
          const env = this.project.config(this.environment);
          const framework = determineTestFramework(this.project);
          if (!framework) {
            this.ui.writeError(
              'Could not determine your test framework! Are you not using QUnit or Mocha?'
            );
            return;
          }

          // TODO: Figure out the proper way to build this URL
          const port = process.env.port || 4200;
          const host = `http://localhost:${port}`;

          const play = new Play({
            framework,
            host: host + env.rootURL,
            ui: this.ui,
            filter,
            watch,
          });

          await play.run();
        },
      },
    };
  },
};

function determineTestFramework(project) {
  const frameworks = [
    { name: 'qunit', pkg: 'ember-qunit' },
    { name: 'mocha', pkg: 'ember-mocha' },
  ];

  for (const framework of frameworks) {
    if (project.findAddonByName(framework.pkg)) return framework.name;
  }

  return null;
}
