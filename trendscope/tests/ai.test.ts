import { aiConfigured, generateIdeas, ideaInput } from "../src/server/integrations/ai";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

const originalFetch = globalThis.fetch;
const originalKey = process.env.OPENAI_API_KEY;
const originalModel = process.env.OPENAI_MODEL;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.OPENAI_MODEL;
  else process.env.OPENAI_MODEL = originalModel;
});

test("AI never substitutes a template when credentials are missing", async () => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_MODEL;
  assert.equal(aiConfigured(), false);
  await assert.rejects(generateIdeas({ topic: "Setup acessível", format: "Tutorial" }));
});

test("AI sends only the requested topic and format and extracts actual provider messages", async () => {
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_MODEL = "test-model";
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.store, false);
    assert.deepEqual(JSON.parse(body.input), { topic: "Setup acessível", format: "Tutorial" });
    return Response.json({
      status: "completed",
      output: [
        { type: "reasoning" },
        { type: "message", content: [{ type: "output_text", text: "Resultado do provedor" }] },
      ],
    });
  };
  assert.equal(await generateIdeas({ topic: "Setup acessível", format: "Tutorial" }), "Resultado do provedor");
});

test("AI rejects refused, incomplete and empty provider output without inventing content", async () => {
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_MODEL = "test-model";
  for (const response of [
    new Response("Unauthorized", { status: 401 }),
    Response.json({ status: "incomplete", output: [] }),
    Response.json({ status: "completed", output: [] }),
  ]) {
    globalThis.fetch = async () => response;
    await assert.rejects(generateIdeas({ topic: "Setup acessível", format: "Tutorial" }));
  }
  assert.equal(ideaInput.safeParse({ topic: "a", format: "Tutorial" }).success, false);
  assert.equal(ideaInput.safeParse({ topic: "Setup acessível", format: "invalid" }).success, false);
});
