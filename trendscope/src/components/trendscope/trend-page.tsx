import type { Section } from "@/lib/trendscope/types";
import { loadWorkspace } from "@/server/workspace";

import { TrendScreen } from "./trend-screen";

export async function TrendPage({ section }: { section: Section }) {
  return <TrendScreen section={section} workspace={await loadWorkspace()} />;
}
