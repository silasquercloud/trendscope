import { readiness } from "@/server/readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await readiness(), { headers: { "Cache-Control": "no-store" } });
}
