import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Workspace } from "@/lib/trendscope/types";

export function IntegrationSetup({ configured }: { configured: Workspace["configured"] }) {
  const steps = [
    {
      name: "Banco e autenticação",
      ready: configured.auth,
      detail: "Configure PostgreSQL, DATABASE_URL, BETTER_AUTH_URL e BETTER_AUTH_SECRET; execute npm run db:migrate.",
    },
    {
      name: "YouTube",
      ready: configured.google,
      detail: "Habilite YouTube Data API v3 e configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no Render.",
    },
    {
      name: "TikTok",
      ready: configured.tiktok,
      detail:
        "Configure TIKTOK_CLIENT_KEY e TIKTOK_CLIENT_SECRET de um aplicativo com Login Kit e Display API aprovados.",
    },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ative suas conexões</CardTitle>
        <CardDescription>
          Configure o aplicativo uma vez; depois autorize suas contas pelos botões de conexão.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {steps.map((step) => (
          <div key={step.name} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{step.name}</span>
              <Badge variant="outline">{step.ready ? "Credenciais configuradas" : "Configuração pendente"}</Badge>
            </div>
            {!step.ready && <p className="text-muted-foreground text-sm">{step.detail}</p>}
          </div>
        ))}
        <a
          href="https://github.com/silasquercloud/trendscope/blob/fix/production-readiness/trendscope/docs/REAL-DATA.md"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4"
        >
          Abrir guia de ativação das integrações
        </a>
        <p className="text-muted-foreground text-xs">
          Credenciais são configuradas apenas no servidor. Não envie senhas ou tokens por esta página.
        </p>
      </CardContent>
    </Card>
  );
}
