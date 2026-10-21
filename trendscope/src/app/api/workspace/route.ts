import { loadWorkspace } from "@/server/workspace";
export async function GET() {
  return Response.json(await loadWorkspace(), { headers: { "Cache-Control": "private, no-store" } });
}
