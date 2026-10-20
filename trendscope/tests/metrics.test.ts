import { demoWorkspace } from "../src/lib/trendscope/demo";
import { csvCell, engagement, filterVideos, sumKnown, videosCSV } from "../src/lib/trendscope/metrics";
import assert from "node:assert/strict";
import { test } from "node:test";

const now = Date.parse("2026-10-20T12:00:00Z");
const workspace = demoWorkspace(now);
const filters = { platform: "all", account: "all", search: "", days: 0 };
test("filters apply publication date, platform, account, search together", () => {
  assert.equal(filterVideos(workspace.videos, { ...filters, days: 7 }, now).length, 2);
  assert.equal(
    filterVideos(workspace.videos, { ...filters, platform: "YouTube", days: 7, search: "SETUP" }, now).length,
    1,
  );
  assert.equal(filterVideos(workspace.videos, { ...filters, platform: "YouTube", account: "demo-tt" }, now).length, 0);
  assert.equal(filterVideos(workspace.videos, { ...filters, search: "não existe" }, now).length, 0);
});
test("unknown metrics are never silently treated as zero", () => {
  assert.equal(sumKnown([]), null);
  assert.equal(sumKnown([10, null]), null);
  assert.equal(sumKnown([0, 0]), 0);
  assert.equal(sumKnown([10, 20]), 30);
  assert.equal(engagement([]), null);
  assert.equal(engagement([{ ...workspace.videos[0], likes: null }]), null);
  assert.equal(engagement([{ ...workspace.videos[0], views: 100, likes: 8, comments: 2 }]), 10);
});
test("CSV quotes values, neutralizes formulas and explicitly labels demo exports", () => {
  for (const value of ["=CMD()", "+SUM(A1)", "-1+2", "@call", "  =SUM(A1)", "\t=1"])
    assert.ok(csvCell(value).startsWith("\"'"));
  assert.equal(csvCell('um;"dois"'), '"um;""dois"""');
  assert.ok(videosCSV(workspace.videos, true).includes("DEMONSTRAÇÃO"));
  assert.ok(!videosCSV(workspace.videos, true).includes("Receita"));
  assert.ok(videosCSV(workspace.videos, false).includes("API oficial"));
});
