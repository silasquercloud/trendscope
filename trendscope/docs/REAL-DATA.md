# Ativar dados reais

O modo demonstrativo foi removido da aplicação. Filtros, comparação, gráficos e CSV usam exclusivamente os dados sincronizados. As amostras restantes ficam em `tests/fixtures`, fora da aplicação.

O tema inicial é escuro. Uma preferência explícita já salva pelo visitante continua sendo respeitada; o botão de tema no cabeçalho permite mudar para escuro.

## Banco e autenticação

Configure um PostgreSQL e adicione as variáveis **no Environment do Render**, nunca no GitHub ou no navegador:

- `DATABASE_URL`: conexão PostgreSQL (com TLS se exigido pelo provedor).
- `BETTER_AUTH_URL`: `https://trendscope-1-35k8.onrender.com`.
- `BETTER_AUTH_SECRET`: segredo aleatório de pelo menos 32 caracteres; mantenha o mesmo entre deploys.

Execute `npm run db:migrate` na pasta `trendscope` com essas variáveis. Isso cria as tabelas Better Auth, sincronizações, histórico e limite de IA. Faça backup antes de migrar um banco existente. No plano gratuito sem Shell, execute pelo terminal local contra a conexão externa segura do banco. Não cole segredos em chat.

## YouTube

No projeto Google Cloud, habilite YouTube Data API v3, configure a tela OAuth e crie um cliente do tipo Web. Cadastre a URL de callback:

`https://trendscope-1-35k8.onrender.com/api/auth/callback/google`

Configure `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no Render. Enquanto o aplicativo estiver em teste, adicione as contas autorizadas como usuários de teste. Aplicativos externos podem exigir verificação para uso público dos escopos. Depois de salvar e publicar, use **Minhas contas → Entrar com YouTube / Google → Sincronizar**. Estatísticas não são preenchidas antes dessa autorização.

## TikTok

Cadastre um aplicativo TikTok for Developers com Login Kit e Display API, domínio e callback:

`https://trendscope-1-35k8.onrender.com/api/auth/callback/tiktok`

Configure `TIKTOK_CLIENT_KEY` e `TIKTOK_CLIENT_SECRET` no Render. Solicite os escopos `user.info.basic`, `user.info.profile`, `user.info.stats` e `video.list`; permissões e uso público dependem da aprovação do aplicativo. Conecte a conta pela interface e sincronize. A Display API não fornece receita nem catálogo global de áudios em alta.

## IA real

Configure `OPENAI_API_KEY` e `OPENAI_MODEL` no Render com uma chave e um modelo de texto habilitado no seu projeto OpenAI. A integração usa a Responses API, sem respostas locais de fallback, com `store: false`. Assunto e formato são enviados somente após clicar em **Gerar com IA**. Requer sessão autenticada e migrações. Há limite atômico no PostgreSQL de 20 tentativas por usuário por dia e uma por minuto, inclusive em caso de falha do provedor. Consumo segue a cobrança da sua conta OpenAI; nenhum saldo ou chave foi criado por esta alteração.

## Limitações que dependem de fontes adicionais

- Monetização YouTube depende de um conector YouTube Analytics e autorização financeira específica, ainda não implementados.
- Rankings de tendências e áudios globais dependem de um conector autorizado, ainda não implementado; os links para os portais oficiais continuam disponíveis.
- Métricas históricas começam nas sincronizações; não há retroatividade inventada. Cada conexão lê até 200 vídeos recentes.

`/api/workspace` informa apenas se autenticação e provedores estão configurados, nunca retorna segredos. Credenciais presentes não comprovam aprovação do aplicativo: valide OAuth e sincronização com uma conta de teste.
