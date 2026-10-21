import {
  normalizeTikTokVideo,
  normalizeYouTubeVideo,
  ProviderError,
  syncTikTok,
  syncYouTube,
} from "../src/server/integrations/providers";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
test("YouTube parsing preserves unavailable and hidden statistics", () => {
  const video = normalizeYouTubeVideo(
    { id: "abc", snippet: { title: "Título", publishedAt: "2026-10-20T12:00:00Z" }, statistics: { viewCount: "123" } },
    "a",
    "Canal",
  );
  assert.equal(video.views, 123);
  assert.equal(video.likes, null);
  assert.equal(video.comments, null);
  assert.throws(() => normalizeYouTubeVideo({}, "a", "b"));
});
test("TikTok normalization rejects invalid payloads and does not fabricate counts", () => {
  const video = normalizeTikTokVideo({ id: "123", create_time: 100, view_count: 0 }, "a", "perfil");
  assert.equal(video.likes, null);
  assert.equal(video.views, 0);
  assert.equal(video.url, "https://www.tiktok.com/@perfil/video/123");
});
test("YouTube pagination and batching use fixed official hosts and bearer headers", async () => {
  let playlists = 0;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, "www.googleapis.com");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer test-only");
    if (url.pathname.endsWith("/channels"))
      return Response.json({
        items: [
          {
            snippet: { title: "Canal" },
            statistics: { hiddenSubscriberCount: true, subscriberCount: "10", viewCount: "100" },
            contentDetails: { relatedPlaylists: { uploads: "uploads" } },
          },
        ],
      });
    if (url.pathname.endsWith("/playlistItems")) {
      playlists++;
      return Response.json({
        items: [{ contentDetails: { videoId: `id${playlists}` } }],
        ...(playlists === 1 ? { nextPageToken: "second" } : {}),
      });
    }
    return Response.json({
      items: [1, 2].map((i) => ({
        id: `id${i}`,
        snippet: { title: "Vídeo", publishedAt: "2026-10-20T12:00:00Z" },
        statistics: { viewCount: "5" },
      })),
    });
  };
  const result = await syncYouTube("test-only", "account");
  assert.equal(playlists, 2);
  assert.equal(result.videos.length, 2);
  assert.equal(result.followers, null);
  assert.equal(result.truncated, false);
});
test("TikTok API application errors and expired tokens are not successful syncs", async () => {
  globalThis.fetch = async () => Response.json({ error: { code: "access_token_invalid" }, data: {} });
  await assert.rejects(
    syncTikTok("test-only", "a"),
    (error: unknown) => error instanceof ProviderError && error.reconnect,
  );
  globalThis.fetch = async () => new Response(null, { status: 401 });
  await assert.rejects(syncYouTube("test-only", "a"), ProviderError);
});
test("TikTok only reports account-wide views as unavailable", async () => {
  globalThis.fetch = async (input) =>
    String(input).includes("user/info")
      ? Response.json({ error: { code: "ok" }, data: { user: { display_name: "Perfil", follower_count: 10 } } })
      : Response.json({ error: { code: "ok" }, data: { videos: [], has_more: false, cursor: 0 } });
  const result = await syncTikTok("test-only", "a");
  assert.equal(result.views, null);
  assert.equal(result.followers, 10);
});
