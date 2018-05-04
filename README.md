gracefully
==========
gracefully runs a function when you shutdown a node application (via signals).

usage
-----
```js
gracefully(shutdown, options)
```
* **shutdown** is a function returning a promise
* **options**:

* exitDelay (default 50): after shutting down I wait a certain amount of time before calling process.exit
* stopWindow: (default: 5000): if the shutdown function takes more than this time, the process exit anyway
* logger (default console.log): a function taking a string and an optional error. It is called for logging
* customEvent (optional): the gracefully listen to this event (emitted by the process), to shutdown the process

signals and events handled
--------------------------
At the moment gracefully will handle SIGINT and SIGTERM signals, as well as a custom event emitted on process. On receiving them, it will attempt to stop the system gracefully.
