import type { Video } from "./types";

export interface VideoFilters {
  platform: string;
  account: string;
  search: string;
  days: number;
}
export function filterVideos(videos: Video[], filters: VideoFilters, now = Date.now()): Video[] {
  const cutoff = filters.days > 0 ? now - filters.days * 86_400_000 : 0;
  return videos.filter(
    (video) =>
      (filters.platform === "all" || video.platform === filters.platform) &&
      (filters.account === "all" || video.accountId === filters.account) &&
      `${video.title} ${video.account}`
        .toLocaleLowerCase("pt-BR")
        .includes(filters.search.toLocaleLowerCase("pt-BR")) &&
      Date.parse(video.publishedAt) >= cutoff,
  );
}
export function sumKnown(values: (number | null)[]): number | null {
  return values.length && values.every((value) => value !== null)
    ? values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
    : null;
}
export function engagement(videos: Video[]): number | null {
  const views = sumKnown(videos.map((v) => v.views));
  const likes = sumKnown(videos.map((v) => v.likes));
  const comments = sumKnown(videos.map((v) => v.comments));
  return views && likes !== null && comments !== null ? ((likes + comments) / views) * 100 : null;
}
// Spreadsheet applications may execute cells even when CSV values are quoted.
export function csvCell(value: string | number | null): string {
  const text = String(value ?? "");
  const safe = /^[\s]*[=+@\-\t\r]/u.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function videosCSV(videos: Video[]): string {
  const rows: (string | number | null)[][] = [
    [
      "Origem",
      "Título",
      "Conta",
      "Plataforma",
      "Publicação",
      "Visualizações acumuladas",
      "Curtidas",
      "Comentários",
      "URL",
    ],
    ...videos.map((v) => [
      "API oficial",
      v.title,
      v.account,
      v.platform,
      v.publishedAt,
      v.views,
      v.likes,
      v.comments,
      v.url,
    ]),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
}
