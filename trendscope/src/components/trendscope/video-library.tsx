"use client";
import { useState } from "react";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { videosCSV } from "@/lib/trendscope/metrics";
import type { Video } from "@/lib/trendscope/types";

import { EmptyState } from "./empty-state";
import { formatCount } from "./performance";

export function exportVideos(videos: Video[], demo: boolean) {
  const url = URL.createObjectURL(new Blob([videosCSV(videos, demo)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `trendscope-${demo ? "demo" : "oficial"}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
export function VideoLibrary({ videos, demo }: { videos: Video[]; demo: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);
  const comparison = videos.filter((v) => selected.includes(`${v.accountId}/${v.id}`));
  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Biblioteca de vídeos</CardTitle>
          <CardDescription>Estatísticas acumuladas dos vídeos publicados no período selecionado.</CardDescription>
        </div>
        <Button variant="outline" disabled={!videos.length} onClick={() => exportVideos(videos, demo)}>
          <Download data-icon="inline-start" />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!videos.length ? (
          <EmptyState
            title="Nenhum vídeo encontrado"
            description="Conecte uma conta, sincronize ou ajuste os filtros."
          />
        ) : (
          <>
            <p className="text-muted-foreground text-xs">Selecione até 3 vídeos para comparar.</p>
            <Table>
              <TableHeader>
                <TableRow>
                  {["Comparar", "Vídeo", "Plataforma", "Views", "Curtidas", "Comentários"].map((title) => (
                    <TableHead key={title}>{title}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((v) => {
                  const key = `${v.accountId}/${v.id}`;
                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <Checkbox
                          aria-label={`Comparar ${v.title}`}
                          checked={selected.includes(key)}
                          disabled={!selected.includes(key) && comparison.length >= 3}
                          onCheckedChange={(checked) =>
                            setSelected((prev) =>
                              checked ? [...prev.filter((id) => id !== key), key] : prev.filter((id) => id !== key),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="max-w-72 truncate font-medium">
                          {v.url ? (
                            <a
                              href={v.url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline-offset-4 hover:underline"
                            >
                              {v.title}
                            </a>
                          ) : (
                            v.title
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {v.account} · {new Date(v.publishedAt).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                        </div>
                      </TableCell>
                      <TableCell>{v.platform}</TableCell>
                      <TableCell>{formatCount(v.views)}</TableCell>
                      <TableCell>{formatCount(v.likes)}</TableCell>
                      <TableCell>{formatCount(v.comments)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {comparison.length > 0 && (
              <div className="grid gap-3 md:grid-cols-3">
                {comparison.map((v) => (
                  <Card key={`${v.accountId}/${v.id}`} size="sm">
                    <CardHeader>
                      <CardTitle>{v.title}</CardTitle>
                      <CardDescription>{v.platform}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <dt>Views</dt>
                        <dd>{formatCount(v.views)}</dd>
                        <dt>Curtidas</dt>
                        <dd>{formatCount(v.likes)}</dd>
                        <dt>Comentários</dt>
                        <dd>{formatCount(v.comments)}</dd>
                      </dl>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
