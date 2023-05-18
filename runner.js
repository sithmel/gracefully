export default class Runner {
  constructor() {
    this._isShuttingDown = false;
    this.running = new Set();
  }
  wrap(func) {
    return (...args) => {
      if (this._isShuttingDown) {
        return Promise.reject(new Error("Shutting down"));
      }

      const promise = func(...args)
        .then((res) => {
          this.running.delete(promise);
          return Promise.resolve(res);
        })
        .catch((err) => {
          this.running.delete(promise);
          return Promise.reject(err);
        });
      this.running.add(promise);
      return promise;
    };
  }
  shutdown() {
    this._isShuttingDown = true;

    return Promise.all(
      Array.from(this.running).map((promise) =>
        promise.catch(() => Promise.resolve(null))
      )
    );
  }
  flush() {
    this.shutdown().then(() => {
      this._isShuttingDown = false;
    });
  }

  length() {
    return this.running.size;
  }
}
