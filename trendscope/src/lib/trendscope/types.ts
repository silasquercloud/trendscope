export type Platform = "YouTube" | "TikTok";
export type Section =
  | "overview"
  | "accounts"
  | "videos"
  | "analytics"
  | "money"
  | "trends"
  | "sounds"
  | "ai"
  | "reports"
  | "settings";
export interface CreatorAccount {
  id: string;
  provider: "google" | "tiktok";
  platform: Platform;
  name: string;
  followers: number | null;
  views: number | null;
  syncedAt: string | null;
  status: "connected" | "reconnect" | "error";
}
export interface Video {
  id: string;
  accountId: string;
  account: string;
  title: string;
  platform: Platform;
  publishedAt: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  url: string;
}
export interface Snapshot {
  accountId: string;
  day: string;
  followers: number | null;
  views: number | null;
}
export interface Workspace {
  user: { name: string; email: string } | null;
  configured: { auth: boolean; google: boolean; tiktok: boolean };
  accounts: CreatorAccount[];
  videos: Video[];
  snapshots: Snapshot[];
  error?: string;
}
export const sectionNames: Record<Section, string> = {
  overview: "Visão geral",
  accounts: "Minhas contas",
  videos: "Meus vídeos",
  analytics: "Analytics",
  money: "Monetização",
  trends: "Radar de tendências",
  sounds: "Áudios em alta",
  ai: "Laboratório IA",
  reports: "Relatórios",
  settings: "Configurações",
};
