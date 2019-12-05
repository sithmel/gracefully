const uuid = require('uuid/v1')

function Runner () {
  this._isShuttingDown = false
  this.running = {}
}

Runner.prototype.wrap = function runnerWrap (func) {
  const runner = this

  return function (...args) {
    if (runner._isShuttingDown) {
      return Promise.reject(new Error('Shutting down'))
    }
    const runId = uuid()

    const promise = func(...args)
      .then((res) => {
        delete runner.running[runId]
        return Promise.resolve(res)
      })
      .catch((err) => {
        delete runner.running[runId]
        return Promise.reject(err)
      })
    runner.running[runId] = promise
    return promise
  }
}

Runner.prototype.shutdown = function runnerShutdown () {
  this._isShuttingDown = true

  return Promise.all(Object.keys(this.running)
    .map((key) => this.running[key].catch(() => Promise.resolve(null))))
}

Runner.prototype.flush = function runnerFlush () {
  this.shutdown()
    .then(() => {
      this._isShuttingDown = false
    })
}

Runner.prototype.length = function runnerLength () {
  return Object.keys(this.running).length
}

module.exports = Runner
