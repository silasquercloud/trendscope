import { authConfigured, providerConfigured } from "../src/server/auth-config";
import { sameOrigin } from "../src/server/request-security";
import assert from "node:assert/strict";
import { test } from "node:test";

test("auth fails closed without a database and a sufficiently long secret", () => {
  const old = { ...process.env };
  try {
    delete process.env.DATABASE_URL;
    delete process.env.BETTER_AUTH_SECRET;
    assert.equal(authConfigured(), false);
    assert.equal(providerConfigured("google"), false);
    process.env.DATABASE_URL = "postgresql://localhost/test";
    process.env.BETTER_AUTH_URL = "https://example.com";
    process.env.BETTER_AUTH_SECRET = "short";
    assert.equal(authConfigured(), false);
    process.env.BETTER_AUTH_SECRET = "x".repeat(32);
    assert.equal(authConfigured(), true);
  } finally {
    process.env = old;
  }
});
test("mutations reject missing, foreign and spoofed origins", () => {
  const old = process.env.BETTER_AUTH_URL;
  process.env.BETTER_AUTH_URL = "https://example.com";
  try {
    assert.equal(
      sameOrigin(new Request("https://example.com/api", { headers: { origin: "https://example.com" } })),
      true,
    );
    assert.equal(
      sameOrigin(
        new Request("https://example.com/api", { headers: { origin: "https://attacker.com", host: "example.com" } }),
      ),
      false,
    );
    assert.equal(sameOrigin(new Request("https://example.com/api")), false);
  } finally {
    if (old === undefined) delete process.env.BETTER_AUTH_URL;
    else process.env.BETTER_AUTH_URL = old;
  }
});
