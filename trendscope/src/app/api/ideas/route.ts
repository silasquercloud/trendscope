import { getDB } from "@/server/db";
import { aiConfigured, generateIdeas, ideaInput } from "@/server/integrations/ai";
import { sameOrigin } from "@/server/request-security";
import { sessionUser } from "@/server/workspace";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  try {
    const user = await sessionUser();
    if (!user) return Response.json({ error: "Entre na sua conta para usar IA." }, { status: 401 });
    if (!aiConfigured()) return Response.json({ error: "Configure o provedor de IA no servidor." }, { status: 503 });
    if (Number(request.headers.get("content-length")) > 2048)
      return Response.json({ error: "Solicitação muito grande." }, { status: 413 });
    // Bound streamed bodies too; do not rely only on the Content-Length header.
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: "Informe assunto e formato." }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return Response.json({ error: "Solicitação muito grande." }, { status: 413 });
      }
      chunks.push(value);
    }
    let raw: unknown;
    try {
      raw = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return Response.json({ error: "JSON inválido." }, { status: 400 });
    }
    const input = ideaInput.safeParse(raw);
    if (!input.success)
      return Response.json({ error: "Informe assunto de 3 a 160 caracteres e formato válido." }, { status: 400 });
    const quota = await getDB().query(
      `INSERT INTO creator_ai_usage (user_id, day, requests, last_request) VALUES ($1,CURRENT_DATE,1,NOW())
       ON CONFLICT (user_id,day) DO UPDATE SET requests=creator_ai_usage.requests+1,last_request=NOW()
       WHERE creator_ai_usage.requests < 20 AND creator_ai_usage.last_request < NOW() - INTERVAL '1 minute'
       RETURNING user_id`,
      [user.id],
    );
    if (!quota.rowCount)
      return Response.json(
        { error: "Limite de 20 tentativas por dia. Aguarde um minuto entre solicitações." },
        { status: 429 },
      );
    return Response.json(
      { text: await generateIdeas(input.data), provider: "OpenAI" },
      {
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch {
    return Response.json(
      { error: "Não foi possível gerar o conteúdo. Verifique migrações, modelo, credenciais e saldo do provedor." },
      { status: 502 },
    );
  }
}
