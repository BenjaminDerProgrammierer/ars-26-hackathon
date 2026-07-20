import assert from "node:assert/strict";
import test from "node:test";
import { readServerConfig } from "../src/config.js";

test("readServerConfig uses loopback defaults", () => {
  assert.deepEqual(readServerConfig({}), {
    host: "127.0.0.1",
    port: 3000,
  });
});

test("readServerConfig trims configured values", () => {
  assert.deepEqual(readServerConfig({ HOST: " localhost ", PORT: " 4321 " }), {
    host: "localhost",
    port: 4321,
  });
});

test("readServerConfig rejects invalid ports", () => {
  for (const port of ["0", "65536", "3000x", "3.5", "-1"]) {
    assert.throws(
      () => readServerConfig({ PORT: port }),
      /PORT must be an integer between 1 and 65535/,
    );
  }
});
