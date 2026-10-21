import { getAuth } from "@/server/auth";
import { authConfigured } from "@/server/auth-config";

export const runtime = "nodejs";
async function handler(request: Request) {
  if (!authConfigured()) return Response.json({ error: "Autenticação não configurada." }, { status: 503 });
  // Access/refresh tokens are server-only: never expose Better Auth's token endpoints over HTTP.
  const path = decodeURIComponent(new URL(request.url).pathname).replace(/\/+$/u, "").split("/").at(-1);
  if (["get-access-token", "refresh-token", "account-info"].includes(path ?? "")) {
    return Response.json({ error: "Endpoint restrito ao servidor." }, { status: 404 });
  }
  try {
    return await getAuth().handler(request);
  } catch {
    return Response.json({ error: "Serviço de autenticação temporariamente indisponível." }, { status: 503 });
  }
}

export { handler as GET, handler as POST };
