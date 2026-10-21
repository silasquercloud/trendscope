import assert from "node:assert/strict";

const base = process.env.SMOKE_URL ?? "http://localhost:3000";
const routes = [
  "",
  "/contas",
  "/videos",
  "/analises",
  "/monetizacao",
  "/tendencias",
  "/audios",
  "/laboratorio",
  "/relatorios",
  "/configuracoes",
];
for (const path of routes) {
  const response = await fetch(`${base}/dashboard${path}`);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.ok(html.includes("TrendScope"), path);
  assert.ok(!html.includes("Open Source Business Dashboard"), path);
  assert.ok(html.includes('class="dark"'), path);
  assert.ok(!html.includes("Ver demonstração"), path);
  assert.ok(!html.includes("Montar modelo local"), path);
  if (!path) {
    assert.ok(html.includes("Indisponível"));
    assert.ok(!html.includes("374.800"));
    const chunks = [
      ...new Set([...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css)(?:\?[^"]*)?)"/gu)].map((match) => match[1])),
    ];
    assert.ok(chunks.length > 0);
    for (const chunk of chunks) assert.equal((await fetch(new URL(chunk, base))).status, 200, chunk);
    console.log(`Assets: ${chunks.length} JS/CSS files served`);
  }
  console.log(`200 /dashboard${path}`);
}
for (const path of ["/dashboard/crm", "/dashboard/finance", "/auth/v1/login", "/chat", "/mail"]) {
  const response = await fetch(base + path);
  assert.equal(response.status, 404, path);
}
assert.equal((await fetch(`${base}/`, { redirect: "manual" })).status, 307);
assert.equal((await fetch(`${base}/dashboard/default`, { redirect: "manual" })).status, 307);
assert.equal((await fetch(`${base}/api/health`)).status, 200);
const setup = await (await fetch(`${base}/api/readiness`)).json();
assert.equal(setup.database.configured, false);
assert.equal(setup.readyForSignIn, false);
assert.ok(setup.missingEnvironment.includes("DATABASE_URL"));
const workspace = await (await fetch(`${base}/api/workspace`)).json();
assert.deepEqual(workspace.accounts, []);
assert.deepEqual(workspace.videos, []);
for (const path of ["/api/accounts/fake/sync", "/api/accounts/fake", "/api/ideas"]) {
  const response = await fetch(base + path, {
    method: path.endsWith("sync") || path.endsWith("ideas") ? "POST" : "DELETE",
  });
  assert.equal(response.status, 403);
}
assert.equal(
  (
    await fetch(`${base}/api/auth/sign-in/social`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "google" }),
    })
  ).status,
  503,
);
console.log("Redirects, legacy 404s, empty workspace, health, CSRF and unconfigured auth verified.");
