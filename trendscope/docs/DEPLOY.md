# Instalação e publicação

## Estrutura confirmada

Na revisão inicial, a aplicação está em `trendscope/package.json`, na branch `main`. O diretório raiz do Git contém README, hooks e um ZIP histórico. O ZIP não é usado no build.

Requisitos: Node 22 LTS; Render e CI fixados em Node **22.23.3**, com npm **10.9.9** incluído nessa versão. O lockfile é versionado. `npm install` e `npm ci` são suportados. O Next usa Turbopack, sem flags Webpack e sem dependência de StackBlitz. Apenas o cache de filesystem de build está desativado: foi reproduzida falha de leitura desse cache após reinstalação. O cache de desenvolvimento não foi alterado.

```bash
cd trendscope
npm ci
npm run lint
npm run check
npm test
npm run build
npm run typecheck
npm run start
```

Abra `http://localhost:3000/dashboard`. O comando `start` escuta `0.0.0.0` e respeita `PORT` fornecida pelo host. Sem credenciais, a interface abre vazia e permite ativar a demonstração. Isso não valida integrações reais.

## Render

Use o `render.yaml` da raiz ou crie um **Web Service Node** com:

| Configuração | Valor |
| --- | --- |
| Repository | `silasquercloud/trendscope` |
| Branch para revisão | `fix/production-readiness` |
| Root Directory | `trendscope` |
| Build Command | `npm run build:render` |
| Start Command | `npm run start` |
| Health Check | `/api/health` |
| Node | `22.23.3` |

O blueprint aponta explicitamente à branch `fix/production-readiness` e ao serviço `trendscope-1`. Usa plano `starter` e não cria banco nem ativa deploy automático. Revise o preço na sua conta antes de criar recursos. Sem acesso à conta Render não é possível confirmar criação, cobrança ou URL publicada.

### Serviço existente `trendscope-1`

Commits no `render.yaml` não alteram automaticamente um serviço criado/configurado manualmente. No painel do serviço:

1. **Settings → Build & Deploy**: branch `fix/production-readiness`, Root Directory `trendscope`, Build Command `npm run build:render`, Start Command `npm run start`.
2. **Environment**: defina `NODE_VERSION=22.23.3`, `NODE_ENV=production` e `HUSKY=0`. Verifique também os Environment Groups vinculados.
3. Remova overrides obsoletos de `NPM_CONFIG_PREFIX`, `NPM_CONFIG_WORKSPACE`, `NPM_CONFIG_WORKSPACES`, `NPM_CONFIG_IGNORE_SCRIPTS` ou `NPM_CONFIG_PACKAGE_LOCK` se estiverem definidos apenas por tentativas anteriores. Não apague segredos da aplicação. Não use `legacy-peer-deps` ou `force` para contornar o lockfile.
4. Salve os valores e use **Manual Deploy → Clear build cache & deploy** (o nome pode variar no painel). Confirme que o commit implantado pertence à branch de trabalho. Não faça merge para testar.
5. Nas primeiras linhas do build, confira `TrendScope Render build: Node v22.23.3; npm 10.9.9`, o diretório da aplicação e `Lockfile: package-lock.json (version 3)`.
6. Depois de `Live`, abra `/api/health` e `/dashboard` no endereço público informado pelo Render.

`build:render` executa **`npm ci --include=dev` e depois `npm run build`**. O npm ci continua responsável por rejeitar um lockfile divergente; não existe fallback para npm install. O diagnóstico registra somente versões, caminho da aplicação e opções de instalação sem segredos.

O `.npmrc` versionado inclui devDependencies no checkout de origem mesmo sob `NODE_ENV=production`: TypeScript, Tailwind/PostCSS e o CSS do shadcn são necessários ao build. O script `prepare` só instala hooks em checkouts locais de desenvolvimento; CI/Render/produção não dependem de Husky ou de `.git` no diretório pai.

`NODE_VERSION` definido no painel prevalece sobre `.node-version` e `engines`. O campo `packageManager` documenta npm 10.9.9, mas não força o Render a trocar o npm sozinho. O helper imprime a versão efetiva. Se o serviço ainda mostrar outra versão, verifique o ambiente salvo antes de culpar o lockfile.

É possível usar o comando equivalente `npm ci --include=dev && npm run build`, mas `npm run build:render` agrega os diagnósticos e é exatamente o comando testado na CI. A raiz Git não tem package.json/lockfile; executar npm ci nela gera EUSAGE e ajuda do npm. Não adicione outro lockfile na raiz nem altere a estrutura de workspaces para esconder um Root Directory incorreto.

Para testar somente o dashboard, não é necessário configurar OAuth ou banco. Deixe `DATABASE_URL` e `BETTER_AUTH_SECRET` ausentes/vazios; a demonstração é ativada dentro da interface. A interface funcional não equivale à homologação de integrações.

Para habilitar contas reais, configure `DATABASE_URL`, `BETTER_AUTH_URL` (URL HTTPS exata do site), `BETTER_AUTH_SECRET` (mínimo 32 caracteres aleatórios) e as credenciais desejadas de `.env.example`.

Após configurar o banco, execute uma vez `npm run db:migrate` com as mesmas variáveis (Shell/Job no Render ou uma máquina com acesso ao banco). O executor local carrega `.env`/`.env.local`; variáveis do host também funcionam. Depois reinicie o serviço. Não execute migrações concorrentes. Faça backup antes de migrar um banco existente. O migrador do Better Auth recusa alterações obrigatórias inseguras.

Sem banco, deixe `DATABASE_URL` e `BETTER_AUTH_SECRET` vazios; a interface continua acessível sem login e sem dados privados. `/api/health` é liveness HTTP, não readiness de PostgreSQL ou OAuth.

## Vercel

Importe o repositório, selecione **Next.js** e defina **Root Directory = `trendscope`** nas configurações do projeto. O `vercel.json` da aplicação agora usa build normal, sem o antigo `ignoreCommand` e sem redirecionar visitantes ao Studio Admin.

Use Node 22, `npm ci` para instalação e `npm run build`. Configure as variáveis de ambiente em Production e Preview com callbacks distintos. A Vercel gerencia a execução do Next; não configure um processo permanente `npm run start` nela. Use PostgreSQL externo com pool compatível com serverless e limite adequado de conexões. Execute migrações separadamente antes de disponibilizar login.

A sincronização é manual, limitada a 200 vídeos por conexão, e pode exceder o tempo máximo de execução de planos com funções curtas. O handler solicita até 120 segundos, mas prevalece o limite do plano. Para canais grandes, use Render ou implemente fila/worker com paginação persistida antes de ampliar esse limite.

## Verificação após deploy

- `/api/health`: 200.
- `/dashboard`: painel do TrendScope, sem métricas inventadas.
- Páginas da sidebar e assets JS/CSS: respostas sem 5xx.
- `/dashboard/default`: redireciona ao painel atual.
- `/dashboard/crm`, `/chat`, `/mail`: não expõem apps antigos.
- Teste claro/escuro, mobile, navegação, demonstração e CSV no navegador real.
- Cadastre os callbacks exatos e teste login, vínculo, sync, expiração e revogação com contas de teste antes de liberar a terceiros.

Fontes: [Render Blueprint](https://render.com/docs/blueprint-spec), [Render monorepos](https://render.com/docs/monorepo-support), [versão do Node](https://render.com/docs/node-version), [npm ci](https://docs.npmjs.com/cli/v10/commands/npm-ci/), [Vercel monorepos](https://vercel.com/docs/monorepos).
