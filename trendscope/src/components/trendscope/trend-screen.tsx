"use client";
import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CircleAlert, LogOut } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { filterVideos } from "@/lib/trendscope/metrics";
import { type Section, sectionNames, type Workspace } from "@/lib/trendscope/types";

import { Accounts } from "./accounts";
import { CreatorTools } from "./creator-tools";
import { Performance } from "./performance";
import { VideoLibrary } from "./video-library";

export function TrendScreen({
  section,
  workspace,
  aiEnabled,
}: {
  section: Section;
  workspace: Workspace;
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [platform, setPlatform] = useState("all");
  const [account, setAccount] = useState("all");
  const [search, setSearch] = useState("");
  const [days, setDays] = useState(0);
  const source = workspace;
  const videos = filterVideos(source.videos, { platform, account, search, days });
  const accounts = source.accounts.filter(
    (a) => (platform === "all" || a.platform === platform) && (account === "all" || a.id === account),
  );
  const usesFilters = ["overview", "videos", "analytics", "reports"].includes(section);
  async function signOut() {
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setNotice("Não foi possível encerrar a sessão.");
        return;
      }
      router.refresh();
    } catch {
      setNotice("Não foi possível alcançar o servidor.");
    }
  }
  const sourceLabel = workspace.user ? "Sessão ativa · sincronização manual" : "Nenhuma sessão ativa";
  return (
    <main className="@container/main mx-auto flex w-full max-w-7xl flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">TrendScope / Creator Studio</p>
          <h1 className="mt-1 font-semibold text-2xl tracking-tight md:text-3xl">{sectionNames[section]}</h1>
          <p className="mt-2 text-muted-foreground text-sm">Seu conteúdo, suas contas e resultados em um só lugar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{sourceLabel}</Badge>
          {section !== "accounts" && !workspace.accounts.length && (
            <Button asChild>
              <Link href="/dashboard/contas">Conectar minhas contas</Link>
            </Button>
          )}
        </div>
      </div>
      <Alert>
        <CircleAlert />
        <AlertTitle>Dados das suas contas</AlertTitle>
        <AlertDescription>
          Conecte e sincronize suas contas para consultar métricas oficiais. Nenhum valor demonstrativo é exibido.
        </AlertDescription>
      </Alert>
      {(notice || workspace.error) && (
        <Alert role="status">
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>{notice || workspace.error}</AlertDescription>
          {notice && (
            <Button variant="ghost" size="sm" onClick={() => setNotice("")}>
              Fechar
            </Button>
          )}
        </Alert>
      )}
      {usesFilters && (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Filtros de desempenho</CardTitle>
            <CardDescription>
              Período de publicação dos vídeos. O gráfico usa datas de sincronização; os totais de seguidores são
              atuais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Field>
                <FieldLabel htmlFor="platform">Plataforma</FieldLabel>
                <NativeSelect
                  id="platform"
                  value={platform}
                  onChange={(e) => {
                    setPlatform(e.target.value);
                    setAccount("all");
                  }}
                >
                  <NativeSelectOption value="all">Todas</NativeSelectOption>
                  <NativeSelectOption>YouTube</NativeSelectOption>
                  <NativeSelectOption>TikTok</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="account">Conta</FieldLabel>
                <NativeSelect id="account" value={account} onChange={(e) => setAccount(e.target.value)}>
                  <NativeSelectOption value="all">Todas as contas</NativeSelectOption>
                  {source.accounts
                    .filter((a) => platform === "all" || a.platform === platform)
                    .map((a) => (
                      <NativeSelectOption key={a.id} value={a.id}>
                        {a.name}
                      </NativeSelectOption>
                    ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="period">Período</FieldLabel>
                <NativeSelect id="period" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  <NativeSelectOption value={0}>Todo o histórico disponível</NativeSelectOption>
                  <NativeSelectOption value={7}>Últimos 7 dias</NativeSelectOption>
                  <NativeSelectOption value={30}>Últimos 30 dias</NativeSelectOption>
                  <NativeSelectOption value={90}>Últimos 90 dias</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="search">Buscar vídeo ou conta</FieldLabel>
                <Input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Digite para buscar…"
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      )}
      {(section === "overview" || section === "analytics") && (
        <Performance accounts={accounts} videos={videos} snapshots={source.snapshots} days={days} />
      )}
      {(section === "overview" || section === "videos") && <VideoLibrary videos={videos} />}
      {section === "accounts" && <Accounts workspace={source} notify={setNotice} />}
      {["money", "trends", "sounds", "ai", "reports"].includes(section) && (
        <CreatorTools section={section} videos={videos} aiEnabled={aiEnabled} signedIn={Boolean(workspace.user)} />
      )}
      {section === "settings" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Integrações e segurança</CardTitle>
              <CardDescription>Configuração no servidor; nenhum segredo é solicitado pelo navegador.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[
                ["Autenticação / PostgreSQL", workspace.configured.auth],
                ["Google / YouTube OAuth", workspace.configured.google],
                ["TikTok Login Kit", workspace.configured.tiktok],
                ["OpenAI", aiEnabled],
              ].map(([name, configured]) => (
                <div key={String(name)} className="flex flex-wrap justify-between gap-2">
                  <span>{name}</span>
                  <Badge variant="outline">{configured ? "Credenciais configuradas" : "Não configurado"}</Badge>
                </div>
              ))}
              <Separator />
              <p className="text-muted-foreground text-sm">
                Tokens criptografados no servidor. Sessões em cookies HttpOnly. Acesso aos dados limitado ao usuário
                autenticado.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Preferências e sessão</CardTitle>
              <CardDescription>
                Idioma da interface: português do Brasil. Tema, fontes e layout podem ser ajustados nos controles do
                cabeçalho.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-4">
              <p>As preferências visuais ficam salvas neste navegador por cookies.</p>
              <p className="text-muted-foreground text-sm">
                {workspace.user ? `Conectado como ${workspace.user.name}` : "Você está navegando sem autenticação."}
              </p>
              {workspace.user && (
                <Button
                  variant="outline"
                  onClick={() => {
                    void signOut();
                  }}
                >
                  <LogOut data-icon="inline-start" />
                  Sair da conta
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      <Separator />
      <footer className="text-muted-foreground text-xs">
        TrendScope · Base visual Studio Admin · Fontes: YouTube Data API e TikTok Display API, quando autorizadas
      </footer>
    </main>
  );
}
