import type { Workspace } from "../../src/lib/trendscope/types";

// Intentionally separate from server data. Revenue is never synthesized.
export function demoWorkspace(now = Date.now()): Workspace {
  const day = (ago: number) => new Date(now - ago * 86_400_000).toISOString();
  return {
    user: null,
    configured: { auth: false, google: false, tiktok: false },
    accounts: [
      {
        id: "demo-yt",
        provider: "google",
        platform: "YouTube",
        name: "Canal de exemplo",
        followers: 26800,
        views: 230700,
        syncedAt: null,
        status: "connected",
      },
      {
        id: "demo-tt",
        provider: "tiktok",
        platform: "TikTok",
        name: "Perfil de exemplo",
        followers: 14200,
        views: 144100,
        syncedAt: null,
        status: "connected",
      },
    ],
    videos: [
      {
        id: "demo-1",
        accountId: "demo-yt",
        account: "Canal de exemplo",
        title: "O segredo do meu setup",
        platform: "YouTube",
        views: 158400,
        likes: 12400,
        comments: 320,
        publishedAt: day(2),
        url: "",
      },
      {
        id: "demo-2",
        accountId: "demo-tt",
        account: "Perfil de exemplo",
        title: "Esse truque mudou meu jogo",
        platform: "TikTok",
        views: 98500,
        likes: 7300,
        comments: 180,
        publishedAt: day(6),
        url: "",
      },
      {
        id: "demo-3",
        accountId: "demo-yt",
        account: "Canal de exemplo",
        title: "Os melhores momentos da semana",
        platform: "YouTube",
        views: 72300,
        likes: 6100,
        comments: 140,
        publishedAt: day(18),
        url: "",
      },
      {
        id: "demo-4",
        accountId: "demo-tt",
        account: "Perfil de exemplo",
        title: "3 dicas para crescer",
        platform: "TikTok",
        views: 45600,
        likes: 3200,
        comments: 95,
        publishedAt: day(45),
        url: "",
      },
    ],
    snapshots: Array.from({ length: 7 }, (_, i) => [
      { accountId: "demo-yt", day: day(6 - i).slice(0, 10), followers: 26000 + i * 130, views: 200000 + i * 5000 },
      { accountId: "demo-tt", day: day(6 - i).slice(0, 10), followers: 13800 + i * 65, views: 125000 + i * 3000 },
    ]).flat(),
  };
}
