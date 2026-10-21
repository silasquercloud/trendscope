"use client";
import { useState } from "react";

import { useRouter } from "next/navigation";

import { Music2, Play, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import type { Workspace } from "@/lib/trendscope/types";

import { EmptyState } from "./empty-state";
import { IntegrationSetup } from "./integration-setup";
import { formatCount } from "./performance";

export function Accounts({ workspace, notify }: { workspace: Workspace; notify: (message: string) => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function connect(provider: "google" | "tiktok") {
    setBusy(true);
    try {
      const result = workspace.user
        ? await authClient.linkSocial({ provider, callbackURL: "/dashboard/contas" })
        : await authClient.signIn.social({ provider, callbackURL: "/dashboard/contas" });
      if (result.error) notify("Não foi possível iniciar OAuth. Verifique a configuração do provedor.");
    } catch {
      notify("Falha de conexão ao iniciar autenticação.");
    } finally {
      setBusy(false);
    }
  }
  async function mutate(id: string, remove: boolean) {
    setBusy(true);
    try {
      const response = await fetch(`/api/accounts/${encodeURIComponent(id)}${remove ? "" : "/sync"}`, {
        method: remove ? "DELETE" : "POST",
      });
      const result = await response.json();
      const successMessage = remove
        ? "Conexão local removida. Revogue também o acesso no provedor."
        : "Sincronização concluída com a API oficial.";
      notify(response.ok ? successMessage : (result.error ?? "Falha ao processar a solicitação."));
      router.refresh();
    } catch {
      notify("Não foi possível alcançar o servidor.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-col gap-4">
      {(!workspace.configured.google || !workspace.configured.tiktok) && (
        <IntegrationSetup configured={workspace.configured} />
      )}
      <div className="flex flex-wrap gap-2">
        {(["google", "tiktok"] as const).map((provider) => (
          <Button
            key={provider}
            disabled={busy || !workspace.configured[provider]}
            variant="outline"
            onClick={() => {
              void connect(provider);
            }}
          >
            {provider === "google" ? <Play data-icon="inline-start" /> : <Music2 data-icon="inline-start" />}
            {workspace.user ? "Conectar" : "Entrar com"} {provider === "google" ? "YouTube / Google" : "TikTok"}
          </Button>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">
        Uma conexão por identidade OAuth; conecte identidades adicionais com a sessão ativa. Canais de marca do YouTube
        exigem a identidade correspondente.{" "}
        {(!workspace.configured.google || !workspace.configured.tiktok) &&
          "Provedores sem credenciais estão desativados."}
      </p>
      {!workspace.accounts.length && (
        <EmptyState
          title="Nenhuma conta conectada"
          description="Use um provedor habilitado acima. O acesso depende de OAuth e das permissões aprovadas para o aplicativo."
          action={false}
        />
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workspace.accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <CardDescription>{account.platform}</CardDescription>
              <CardTitle>{account.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Badge variant="secondary">
                {
                  { connected: "Autorizada", reconnect: "Reconexão necessária", error: "Erro de sincronização" }[
                    account.status
                  ]
                }
              </Badge>
              <div className="font-semibold text-2xl tabular-nums">{formatCount(account.followers)}</div>
              <p className="text-muted-foreground text-xs">
                Seguidores / inscritos ·{" "}
                {account.syncedAt
                  ? `Sincronizado em ${new Date(account.syncedAt).toLocaleString("pt-BR")}`
                  : "Nunca sincronizada"}
              </p>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => {
                  void mutate(account.id, false);
                }}
              >
                <RefreshCw data-icon="inline-start" />
                Sincronizar
              </Button>
              <Button
                disabled={busy}
                variant="ghost"
                onClick={() => {
                  void connect(account.provider);
                }}
              >
                Reconectar
              </Button>
              <Button
                disabled={busy}
                variant="destructive"
                onClick={() => {
                  void mutate(account.id, true);
                }}
              >
                Desconectar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        Desconectar apaga os dados locais da conexão. A última conta de acesso é preservada. Para revogar tokens, use as
        permissões da conta Google ou TikTok. Uma autorização revogada será sinalizada na próxima sincronização.
      </p>
    </div>
  );
}
