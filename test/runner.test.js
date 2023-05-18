import pkg from "zunit";
import assert from "assert";
import Runner from "../runner.js";

const { describe, it, beforeEach } = pkg;

function sleep(ms) {
  return new Promise(function (resolve, reject) {
    setTimeout(() => {
      resolve(null);
    }, ms);
  });
}

describe("runner", () => {
  let a, b, c, executed, runner;

  beforeEach(() => {
    executed = "";
    runner = new Runner();
    a = runner.wrap(async function (a, b) {
      await sleep(20);
      executed += "A";
      return Promise.resolve(a + b);
    });

    b = runner.wrap(async function (a, b) {
      await sleep(10);
      executed += "B";
      return Promise.resolve(a * b);
    });

    c = runner.wrap(async function (a, b) {
      await sleep(10);
      executed += "C";
      return Promise.reject(new Error("error"));
    });
  });

  it("must work", async () => {
    const res1 = await a(1, 2);
    assert.equal(res1, 3);
    const res2 = await b(3, 2);
    assert.equal(res2, 6);
  });

  it("must throw", async () => {
    try {
      await c(1, 2);
      throw new Error("oh no");
    } catch (e) {
      assert.equal(e.message, "error");
    }
  });

  it("must register length", async () => {
    a(1, 2);
    assert.equal(runner.length(), 1);
    b(3, 2);
    assert.equal(runner.length(), 2);
    await sleep(11);
    assert.equal(runner.length(), 1);
    await sleep(11);
    assert.equal(runner.length(), 0);
  });

  it("must throw when shutdown", async () => {
    runner.shutdown();
    try {
      await a(1, 2);
      throw new Error("oh no");
    } catch (e) {
      assert.equal(e.message, "Shutting down");
    }
  });

  it("must terminate current tasks when shutdown", async () => {
    a(1, 2);
    b(3, 2);
    c(3, 2);
    assert.equal(runner.length(), 3);
    assert.equal(executed, "");
    await runner.shutdown();
    assert.equal(runner.length(), 0);
    assert.equal(executed, "BCA");
  });
});
