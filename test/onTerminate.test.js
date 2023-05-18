const assert = require("assert");
const { describe, it, beforeEach, afterEach } = require("zunit");
const onTerminate = require("../index.js");

describe("onTerminate", function () {
  const quickOpts = {
    exitDelay: 1,
    stopWindow: 5,
    customEvent: "custom-stop",
  };

  let exit;
  let started;

  const shutdown = () =>
    new Promise((resolve) => {
      setTimeout(() => {
        started = false;
        resolve();
      }, 2);
    });

  const shutdownLong = () =>
    new Promise((resolve) => {
      setTimeout(() => {
        started = false;
        resolve();
      }, 200);
    });

  beforeEach(() => {
    exit = process.exit;
    process.exitCode = undefined;
    started = true;
  });

  afterEach(() => {
    process.removeAllListeners();
    process.exit = exit;
  });

  describe("'custom-stop' handling", () => {
    it("stops system gracefully", (done) => {
      const requestedCode = 2;

      process.exit = function (code) {
        assert.strictEqual(code, requestedCode);
        assert(!started);
        done();
      };

      onTerminate(shutdown, quickOpts);
      process.emit("custom-stop", { code: requestedCode });
    });

    it("terminates system when graceful shutdown fails", (done) => {
      process.exit = function (code) {
        assert.strictEqual(code, 1);
        done();
      };

      onTerminate(() => Promise.reject(new Error("Boom!")), quickOpts);
      process.emit("custom-stop", { code: 2 });
    });
  });

  Array.from(["SIGINT", "SIGTERM"]).forEach(function (signal) {
    describe(signal + " handling", function () {
      it("stops system gracefully", (done) => {
        process.exit = function (code) {
          assert.isUndefined(code);
          assert(!started);
          done();
        };

        onTerminate(shutdown, quickOpts);
        process.emit(signal);
      });

      it("terminates system when not shut down gracefully in stop window", (done) => {
        process.exit = function (code) {
          assert.isUndefined(code);
          done();
        };

        onTerminate(shutdownLong, quickOpts);
        process.emit(signal);
      });

      it("terminates system when graceful shutdown fails", (done) => {
        process.exit = function (code) {
          assert.strictEqual(code, 1);
          done();
        };
        onTerminate(() => Promise.reject(new Error("Boom!")), quickOpts);
        process.emit(signal);
      });
    });
  });
});
