import "server-only";
import { headers } from "next/headers";

import { getSessionCookie } from "better-auth/cookies";

import type { CreatorAccount, Snapshot, Workspace } from "@/lib/trendscope/types";

import { getAuth } from "./auth";
import { authConfigured, providerConfigured } from "./auth-config";
import { getDB } from "./db";
import type { SyncResult } from "./integrations/providers";

export async function sessionUser() {
  if (!authConfigured()) return null;
  const requestHeaders = await headers();
  if (!getSessionCookie(requestHeaders)) return null;
  return (await getAuth().api.getSession({ headers: requestHeaders }))?.user ?? null;
}
export async function loadWorkspace(): Promise<Workspace> {
  const workspace: Workspace = {
    user: null,
    configured: { auth: authConfigured(), google: providerConfigured("google"), tiktok: providerConfigured("tiktok") },
    accounts: [],
    videos: [],
    snapshots: [],
  };
  if (!workspace.configured.auth) return workspace;
  try {
    const user = await sessionUser();
    if (!user) return workspace;
    workspace.user = { name: user.name, email: user.email };
    const result = await getDB().query<{
      id: string;
      provider: "google" | "tiktok";
      data: SyncResult | null;
      status: CreatorAccount["status"] | null;
      syncedAt: Date | null;
    }>(
      `
      SELECT a.id, a."providerId" AS provider, s.data, s.status, s.synced_at AS "syncedAt"
      FROM account a LEFT JOIN creator_sync s ON s.account_id=a.id AND s.user_id=a."userId"
      WHERE a."userId"=$1 AND a."providerId" IN ('google','tiktok') ORDER BY a."createdAt"`,
      [user.id],
    );
    for (const row of result.rows) {
      workspace.accounts.push({
        id: row.id,
        provider: row.provider,
        platform: row.provider === "google" ? "YouTube" : "TikTok",
        name: row.data?.name ?? "Aguardando sincronização",
        followers: row.data?.followers ?? null,
        views: row.data?.views ?? null,
        status: row.status ?? "connected",
        syncedAt: row.syncedAt?.toISOString() ?? null,
      });
      workspace.videos.push(...(row.data?.videos ?? []));
      if (row.data?.truncated)
        workspace.error =
          "Biblioteca limitada aos 200 vídeos mais recentes por conexão; relatórios não cobrem todo o histórico.";
    }
    const snapshots = await getDB().query<{
      accountId: string;
      day: string;
      data: { followers: number | null; views: number | null };
    }>(
      `
      SELECT account_id AS "accountId", to_char(day, 'YYYY-MM-DD') AS day, data FROM creator_snapshot WHERE user_id=$1 AND day >= CURRENT_DATE - 90 ORDER BY day`,
      [user.id],
    );
    workspace.snapshots = snapshots.rows.map(({ accountId, day, data }): Snapshot => ({ accountId, day, ...data }));
  } catch {
    workspace.error = "Não foi possível carregar as contas. Verifique o banco e as migrações ou tente novamente.";
  }
  return workspace;
}
