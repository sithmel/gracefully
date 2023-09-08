# gracefully

gracefully is a utility function that allow you to shutdown an application ... gracefully.

```js
const gracefully = require("gracefully");
// or use import, it includes typescript types!
gracefully(shutdown, options);
```

- **shutdown** is a function returning a promise. The function gets as a first argument a string with the "reason". That can be either: "SIGINT, SIGTERM, the string defined in customEvent, uncaughtException and unhandledRejection".
- **options**: see the following section.

## Options:

- exitDelay (default 50): after shutting down, it waits a certain amount of time before calling process.exit
- stopWindow: (default: 5000): if the shutdown function takes more than this time, the process exit anyway
- customEvent (optional): onTerminate listen to this event (emitted by the process), to shutdown the process
- handleExceptions ( default false): uncaughtException and unhandledRejection are handled in the same way.

## signals and events handled

Gracefully will handle SIGINT and SIGTERM signals (and uncaughtException, unhandledRejection), as well as a custom event emitted on process. On receiving them, it will run the shutdown function and end the process when the promise returned is either rejected or fulfilled.
