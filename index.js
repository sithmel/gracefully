const defaults = {
  exitDelay: 50,
  stopWindow: 5000,
  logger: (message, err) => console.log(message, err)
}

const isNil = (x) => typeof x === 'undefined' || x === null

const timeoutMessage = (tm, message) => new Promise((resolve) => {
  setTimeout(() => resolve(message), tm).unref()
})

function gracefully (shutdownFunction, options) {
  options = Object.assign({}, defaults, options)
  const logger = options.logger
  const customEvent = options.customEvent
  const handleExceptions = options.handleExceptions

  function shutDown (reason, code) {
    logger(`Received ${reason}. Attempting to shutdown gracefully.`)

    if (!isNil(code)) {
      process.exitCode = code
    }

    if (customEvent) {
      process.removeListener(customEvent, stopListener)
    }
    process.removeListener('SIGINT', sigintListener)
    process.removeListener('SIGTERM', sigtermListener)
    if (handleExceptions) {
      process.removeListener('uncaughtException', uncaughtExceptionListener)
      process.removeListener('unhandledRejection', unhandledRejectionListener)
    }

    const timeout = timeoutMessage(options.stopWindow, `Graceful shutdown took more than stop window (${options.stopWindow} ms). Terminating process.`)

    return Promise.race([shutdownFunction(reason), timeout])
      .then((message) => {
        if (typeof message === 'string') {
          logger(message)
        }
        exitSoon(code)
      })
      .catch(err => {
        logger('Failed to stop gracefully on ' + reason + '. Terminating process.', err)
        exitSoon(1)
      })
  }

  function exitSoon (code) {
    setTimeout(() => process.exit(code), options.exitDelay).unref()
  }

  const stopListener = (payload) => shutDown(`'${customEvent}'`, payload && payload.code)
  const uncaughtExceptionListener = (err) => shutDown('uncaughtException', 1)
  const unhandledRejectionListener = (err) => shutDown('unhandledRejection', 1)
  const sigintListener = shutDown.bind(null, 'SIGINT', undefined)
  const sigtermListener = shutDown.bind(null, 'SIGTERM', undefined)

  if (customEvent) {
    process.once(customEvent, stopListener)
  }
  process.once('SIGINT', sigintListener)
  process.once('SIGTERM', sigtermListener)
  if (handleExceptions) {
    process.once('uncaughtException',uncaughtExceptionListener)
    process.once('unhandledRejection',unhandledRejectionListener)
  }
}

module.exports = gracefully
