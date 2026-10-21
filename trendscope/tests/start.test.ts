import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

test("automatic migration fails before startup if auth configuration is incomplete and does not print secrets", () => {
  const secret = "sensitive-test-value";
  const result = spawnSync(process.execPath, ["src/scripts/start.mjs"], {
    env: { ...process.env, RUN_DB_MIGRATIONS: "1", DATABASE_URL: "", BETTER_AUTH_URL: "", BETTER_AUTH_SECRET: secret },
    encoding: "utf8",
    timeout: 5000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Configure DATABASE_URL/);
  assert.ok(!result.stderr.includes(secret));
  assert.ok(!result.stdout.includes("Ready"));
});
