"use client";
import { useState } from "react";

import { Download, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { Section, Video } from "@/lib/trendscope/types";

import { EmptyState } from "./empty-state";
import { exportVideos } from "./video-library";

export function CreatorTools({
  section,
  videos,
  aiEnabled,
  signedIn,
}: {
  section: Section;
  videos: Video[];
  aiEnabled: boolean;
  signedIn: boolean;
}) {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("Tutorial");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function generate() {
    if (busy || !aiEnabled || !signedIn) return;
    setBusy(true);
    setError("");
    setDraft("");
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, format }),
        signal: AbortSignal.timeout(55000),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Não foi possível gerar o conteúdo.");
        return;
      }
      setDraft(result.text);
    } catch {
      setError("Falha de conexão ou tempo limite. Tente novamente em um minuto.");
    } finally {
      setBusy(false);
    }
  }
  if (section === "money")
    return (
      <>
        <div className="grid gap-4 md:grid-cols-3">
          {["Receita estimada", "RPM", "Pagamentos recebidos"].map((label) => (
            <Card key={label}>
              <CardHeader>
                <CardDescription>{label}</CardDescription>
                <CardTitle>Indisponível</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">Sem fonte financeira</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
        <EmptyState
          title="Receitas exigem autorização específica"
          description="O conector atual lê perfis e vídeos. Relatórios financeiros do YouTube exigem YouTube Analytics, escopo monetário e canal elegível. TikTok Display API não fornece receita. Nenhum valor é estimado pelo TrendScope."
          action={false}
        />
      </>
    );
  if (section === "trends" || section === "sounds")
    return (
      <Card>
        <CardHeader>
          <CardTitle>{section === "trends" ? "Descoberta por fontes oficiais" : "Biblioteca de áudios"}</CardTitle>
          <CardDescription>Nenhum ranking fictício ou coleta não autorizada.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Fonte autorizada ainda não integrada"
            description={
              section === "trends"
                ? "OAuth de uma conta não libera rankings globais. O conector de tendências e seus filtros por nicho dependem de uma fonte licenciada ou endpoint permitido."
                : "TikTok Display API não disponibiliza um catálogo global de músicas em alta. A biblioteca depende de uma fonte licenciada e permanece vazia."
            }
            action={false}
          />
          <div className="flex flex-wrap gap-4 text-sm">
            <a
              className="underline underline-offset-4"
              href="https://www.youtube.com/feed/trending"
              target="_blank"
              rel="noreferrer"
            >
              Explorar no YouTube
            </a>
            <a
              className="underline underline-offset-4"
              href="https://ads.tiktok.com/business/creativecenter/"
              target="_blank"
              rel="noreferrer"
            >
              TikTok Creative Center
            </a>
          </div>
        </CardContent>
      </Card>
    );
  if (section === "reports")
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relatório de desempenho</CardTitle>
          <CardDescription>
            Exporta os vídeos da conta, plataforma e período selecionados, com estatísticas acumuladas. Não inclui
            receitas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <p>{videos.length} vídeos no relatório · APIs oficiais</p>
          <Button disabled={!videos.length} variant="outline" onClick={() => exportVideos(videos)}>
            <Download data-icon="inline-start" />
            Baixar CSV
          </Button>
          {!videos.length && <EmptyState title="Sem dados para exportar" />}
        </CardContent>
      </Card>
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Planeje seu próximo vídeo</CardTitle>
        <CardDescription>
          Ideias, títulos e roteiros gerados pela OpenAI. O assunto e o formato são enviados ao provedor ao gerar.
          Revise o conteúdo antes de publicar.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {(!aiEnabled || !signedIn) && (
          <EmptyState
            title={!aiEnabled ? "Provedor de IA não configurado" : "Entre para gerar conteúdo"}
            description={
              !aiEnabled
                ? "Configure OPENAI_API_KEY e OPENAI_MODEL no servidor. Não usamos respostas prontas como IA."
                : "Conecte uma conta em Minhas contas. Até 20 tentativas por dia, com um minuto entre elas."
            }
            action={false}
          />
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void generate();
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="topic">Assunto ou nicho</FieldLabel>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={160}
                minLength={3}
                disabled={busy || !aiEnabled || !signedIn}
                required
                placeholder="Ex.: setup gamer acessível"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="format">Formato</FieldLabel>
              <NativeSelect
                disabled={busy || !aiEnabled || !signedIn}
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                {["Tutorial", "Comparação", "Bastidores", "História curta"].map((value) => (
                  <NativeSelectOption key={value}>{value}</NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Button type="submit" disabled={busy || !aiEnabled || !signedIn || topic.trim().length < 3}>
              <Sparkles data-icon="inline-start" />
              {busy ? "Gerando conteúdo…" : "Gerar com IA"}
            </Button>
          </FieldGroup>
        </form>
        {error && <p role="alert">{error}</p>}
        {draft && (
          <pre aria-live="polite" className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-sans text-sm">
            {draft}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
