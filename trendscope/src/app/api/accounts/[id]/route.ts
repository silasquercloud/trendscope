import { headers } from "next/headers";

import { getAuth } from "@/server/auth";
import { getDB } from "@/server/db";
import { sameOrigin } from "@/server/request-security";
import { sessionUser } from "@/server/workspace";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  try {
    const user = await sessionUser();
    if (!user) return Response.json({ error: "Sessão necessária." }, { status: 401 });
    const { id } = await context.params;
    const owned = await getDB().query('SELECT id FROM account WHERE id=$1 AND "userId"=$2', [id, user.id]);
    if (!owned.rowCount) return Response.json({ error: "Conta não encontrada." }, { status: 404 });
    await getAuth().api.unlinkAccount({ headers: await headers(), body: { accountId: id } });
    // FK cascades remove snapshots and cached videos. Remote grants remain manageable at the provider.
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      {
        error:
          "Não foi possível desconectar. Mantenha uma conta de acesso e use uma sessão recente. Revogue a permissão também no provedor.",
      },
      { status: 400 },
    );
  }
}
