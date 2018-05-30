gracefully
==========
gracefully contains a couple of utility functions that allow you to shutdown an application ... gracefully.


onTerminate
-----------
onTerminate runs a function when you shutdown a node application (via signals).
```js
const onTerminate = require('gracefully').onTerminate
onTerminate(shutdown, options)
```
* **shutdown** is a function returning a promise. The function gets as a first argument a string with the "reason". That can be either: "SIGINT, SIGTERM, the string defined in customEvent, uncaughtException and unhandledRejection".
* **options**: see the following section.

Options:
--------
* exitDelay (default 50): after shutting down I wait a certain amount of time before calling process.exit
* stopWindow: (default: 5000): if the shutdown function takes more than this time, the process exit anyway
* logger (default console.log): a function taking a string and an optional error. It is called for logging
* customEvent (optional): onTerminate listen to this event (emitted by the process), to shutdown the process
* handleExceptions ( default false): uncaughtException and unhandledRejection are handled in the same way.

signals and events handled
--------------------------
At the moment onTerminate will handle SIGINT and SIGTERM signals (and uncaughtException, unhandledRejection), as well as a custom event emitted on process. On receiving them, it will run the shutdown function and end the process when the promise returned is either rejected or fulfilled.

Runner
-----------
Runner is an object that tracks asynchronous functions (returning promises).
```js
const Runner = require('gracefully').Runner
const runner = new Runner();

const myfunction = runner.wrap(function () {
  // do something async
})

myfunction()
```
You can check how many are running:
```js
console.log(runner.length())
```
But the important thing is that you can stop executing new ones:
```js
runner.shutdown()

myfunction()
  .catch(err => {
    console.log(err) // new Error('Shutting down')
  })
```
shutdown returns a promise that is fulfilled when all executions are terminated:
```js
runner.shutdown()
  .then(() => {
    // there is no pending task now
  })
```

How to use them together
------------------------
Tipically you create a single instance of "runner" to track the async functions you want to ensure they are completed before shutting down the application.
And then you use onTerminate to manage the graceful shutdown.
```js
const runner = new Runner();

// ... you export "runner" and use it to wrap async functions

onTerminate(async function () {
  // typically you stop the input connections here
  await runner.shutdown()
  // you can now close all remaining services
})
```
