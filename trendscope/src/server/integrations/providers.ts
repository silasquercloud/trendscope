import { z } from "zod";

import type { Platform, Video } from "@/lib/trendscope/types";

export class ProviderError extends Error {
  constructor(public readonly reconnect: boolean) {
    super("A fonte oficial recusou a sincronização.");
  }
}
const count = z.union([z.string(), z.number()]).transform((value) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
});
const optionalCount = count.nullish().transform((value) => value ?? null);
const youtubeVideo = z.object({
  id: z.string(),
  snippet: z.object({ title: z.string(), publishedAt: z.string().datetime({ offset: true }) }),
  statistics: z.object({ viewCount: optionalCount, likeCount: optionalCount, commentCount: optionalCount }),
});
const tiktokVideo = z.object({
  id: z.string(),
  title: z.string().optional(),
  video_description: z.string().optional(),
  create_time: z.number(),
  view_count: optionalCount,
  like_count: optionalCount,
  comment_count: optionalCount,
});
export function normalizeYouTubeVideo(raw: unknown, accountId: string, account: string): Video {
  const item = youtubeVideo.parse(raw);
  return {
    id: item.id,
    accountId,
    account,
    title: item.snippet.title,
    platform: "YouTube",
    publishedAt: item.snippet.publishedAt,
    views: item.statistics.viewCount,
    likes: item.statistics.likeCount,
    comments: item.statistics.commentCount,
    url: `https://www.youtube.com/watch?v=${encodeURIComponent(item.id)}`,
  };
}
export function normalizeTikTokVideo(raw: unknown, accountId: string, account: string): Video {
  const item = tiktokVideo.parse(raw);
  return {
    id: item.id,
    accountId,
    account,
    title: item.title || item.video_description || "Vídeo sem título",
    platform: "TikTok",
    publishedAt: new Date(item.create_time * 1000).toISOString(),
    views: item.view_count,
    likes: item.like_count,
    comments: item.comment_count,
    url: `https://www.tiktok.com/@${encodeURIComponent(account)}/video/${encodeURIComponent(item.id)}`,
  };
}
async function officialJSON(url: string, token: string, body?: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new ProviderError(response.status === 401);
  return response.json();
}
export interface SyncResult {
  name: string;
  platform: Platform;
  followers: number | null;
  views: number | null;
  videos: Video[];
  truncated: boolean;
}
export async function syncYouTube(token: string, accountId: string): Promise<SyncResult> {
  const channels = z
    .object({
      items: z.array(
        z.object({
          snippet: z.object({ title: z.string() }),
          statistics: z.object({
            subscriberCount: optionalCount,
            viewCount: optionalCount,
            hiddenSubscriberCount: z.boolean().optional(),
          }),
          contentDetails: z.object({ relatedPlaylists: z.object({ uploads: z.string() }) }),
        }),
      ),
    })
    .parse(
      await officialJSON(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true",
        token,
      ),
    );
  const channel = channels.items[0];
  if (!channel) throw new ProviderError(false);
  const ids: string[] = [];
  let page = "";
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.search = new URLSearchParams({
      part: "contentDetails",
      playlistId: channel.contentDetails.relatedPlaylists.uploads,
      maxResults: "50",
      ...(page ? { pageToken: page } : {}),
    }).toString();
    const data = z
      .object({
        nextPageToken: z.string().optional(),
        items: z.array(z.object({ contentDetails: z.object({ videoId: z.string() }) })),
      })
      .parse(await officialJSON(url.toString(), token));
    ids.push(...data.items.map((item) => item.contentDetails.videoId));
    page = data.nextPageToken ?? "";
  } while (page && ids.length < 200);
  const videos: Video[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.search = new URLSearchParams({ part: "snippet,statistics", id: ids.slice(i, i + 50).join(",") }).toString();
    const data = z.object({ items: z.array(z.unknown()) }).parse(await officialJSON(url.toString(), token));
    videos.push(...data.items.map((item) => normalizeYouTubeVideo(item, accountId, channel.snippet.title)));
  }
  return {
    name: channel.snippet.title,
    platform: "YouTube",
    followers: channel.statistics.hiddenSubscriberCount ? null : channel.statistics.subscriberCount,
    views: channel.statistics.viewCount,
    videos,
    truncated: Boolean(page),
  };
}
function tiktokData<T extends z.ZodType>(schema: T, raw: unknown): z.infer<T> {
  const envelope = z.object({ error: z.object({ code: z.string() }).optional(), data: z.unknown() }).parse(raw);
  if (envelope.error && envelope.error.code !== "ok")
    throw new ProviderError(envelope.error.code === "access_token_invalid");
  return schema.parse(envelope.data);
}
export async function syncTikTok(token: string, accountId: string): Promise<SyncResult> {
  const { user } = tiktokData(
    z.object({
      user: z.object({ display_name: z.string(), username: z.string().optional(), follower_count: optionalCount }),
    }),
    await officialJSON("https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,follower_count", token),
  );
  const videos: Video[] = [];
  let cursor = 0;
  let more = false;
  do {
    const data = tiktokData(
      z.object({ videos: z.array(z.unknown()), cursor: z.number(), has_more: z.boolean() }),
      await officialJSON(
        "https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,create_time,view_count,like_count,comment_count",
        token,
        { max_count: 20, cursor },
      ),
    );
    videos.push(
      ...data.videos.map((item) => normalizeTikTokVideo(item, accountId, user.username ?? user.display_name)),
    );
    more = data.has_more && data.cursor !== cursor;
    cursor = data.cursor;
  } while (more && videos.length < 200);
  // Display API does not supply account-wide lifetime views. Never infer that total from a partial library.
  return {
    name: user.display_name,
    platform: "TikTok",
    followers: user.follower_count,
    views: null,
    videos,
    truncated: more,
  };
}
