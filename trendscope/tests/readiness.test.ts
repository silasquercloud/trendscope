import { readiness } from "../src/server/readiness";
import assert from "node:assert/strict";
import { test } from "node:test";

test("setup diagnostics distinguish missing database and secret without exposing environment values", async () => {
  const keys = ["DATABASE_URL", "BETTER_AUTH_URL", "BETTER_AUTH_SECRET"] as const;
  const saved = keys.map((key) => process.env[key]);
  try {
    delete process.env.DATABASE_URL;
    process.env.BETTER_AUTH_URL = "https://private-test.example";
    process.env.BETTER_AUTH_SECRET = "test-short-secret";
    const result = await readiness();
    assert.deepEqual(result.missingEnvironment, ["DATABASE_URL", "BETTER_AUTH_SECRET"]);
    assert.deepEqual(result.database, { configured: false, reachable: false, schemaReady: false });
    assert.equal(result.readyForSignIn, false);
    assert.ok(!JSON.stringify(result).includes("test-short-secret"));
    assert.ok(!JSON.stringify(result).includes("private-test.example"));
  } finally {
    keys.forEach((key, index) => {
      if (saved[index] === undefined) delete process.env[key];
      else process.env[key] = saved[index];
    });
  }
});
