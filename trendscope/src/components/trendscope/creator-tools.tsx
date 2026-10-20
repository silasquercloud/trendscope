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

export function CreatorTools({ section, videos, demo }: { section: Section; videos: Video[]; demo: boolean }) {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("Tutorial");
  const [draft, setDraft] = useState("");
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
          <p>
            {videos.length} vídeos no relatório · {demo ? "Demonstração" : "APIs oficiais"}
          </p>
          <Button disabled={!videos.length} variant="outline" onClick={() => exportVideos(videos, demo)}>
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
          Modelos locais de ideias, títulos e roteiros. Não utiliza inteligência artificial. Integração com provedor de
          IA ainda pendente.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const subject = topic.trim();
            if (!subject) return;
            setDraft(
              `Ideia · ${format} sobre ${subject}\n\nTítulos para adaptar:\n• 3 descobertas sobre ${subject}\n• O que aprendi com ${subject}\n• ${subject}: do início ao resultado\n\nRoteiro base:\n0–3s: apresente o resultado e uma pergunta sobre ${subject}.\n3–15s: mostre o problema com um exemplo concreto.\n15–45s: explique três passos e mostre evidências.\n45–60s: resuma e convide o público a compartilhar uma experiência.\n\nFormato sugerido: ${format}. Revise fatos e adapte ao seu público.`,
            );
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
                required
                placeholder="Ex.: setup gamer acessível"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="format">Formato</FieldLabel>
              <NativeSelect id="format" value={format} onChange={(e) => setFormat(e.target.value)}>
                {["Tutorial", "Comparação", "Bastidores", "História curta"].map((value) => (
                  <NativeSelectOption key={value}>{value}</NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Button type="submit" disabled={!topic.trim()}>
              <Sparkles data-icon="inline-start" />
              Montar modelo local
            </Button>
          </FieldGroup>
        </form>
        {draft && (
          <pre aria-live="polite" className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-sans text-sm">
            {draft}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
