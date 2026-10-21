# Integrações e segurança

## O que foi preparado

Better Auth + PostgreSQL, sessões em cookies HttpOnly, tokens OAuth criptografados no banco com `BETTER_AUTH_SECRET`, Google e TikTok como provedores. Login e vínculo explícito usam o SDK oficial do Better Auth. O vínculo implícito por e-mail foi desativado; adicionar uma identidade diferente exige sessão autenticada e prova de controle pelo OAuth. TikTok não fornece e-mail verificado; a identidade é baseada no identificador do provedor, sem confiar em e-mail informado pelo navegador.

A configuração é inicializada somente quando necessária. Build e navegação vazia não exigem banco. As rotas de leitura usam o usuário da sessão; toda consulta de conta filtra o proprietário. Sincronizações e exclusões exigem origem igual à URL configurada. IDs externos não substituem a identidade autenticada. Apenas campos normalizados são enviados ao cliente.

`/api/auth/get-access-token`, `/refresh-token` e `/account-info` estão bloqueados ao cliente. O servidor chama `auth.api.getAccessToken` diretamente para renovar tokens. O Better Auth faz a renovação; falhas e 401 das APIs deixam a conexão em erro ou exigindo reconexão. Não há renovação por cron ou sincronização automática. Rate limit do auth usa PostgreSQL; sincronização tem reserva atômica de dois minutos por conexão. Não registre respostas completas de OAuth, tokens ou strings de conexão.

## Configuração inicial

1. Crie PostgreSQL gerenciado. Use TLS de acordo com o provedor; não desative verificação de certificados indiscriminadamente.
2. Copie `.env.example` para `.env.local`, configure as variáveis e gere um segredo aleatório de pelo menos 32 caracteres (`openssl rand -base64 32`). Não versione esse arquivo.
3. Execute `npm run db:migrate` com o banco correto. Isso cria o esquema Better Auth, snapshots e cache de sincronizações.
4. Configure pelo menos um provedor aprovado. Reinicie o servidor.
5. Entre em **Minhas contas**, faça OAuth e clique em **Sincronizar**.

Não altere o segredo sem um plano de rotação: tokens existentes dependem dele e poderão exigir nova autorização. O comando de migração é para o banco escolhido pelo operador, nunca para uma base de terceiros.

## Google / YouTube

No Google Cloud, habilite **YouTube Data API v3**, configure a tela de consentimento e um cliente OAuth de aplicação Web. Cadastre:

- Local: `http://localhost:3000/api/auth/callback/google`
- Produção: `https://SEU-DOMINIO/api/auth/callback/google`

Variáveis: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Escopos: identidade padrão do Google e `https://www.googleapis.com/auth/youtube.readonly`. A configuração solicita acesso offline e consentimento. Credenciais de testes, usuários permitidos, verificação de aplicativo e políticas do Google devem ser resolvidos no projeto do operador.

O conector usa `channels.list(mine=true)`, a playlist de uploads e `videos.list`. Não usa busca ou scraping. Pagina em lotes de 50 até 200 vídeos. Só vídeos devolvidos pela API entram na biblioteca; vídeos removidos/privados sem acesso e estatísticas ocultas não são inventados. Inscritos ocultos aparecem como indisponíveis. Escolha a identidade/canal de marca correspondente na autorização. O suporte é uma conexão por identidade OAuth, não um gerenciador de todos os canais de marca de um Google Account.

O OAuth atual NÃO solicita YouTube Analytics nem escopo monetário. Receitas continuam indisponíveis. Para implementá-las, habilite YouTube Analytics API, solicite `yt-analytics.readonly` / `yt-analytics-monetary.readonly` conforme a consulta, valide elegibilidade/autorização do canal e trate `403`, moeda, datas e valores estimados. Não inferir receita por views/RPM. Pagamentos bancários não são equivalentes a receita estimada.

## TikTok

Crie e obtenha aprovação para **Login Kit** e **Display API**. Cadastre as URLs exatas:

- Local, se permitido pela configuração do aplicativo: `http://localhost:3000/api/auth/callback/tiktok`
- Produção: `https://SEU-DOMINIO/api/auth/callback/tiktok`

O TikTok pode exigir HTTPS e domínio verificado; nesse caso faça a validação na URL HTTPS cadastrada. Use `TIKTOK_CLIENT_KEY` e `TIKTOK_CLIENT_SECRET`.

Escopos solicitados: `user.info.basic`, `user.info.profile`, `user.info.stats`, `video.list`. Todos devem estar aprovados e concedidos. O Better Auth instalado tem provedor nativo TikTok (inclui tratamento de `client_key` e renovação), não uma adaptação genérica inventada.

Endpoints usados: `/v2/user/info/` e `/v2/video/list/` em `open.tiktokapis.com`. Paginação de 20 até 200 vídeos. O Display API fornece vídeos públicos e métricas autorizadas; não fornece receita, histórico diário retroativo ou catálogo global de sons/tendências. Total de visualizações da conta permanece indisponível. Não calcule esse total a partir de biblioteca parcial.

## Expiração, revogação e exclusão

- Sincronizar usa/renova o token no servidor; 401 ou `access_token_invalid` pede reconexão.
- Falhas de quota, escopo, rede e payload geram erro visível sem substituir o último cache por zeros.
- **Reconectar** repete OAuth com a sessão ativa.
- **Desconectar** remove a conexão local e seus snapshots/cache via cascata; a última identidade de login é preservada pelo Better Auth. Sessão recente pode ser exigida.
- Desconexão local não revoga a permissão remotamente. Revogue-a em [Permissões Google](https://myaccount.google.com/connections) ou nas configurações de segurança/permissões do TikTok. A revogação será identificada na sincronização seguinte.
- Não há webhook de revogação ou fluxo de exclusão integral da conta implementado. Antes de liberar publicamente, publique política de privacidade, retenção e exclusão e conclua os requisitos dos provedores. O dashboard é `noindex` via robots, mas isso não é controle de acesso.

## IA e tendências

Não há credenciais ou provedor de IA configurado nesta entrega. O laboratório usa a OpenAI Responses API pelo servidor, com sessão obrigatória, quota diária e intervalo mínimo entre chamadas. Configure OPENAI_API_KEY e OPENAI_MODEL e execute as migrações. Não há respostas locais de fallback. A chamada real ao provedor depende das credenciais e não foi homologada; veja REAL-DATA.md.

Radar e áudios usam estados vazios e links aos exploradores oficiais; não exibem rankings antigos como atuais. Fontes licenciadas/permitidas e filtros por nicho dependem de implementação posterior. OAuth Display API não concede automaticamente esses dados.

## Fontes oficiais

- [Better Auth — opções](https://better-auth.com/docs/reference/options), [OAuth](https://better-auth.com/docs/concepts/oauth), [banco](https://better-auth.com/docs/concepts/database)
- [YouTube OAuth servidor](https://developers.google.com/youtube/reporting/guides/authorization/server-side-web-apps), [YouTube Analytics](https://developers.google.com/youtube/analytics/reference/)
- [TikTok Display API](https://developers.tiktok.com/doc/display-api-overview/), [escopos](https://developers.tiktok.com/doc/tiktok-api-scopes/), [vídeos](https://developers.tiktok.com/doc/tiktok-api-v2-video-list/)

Credenciais, aprovação de aplicativos, quotas e callbacks reais não foram fornecidos. Testes locais usam fixtures; não certificam funcionamento com contas reais nem substituem homologação dos provedores.
