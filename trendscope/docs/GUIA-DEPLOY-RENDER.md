# TrendScope — deploy e ativação no Render

## Estado desta instalação

- Repositório: https://github.com/silasquercloud/trendscope
- Branch de teste: `fix/production-readiness`. Não faça merge na `main` para testar.
- Serviço existente: **trendscope-1** — https://dashboard.render.com/web/srv-dbbj9e4s728c738kqqng
- Site: https://trendscope-1-35k8.onrender.com/dashboard
- Banco criado: **trendscope-db**, PostgreSQL 16, gratuito, Oregon, mesmo workspace — https://dashboard.render.com/d/dpg-dbc2f5on74is73f4r6d0-a
- O banco está disponível no Render. A conexão com a aplicação e as migrações ainda dependem da configuração abaixo; não foram validadas com uma conexão real.
- O banco gratuito expira em **19 de novembro de 2026 às 23:46, horário de Brasília** (20/11/2026 02:46 UTC). Exporte ou migre antes da expiração. Esse plano não é indicado para produção permanente e não tem backups gerenciados.
- Tema escuro inicial, sem modo demonstrativo. Sem conexões autorizadas, métricas aparecem indisponíveis.

## 1. Confira o serviço existente

Abra o serviço → **Settings → Build & Deploy**. Não crie outro serviço.

| Campo | Valor |
| --- | --- |
| Runtime | Node |
| Branch | `fix/production-readiness` |
| Root Directory | `trendscope` (uma barra final também funciona) |
| Build Command | `npm run build:render` |
| Start Command | `npm run start` |
| Health Check Path | `/api/health` |
| Node | `22.23.3` |
| Plano atual | Free |

`build:render` executa `npm ci --include=dev` usando o lockfile e depois `npm run build`. Não troque por `npm install` para contornar falhas. A pasta raiz do repositório não contém o package.json da aplicação.

O `render.yaml` documenta o deploy, mas um serviço criado manualmente não aplica suas alterações automaticamente. Não importe um novo Blueprint para tentar alterar este serviço sem revisar a associação dos recursos existentes.

## 2. Conecte o banco e prepare a autenticação

1. Abra o banco **trendscope-db** → **Connect** ou seção de conexões.
2. Copie **Internal Database URL**. Não use a URL externa no serviço Render e não envie esse valor em chat ou no GitHub.
3. Abra **trendscope-1 → Environment** e adicione/atualize as variáveis da tabela.

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | Cole a Internal Database URL do banco |
| `BETTER_AUTH_URL` | `https://trendscope-1-35k8.onrender.com` — já configurada nesta instalação |
| `BETTER_AUTH_SECRET` | Segredo aleatório de pelo menos 32 caracteres; se já existir um segredo válido, preserve-o |
| `RUN_DB_MIGRATIONS` | `1` |
| `NODE_VERSION` | `22.23.3` |
| `NODE_ENV` | `production` |
| `HUSKY` | `0` |

Para criar o segredo no seu próprio terminal, execute `openssl rand -hex 32` e cole o resultado apenas no Environment. Não copie os sinais `<` e `>` nem exemplos fictícios como valores. Guarde esse segredo: os tokens OAuth criptografados dependem dele. Não o substitua a cada deploy.

Salve as variáveis juntas. Escolha **Save, rebuild, and deploy** se essa opção aparecer. Caso apenas salve, use **Manual Deploy → Deploy latest commit**. Se já houver deploy em andamento por essa alteração, acompanhe-o em vez de iniciar outro.

Com `RUN_DB_MIGRATIONS=1`, `npm run start` aplica `npm run db:migrate` antes de iniciar o Next.js. Isso cria as tabelas de autenticação, contas, sincronizações, histórico e limite de IA. Se a migração falhar, o servidor não inicia com esquema incompleto. A inicialização respeita `PORT` e escuta em `0.0.0.0`.

A migração é feita no runtime, usando a rede privada do Render, sem exigir Shell pago ou liberar acesso externo ao banco. O banco foi criado com a lista de acesso externo vazia; preserve essa configuração para esta instalação.

## 3. Ative Google / YouTube

Na sua conta Google Cloud:

1. Selecione/crie um projeto e habilite **YouTube Data API v3**.
2. Configure a tela de consentimento em **Google Auth Platform**: identidade do app, público e contatos exigidos. Enquanto o app estiver em teste, inclua seu e-mail nos usuários de teste.
3. Crie um cliente OAuth do tipo **Web application**.
4. Cadastre a URI de redirecionamento exata:

   `https://trendscope-1-35k8.onrender.com/api/auth/callback/google`

5. No Environment do serviço, configure `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
6. Salve e publique. No site, abra **Minhas contas → Entrar com YouTube / Google**, autorize o canal correto e clique em **Sincronizar**.

O conector solicita identidade Google e `https://www.googleapis.com/auth/youtube.readonly`. Ele lê canal, inscritos visíveis e até 200 vídeos recentes com estatísticas permitidas. Contas adicionais são vinculadas com uma sessão ativa. Canais de marca exigem a identidade correspondente na autorização.

Para uso público, conclua a verificação exigida pelo Google. Em modo de teste, usuários e validade dos tokens têm limitações definidas pelo Google. Criar o serviço no Render não cria um projeto OAuth nem concede acesso às suas contas.

