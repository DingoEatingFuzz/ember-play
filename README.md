# ember-play

A build-free test runner for Ember apps.

## Features

1. Runs tests from your already running Ember app
2. Filter tests using the familiar `-f` or `--filter` flag
2. Watch tests with the `-f` or `--watch` flag
2. Quickly move to a browser with the `-b` or `--browswer` flag

## Compatibility

* Ember.js v3.16 or above
* Ember CLI v2.13 or above
* Node.js v10 or above

## Installation

```
ember install ember-play
```

## How does it work?
1. Ember Play uses Playwright to open the `/tests` route of your Ember app in a headless browser.
2. Your tests route uses the [Common Reporters Interface](https://github.com/js-reporters/js-reporters) to send all test output over the Live Reload websocket.
3. Playwright intercepts this websocket traffic and reports test output to your CLI.

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
