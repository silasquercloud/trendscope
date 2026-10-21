import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("source-only production install does not require Husky or Git metadata", () => {
  const directory = mkdtempSync(join(tmpdir(), "trendscope-prepare-"));
  try {
    const script = join(directory, "prepare.mjs");
    copyFileSync(new URL("../src/scripts/prepare.mjs", import.meta.url), script);
    const result = spawnSync(process.execPath, [script], {
      cwd: directory,
      env: { ...process.env, NODE_ENV: "production", CI: "", RENDER: "", HUSKY: "" },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Skipping Git hooks/u);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
