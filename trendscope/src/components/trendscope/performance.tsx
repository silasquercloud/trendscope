"use client";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { engagement, sumKnown } from "@/lib/trendscope/metrics";
import type { CreatorAccount, Snapshot, Video } from "@/lib/trendscope/types";

import { EmptyState } from "./empty-state";

export function formatCount(value: number | null) {
  return value === null ? "Indisponível" : new Intl.NumberFormat("pt-BR").format(value);
}
function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-xs">{detail}</CardContent>
    </Card>
  );
}
export function Performance({
  accounts,
  videos,
  snapshots,
  days,
}: {
  accounts: CreatorAccount[];
  videos: Video[];
  snapshots: Snapshot[];
  days: number;
}) {
  const rate = engagement(videos);
  const visible = snapshots.filter(
    (s) => accounts.some((a) => a.id === s.accountId) && (!days || Date.parse(s.day) >= Date.now() - days * 86400000),
  );
  const dates = [...new Set(visible.map((s) => s.day))].sort();
  const chart = dates.map((day) => {
    const entries = visible.filter((s) => s.day === day);
    const total = (platform: string) => {
      const relevant = accounts.filter((a) => a.platform === platform);
      const rows = entries.filter((s) => relevant.some((a) => a.id === s.accountId));
      return relevant.length && rows.length === relevant.length ? sumKnown(rows.map((s) => s.followers)) : null;
    };
    return { day, YouTube: total("YouTube"), TikTok: total("TikTok") };
  });
  const growth = accounts.map((account) => {
    const entries = visible
      .filter((s) => s.accountId === account.id && s.followers !== null)
      .sort((a, b) => a.day.localeCompare(b.day));
    const first = entries[0];
    const last = entries.at(-1);
    return first && last && first.day !== last.day && first.followers !== null && last.followers !== null
      ? last.followers - first.followers
      : null;
  });
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Visualizações dos vídeos"
          value={formatCount(sumKnown(videos.map((v) => v.views)))}
          detail="Acumuladas nos vídeos filtrados; não são views geradas no período."
        />
        <Metric
          title="Seguidores + inscritos"
          value={formatCount(sumKnown(accounts.map((a) => a.followers)))}
          detail="Último total sincronizado das contas selecionadas."
        />
        <Metric
          title="Engajamento da biblioteca"
          value={rate === null ? "Indisponível" : `${rate.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`}
          detail="(Curtidas + comentários) ÷ views. Sem compartilhamentos."
        />
        <Metric
          title="Crescimento registrado"
          value={formatCount(sumKnown(growth))}
          detail="Diferença entre snapshots; exige ao menos dois dias registrados por conta."
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Crescimento das contas</CardTitle>
            <CardDescription>
              Seguidores e inscritos acumulados nos dias de sincronização. Lacunas não são estimadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dates.length < 2 ? (
              <EmptyState
                title="Histórico em formação"
                description="Sincronize em pelo menos dois dias para acompanhar a evolução."
                action={false}
              />
            ) : (
              <ChartContainer
                className="h-72 w-full"
                config={{
                  YouTube: { label: "YouTube", color: "var(--chart-2)" },
                  TikTok: { label: "TikTok", color: "var(--chart-4)" },
                }}
              >
                <AreaChart accessibilityLayer data={chart} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => v.slice(5).split("-").reverse().join("/")}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="YouTube"
                    type="monotone"
                    stroke="var(--color-YouTube)"
                    fill="var(--color-YouTube)"
                    fillOpacity={0.12}
                    connectNulls={false}
                  />
                  <Area
                    dataKey="TikTok"
                    type="monotone"
                    stroke="var(--color-TikTok)"
                    fill="var(--color-TikTok)"
                    fillOpacity={0.08}
                    connectNulls={false}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Comparação entre plataformas</CardTitle>
            <CardDescription>Views acumuladas na biblioteca filtrada.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {["YouTube", "TikTok"].map((platform) => (
              <div key={platform} className="flex items-center justify-between gap-3 border-b pb-4">
                <span>{platform}</span>
                <span className="font-medium tabular-nums">
                  {formatCount(sumKnown(videos.filter((v) => v.platform === platform).map((v) => v.views)))}
                </span>
              </div>
            ))}
            <p className="text-muted-foreground text-xs">
              As definições de visualização diferem entre plataformas. Totais de seguidores não representam pessoas
              únicas.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
