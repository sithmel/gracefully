const DEFAULTS = {
  exitDelay: 50,
  stopWindow: 5000,
  logger: (message, err) => console.log(message, err),
};

const timeoutMessage = (tm, message) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(message), tm).unref();
  });

export default function onTerminate(shutdownFunction, options) {
  const { logger, customEvent, handleExceptions, stopWindow, exitDelay } = {
    ...DEFAULTS,
    ...options,
  };

  function shutDown(reason, code) {
    logger(`Received ${reason}. Attempting to shutdown gracefully.`);

    if (code != null) {
      process.exitCode = code;
    }

    if (customEvent) {
      process.removeListener(customEvent, stopListener);
    }
    process.removeListener("SIGINT", sigintListener);
    process.removeListener("SIGTERM", sigtermListener);
    if (handleExceptions) {
      process.removeListener("uncaughtException", uncaughtExceptionListener);
      process.removeListener("unhandledRejection", unhandledRejectionListener);
    }

    const timeoutFunction = timeoutMessage(
      stopWindow,
      `Graceful shutdown took more than stop window (${stopWindow} ms). Terminating process.`
    );

    return Promise.race([shutdownFunction(reason), timeoutFunction])
      .then((message) => {
        if (typeof message === "string") {
          logger(message);
        }
        exitSoon(code);
      })
      .catch((err) => {
        logger(
          "Failed to stop gracefully on " + reason + ". Terminating process.",
          err
        );
        exitSoon(1);
      });
  }

  function exitSoon(code) {
    setTimeout(() => process.exit(code), exitDelay).unref();
  }

  const stopListener = (payload) =>
    shutDown(`'${customEvent}'`, payload && payload.code);
  const sigintListener = () => shutDown("SIGINT");
  const sigtermListener = () => shutDown("SIGINT");

  const uncaughtExceptionListener = (err) => {
    console.error(err);
    shutDown("uncaughtException", 1);
  };
  const unhandledRejectionListener = (err) => {
    console.error(err);
    shutDown("unhandledRejection", 1);
  };

  if (customEvent) {
    process.once(customEvent, stopListener);
  }
  process.once("SIGINT", sigintListener);
  process.once("SIGTERM", sigtermListener);
  if (handleExceptions) {
    process.once("uncaughtException", uncaughtExceptionListener);
    process.once("unhandledRejection", unhandledRejectionListener);
  }
}