## 4. Ative TikTok

Na sua conta TikTok for Developers:

1. Cadastre um aplicativo com **Login Kit** e **Display API**.
2. Configure o domínio HTTPS e os requisitos de privacidade, termos e exclusão de dados exigidos pelo TikTok. Não declare aprovações ou políticas inexistentes.
3. Cadastre:

   `https://trendscope-1-35k8.onrender.com/api/auth/callback/tiktok`

4. Solicite/aprove os escopos `user.info.basic`, `user.info.profile`, `user.info.stats` e `video.list`.
5. Configure `TIKTOK_CLIENT_KEY` e `TIKTOK_CLIENT_SECRET` no Render e publique.
6. Use **Minhas contas → Entrar com TikTok → Sincronizar**.

A aprovação do aplicativo depende do TikTok. Display API não fornece receita, total vitalício de views da conta ou catálogo global de músicas em alta. Esses campos não são estimados a partir da biblioteca parcial.

## 5. Ative a IA real

1. No seu projeto OpenAI, crie uma chave da API e habilite faturamento/saldo quando necessário. A assinatura ChatGPT não substitui a configuração da API.
2. Configure no Render:

   - `OPENAI_API_KEY`: sua chave, somente no servidor.
   - `OPENAI_MODEL`: ID de um modelo de texto disponível no seu projeto e compatível com a Responses API.

3. Salve e publique. Entre com uma conta já autorizada e abra **Laboratório IA**.
4. Informe o assunto/formato e clique em **Gerar com IA**.

A aplicação envia o assunto e formato à OpenAI, com `store: false`; não envia tokens OAuth. Exige autenticação e as migrações. Limites: 20 tentativas por usuário por dia e uma por minuto. Falhas do provedor também consomem tentativas. Há cobrança conforme o uso da sua conta OpenAI; nenhuma chave ou contratação foi criada automaticamente.

## 6. O que não é ativado apenas com variáveis

| Recurso | O que ainda falta |
| --- | --- |
| Receita YouTube | Implementar conector YouTube Analytics, escopos monetários e validar canal elegível. O OAuth atual não solicita esses escopos. |
| Receita TikTok | Fonte financeira autorizada; Display API não oferece esse dado. |
| Radar global | Implementar uma fonte/endpoint permitido para rankings e filtros. |
| Áudios globais | Implementar uma fonte licenciada/autorizada para catálogo e tendências. |
| Sincronização automática | Worker/cron ainda não implementado; sincronização atual é manual. |
| Histórico anterior | Depende de API com esse histórico. Snapshots locais começam ao sincronizar. |

Não é correto preencher esses recursos com estimativas ou considerar um botão desativado uma integração concluída. O acesso aos portais oficiais continua disponível nas páginas correspondentes.

## 7. Valide o deploy

Em **Events/Deploys**, aguarde o deploy ficar **Live**. Um build concluído ainda não comprova que o servidor iniciou.

1. Nos logs, confira a versão Node 22, o diretório `/opt/render/project/src/trendscope`, instalação pelo lockfile e build concluído.
2. Com migrações habilitadas, confira `Migrações aplicadas.` antes de `Ready`.
3. Abra `/api/health`: deve responder HTTP 200.
4. Abra `/api/workspace`: deve mostrar `configured.auth: true` e os provedores configurados, sem segredos. Isso confirma presença de configuração, não valida OAuth nem o banco por si só.
5. Abra `/dashboard/contas`, faça OAuth e sincronize uma conta real.
6. Confira vídeos, filtros e CSV. Métricas devem corresponder à API; dados ausentes permanecem indisponíveis.
7. Gere um roteiro com a IA e confirme uma resposta efetiva do provedor.
8. Confira console do navegador, tema escuro, navegação e celular. Não considere aprovação de CI prova de acesso real às APIs.

## 8. Se falhar

- **npm ci mostra apenas a ajuda:** confirme Root Directory e a existência de `trendscope/package-lock.json`; não use o ZIP antigo como raiz.
- **Configure DATABASE_URL...:** `RUN_DB_MIGRATIONS=1` foi ativado sem as três variáveis necessárias. Corrija todas juntas.
- **Falha na migração:** confira a URL interna, banco disponível, mesma região/workspace e permissões. Não exponha o banco publicamente para tentar corrigir uma conexão interna.
- **redirect_uri_mismatch:** callback no provedor deve coincidir exatamente com domínio, caminho e HTTPS deste guia.
- **OAuth recusado:** confira usuários de teste, aprovação do aplicativo e escopos concedidos.
- **IA retorna erro:** confira chave, modelo, saldo, migrações e intervalo de um minuto. Não publique a chave para depurar.
- **Precisa reverter:** faça deploy de um commit anterior da mesma branch pelo painel. Reverter código não reverte tabelas, credenciais ou operações externas. Nunca substitua o segredo para tentar corrigir um erro genérico.

Referências oficiais: [Render Free](https://render.com/docs/free), [PostgreSQL](https://render.com/docs/postgresql-creating-connecting), [Google OAuth YouTube](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps), [TikTok Display API](https://developers.tiktok.com/doc/display-api-overview/), [OpenAI Responses](https://developers.openai.com/api/reference/resources/responses/methods/create).
