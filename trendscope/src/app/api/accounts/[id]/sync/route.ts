import { headers } from "next/headers";

import { getAuth } from "@/server/auth";
import { getDB } from "@/server/db";
import { ProviderError, syncTikTok, syncYouTube } from "@/server/integrations/providers";
import { sameOrigin } from "@/server/request-security";
import { sessionUser } from "@/server/workspace";

export const maxDuration = 120;
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  let accountId = "";
  let userId = "";
  try {
    const user = await sessionUser();
    if (!user) return Response.json({ error: "Entre para sincronizar." }, { status: 401 });
    userId = user.id;
    const { id } = await context.params;
    const result = await getDB().query<{ providerId: string }>(
      'SELECT "providerId" FROM account WHERE id=$1 AND "userId"=$2',
      [id, user.id],
    );
    const account = result.rows[0];
    if (!account || !["google", "tiktok"].includes(account.providerId))
      return Response.json({ error: "Conta não encontrada." }, { status: 404 });
    // Atomically reserve a sync slot; concurrent requests cannot bypass the per-account quota guard.
    const reservation = await getDB().query(
      `INSERT INTO creator_sync (account_id,user_id,attempted_at) VALUES ($1,$2,NOW())
      ON CONFLICT (account_id) DO UPDATE SET attempted_at=NOW() WHERE creator_sync.attempted_at < NOW() - INTERVAL '2 minutes' RETURNING account_id`,
      [id, user.id],
    );
    if (!reservation.rowCount)
      return Response.json({ error: "Aguarde dois minutos entre sincronizações." }, { status: 429 });
    accountId = id;
    const token = await getAuth()
      .api.getAccessToken({ headers: await headers(), body: { accountId: id } })
      .catch(() => {
        throw new ProviderError(true);
      });
    if (!token.accessToken) throw new ProviderError(true);
    const data = await (account.providerId === "google" ? syncYouTube : syncTikTok)(token.accessToken, id);
    const client = await getDB().connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "UPDATE creator_sync SET data=$1,status='connected',synced_at=NOW() WHERE account_id=$2 AND user_id=$3",
        [JSON.stringify(data), id, user.id],
      );
      await client.query(
        `INSERT INTO creator_snapshot(user_id,account_id,data) VALUES($1,$2,$3)
        ON CONFLICT(user_id,account_id,day) DO UPDATE SET data=EXCLUDED.data`,
        [user.id, id, JSON.stringify({ followers: data.followers, views: data.views })],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return Response.json({ ok: true });
  } catch (error) {
    const reconnect =
      error instanceof ProviderError
        ? error.reconnect
        : Boolean(error && typeof error === "object" && "statusCode" in error && error.statusCode === 401);
    if (accountId)
      await getDB()
        .query("UPDATE creator_sync SET status=$1 WHERE account_id=$2 AND user_id=$3", [
          reconnect ? "reconnect" : "error",
          accountId,
          userId,
        ])
        .catch(() => undefined);
    return Response.json(
      {
        error: reconnect
          ? "Autorização expirada ou revogada. Reconecte a conta."
          : "Falha na sincronização. Verifique permissões, quota, conexão e migrações.",
      },
      { status: 502 },
    );
  }
}
