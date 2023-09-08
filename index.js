//@ts-check

/**
 * @typedef {object} Options
 * @property {number} [exitDelay]
 * @property {number} [stopWindow]
 * @property {string} [customEvent]
 * @property {boolean} [handleExceptions]
 */
const DEFAULTS = {
  exitDelay: 50,
  stopWindow: 5000,
  customEvent: null,
  handleExceptions: false,
};

/**
 * @param {number} tm
 * @param {string} message
 * @return {Promise<string>}
 */
function timeoutMessage(tm, message) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(message), tm).unref();
  });
}

/**
 * @param {(args0: string) => Promise<void>} shutdown
 * @param {Options} options
 * @return {void}
 */
function onTerminate(shutdown, options) {
  const { exitDelay, stopWindow, customEvent, handleExceptions } = {
    ...DEFAULTS,
    ...options,
  };
  const exitSoon = (/** @type {number | undefined} */ code) => {
    setTimeout(() => process.exit(code), exitDelay).unref();
  };

  /**
   * @param {string} reason
   * @param {number | undefined} [code]
   */
  function _shutDownHandler(reason, code) {
    if (code != null) {
      process.exitCode = code;
    }
    _detachListeners();
    const timeoutFunction = timeoutMessage(
      stopWindow,
      `Graceful shutdown took more than stop window (${stopWindow} ms). Terminating process.`
    );

    return Promise.resolve()
      .then(() => Promise.race([shutdown(reason), timeoutFunction]))
      .then(() => exitSoon(code))
      .catch((err) => {
        Promise.resolve().then(() => exitSoon(1));
      });
  }
  // event handlers
  /**
   * @param {{ code: any; }} payload
   */
  function _stopListener(payload) {
    _shutDownHandler(`'${customEvent}'`, payload && payload.code);
  }
  function _sigintListener() {
    _shutDownHandler("SIGINT");
  }
  function _sigtermListener() {
    _shutDownHandler("SIGTERM");
  }
  /**
   * @param {Error} err
   */
  function _uncaughtExceptionListener(err) {
    console.error(err);
    _shutDownHandler("uncaughtException", 1);
  }
  /**
   * @param {Error} err
   */
  function _unhandledRejectionListener(err) {
    console.error(err);
    _shutDownHandler("unhandledRejection", 1);
  }

  // attach/detach listeners
  function _attachListeners() {
    if (customEvent) {
      process.once(customEvent, _stopListener);
    }
    process.once("SIGINT", _sigintListener);
    process.once("SIGTERM", _sigtermListener);
    if (handleExceptions) {
      process.once("uncaughtException", _uncaughtExceptionListener);
      process.once("unhandledRejection", _unhandledRejectionListener);
    }
  }

  function _detachListeners() {
    if (customEvent) {
      process.removeListener(customEvent, _stopListener);
    }
    process.removeListener("SIGINT", _sigintListener);
    process.removeListener("SIGTERM", _sigtermListener);
    if (handleExceptions) {
      process.removeListener("uncaughtException", _uncaughtExceptionListener);
      process.removeListener("unhandledRejection", _unhandledRejectionListener);
    }
  }

  _attachListeners();
}

module.exports = onTerminate;
