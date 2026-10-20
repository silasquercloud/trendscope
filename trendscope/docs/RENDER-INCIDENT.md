# Falha de instalação no Render — 20/10/2026

## Evidências e limites do diagnóstico

Serviço indicado: `trendscope-1`, serviço `srv-dbbj9e4s728c738kqqng`, deploy da captura `dep-dbbj9ecs728c738kqrdg`. A captura mostra apenas o final da ajuda do npm e `Build failed`, sem a primeira linha do erro. Ela não revela a versão do Node/npm, o diretório efetivo ou overrides de ambiente. Portanto não é possível atribuir definitivamente o deploy original a uma única causa usando essa imagem.

A instalação do plugin Render foi confirmada, mas as operações de leitura/alteração de serviços não foram expostas nesta execução. Os valores efetivos do serviço, os logs completos e a URL pública não foram consultados. Não foi disparado deploy remoto nem alterada a conta Render.

## Reproduções antes da correção

| Experimento | Resultado |
| --- | --- |
| npm ci na raiz Git, que não contém package.json/lockfile | EUSAGE, mensagem de lockfile ausente, ajuda e `npm help ci` — compatível com o sintoma mostrado, sem provar que o serviço usou essa raiz |
| npm ci na aplicação sob NODE_ENV=production, sem devDependencies | prepare chama Husky; falha `sh: 1: husky: not found` (exit 127) |
| Lockfile original com Node 22.23.3/npm 10.9.9 e --include=dev | Passou sem regenerar o lockfile |
| CI anterior do PR | Passou com Node 22.23.3/npm 10.9.9, confirmado nos logs reais do GitHub |

Não há evidência de lockfile inconsistente entre package.json e package-lock.json. Nenhuma dependência foi removida, nenhum npm install foi usado como fallback e o lockfile da aplicação foi preservado byte a byte.

## Correções

- `.node-version` na raiz Git e na aplicação fixa Node 22.23.3; blueprint usa a mesma versão, branch e diretório corretos.
- `packageManager` registra npm 10.9.9, o npm incluído no Node testado. A versão efetiva aparece nos logs; não há alegação de que esse campo sobrescreva o painel Render.
- `.npmrc` mantém devDependencies necessárias à compilação mesmo sob NODE_ENV=production.
- `prepare.mjs` não tenta importar/executar Husky em CI/Render/produção ou fonte sem `.git`. Não desativa scripts de instalação das dependências.
- `npm run build:render` valida a localização do manifesto/lockfile, exige Node 22, registra opções de instalação não secretas, roda npm ci --include=dev e faz o build.
- CI passa a usar o mesmo comando sob NODE_ENV=production/RENDER=true/HUSKY=0 e verifica que o lockfile continua intacto.
- Teste de regressão executa o prepare em diretório temporário sem Husky e sem metadados Git.

## Validação desta correção

Validação local executada com Node 22.23.3/npm 10.9.9:

| Verificação | Resultado |
| --- | --- |
| `NODE_ENV=production NPM_CONFIG_OMIT=dev npm ci` na aplicação corrigida | Passou, incluindo ferramentas de build |
| `npm run build:render` em fonte sem .git, sem node_modules/.next iniciais | Instalação limpa e build de produção passaram |
| `npm test` | 11/11 passaram, incluindo regressão do prepare sem Husky/Git |
| `npm run lint` e `npm run check` | Sem erros; 1 aviso preexistente do highlighter |
| `npm run typecheck` | Passou |
| `npm run start` | Ready em 126 ms, na porta fornecida pelo ambiente |
| `npm run test:smoke` | 10 páginas 200, 17 assets 200, redirects e controles HTTP passaram |
| Lockfile | SHA-256 inalterado: `5c591d0b484b3f29bb1049b57049ee2164893ae66024565cba24611f352bfd47` |
| Interface e dependências | Nenhum arquivo de UI, rota funcional ou dependência foi removido/alterado |

Logs em `docs/validation/render/`. O build isolado usa NODE_ENV=production, RENDER=true, CI=true e HUSKY=0; também foi testada omissão de dev por ambiente. Esta é simulação local do ambiente de build, não execução dentro do Render. CI remota desta correção aguarda observação após publicação do commit.

Até haver acesso às operações do Render ou um novo deploy manual, **publicação e causa exata do deploy original permanecem sem confirmação**. `DEPLOY.md` contém os valores a salvar no serviço e a sequência de novo deploy, sem merge na main.
