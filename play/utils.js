module.exports = {
  resetLine() {
    if (process.stdout.isTTY) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
    }
  }
}
