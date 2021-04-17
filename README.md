# ember-play

A build-free test runner for Ember apps.

## Features

1. Runs tests from your already running Ember app
2. Filter tests using the familiar `-f` or `--filter` flag
3. Watch tests with the `-w` or `--watch` flag
4. (Soon!) Quickly move to a browser with the `-b` or `--browswer` flag
5. (Soon!) Mocha support, with automatic detection

## Compatibility

* Ember.js v3.16 or above
* Ember CLI v2.13 or above
* Node.js v10 or above

## Installation

```
ember install ember-play
```

## Usage

**Step 1: Modify your `test-helper.js` file to instrument the tests page.**

```js
import emberPlaySetup from 'ember-play';

// ... other stuff ...

emberPlaySetup();
```

**Step 2: Make sure you are running the Ember server.**

If you're like me, this is pretty much always running.

```shellsession
$ ember serve
```

**Step 3: Run `ember play` in another terminal session.**

```shellsession
$ ember play -f "acceptance | jobs list"
Ember Play starting...
Launching Chrome...
Opening http://localhost:4200/tests?__emberplay=true&filter=acceptance%20%7C%20jobs%20list...

Running 41 tests...

Acceptance | jobs list
    ✓ it passes an accessibility audit 769ms
    ✓ visiting /jobs 306ms
    ✓ /jobs should list the first page of jobs sorted by modify index 02s 025ms
    ✓ each job row should contain information about the job 442ms
```

## How does it work?
1. Ember Play uses Playwright to open the `/tests` route of your Ember app in a headless browser.
2. Your tests route uses the [Common Reporters Interface](https://github.com/js-reporters/js-reporters) to send all test output over the Live Reload websocket.
3. Playwright intercepts this websocket traffic and reports test output to your CLI.

## Troubleshooting

**Nothing runs**

If this happens it's probably because you aren't building tests in the dev environment. Tests will build in dev by default, but sometimes this is disabled
to speed up dev builds. Check your `ember-cli-build.js` file to make sure `tests` is set to `true` (or at least not set to `false`) in the `EmberApp` constructor.

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
