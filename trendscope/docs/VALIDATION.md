# Auditoria e validação — 20/10/2026

## Resultado e limites

A aplicação compila e o servidor de produção responde às dez páginas do TrendScope. Isso não certifica uma plataforma integralmente pronta para produção: QA visual no navegador, PostgreSQL real, OAuth real, receitas, fontes de tendências/áudios, IA externa e deploy ainda estão pendentes.

Ambiente testado: Linux x86_64, Node **24.19.0**, npm **11.9.0**, Next **16.4.2**, React **19.3.1**, Lucide **1.59.0**. A CI remota também validou **Node 22**: instalação, lint/check, 10 testes, build, TypeScript e smoke HTTP passaram no [run 39396765931](https://github.com/silasquercloud/trendscope/actions/runs/39396765931), commit `60c1807c3441fd37bab067fa6e9315d483cab25f`.

## Falhas reproduzidas e alterações

| Problema | Evidência / correção |
| --- | --- |
| `Youtube` não exportado por Lucide | Build original falhou nas variantes cliente e SSR; removido o import, usando `Play` suportado |
| Fontes dependentes da rede | Registro original usava múltiplas fontes `next/font/google`; agora WOFF2 locais via Fontsource/Geist, com Merriweather real |
| Painel errado | `next.config.mjs` redirecionava `/dashboard` para o dashboard empresarial original; removido e compatibilidade `/dashboard/default` invertida |
| Vercel não compilava o produto | `ignoreCommand` pulava build e redirect global apontava ao site do autor; removidos |
| Diretório incorreto no deploy | Confirmado `trendscope/package.json`; blueprint e instruções usam `trendscope` como root |
| Dados/funções do template | Rotas antigas removidas; atalhos sem ação, usuários fictícios e rastreador do autor retirados do shell |
| Métricas inventadas | Estado inicial vazio; demonstração opt-in separada, com badge e origem em CSV; sem receita fictícia |
| Cache de build Turbopack | Após reinstalação, reproduzido `Failed to open database / Loading persistence directory / invalid digit found in string`; é o banco do cache do bundler, não o PostgreSQL. Desativado só `turbopackFileSystemCacheForBuild`, conforme a documentação da versão instalada |
| Inicialização em ambiente restrito | `next start` falhou ao enumerar interfaces (`uv_interface_addresses`). Host explícito `0.0.0.0` iniciou normalmente e é apropriado ao Render |
| Hook apontava para raiz sem package.json | Hook passa a executar o npm dentro da aplicação; prepare configura o hook a partir da raiz Git |
| APIs/tokens | Arquitetura Better Auth + PG; consultas com proprietário, origem em mutações, tokens criptografados e endpoints de obtenção/refresh de token bloqueados ao cliente |
| Dependências do template | Removidos pacotes sem consumidores após exclusão de rotas (dnd-kit, react-hook-form/resolvers, d3-geo, topojson, temporal-polyfill e tipos associados); shadcn CLI fica em devDependencies, necessário ao CSS no build |

## Testes executados

| Verificação | Resultado |
| --- | --- |
| `npm install` | Passou |
| `npm ci` | Passou; instalação limpa feita durante a validação |
| `npm run lint` | Passou, sem erros; 1 warning preexistente |
| `npm run check` | Passou, sem erros; 1 warning preexistente |
| `npm test` | **10/10** passaram |
| `npm run typecheck` | Passou |
| `npm run build` | Passou com Turbopack após as correções; build repetido com cache desativado também passou |
| `npm run start` | Servidor pronto em 189 ms na rodada HTTP registrada; escuta porta fornecida pelo ambiente |
| `npm run test:smoke` | Dez rotas 200, 17 assets JS/CSS 200, redirects 307, rotas antigas 404, workspace vazio, health, proteção de origem e auth não configurada |
| HTTP com configuração fictícia de auth (sem sessão) | Quatro variantes de endpoints de tokens retornaram 404; sincronização e remoção sem sessão retornaram 401; workspace sem dados privados/segredos |
| `npm audit --omit=dev --json` | **0 vulnerabilidades** nas dependências de produção no momento da execução |
| CI GitHub Actions / Node 22 | **Passou** — instalação, lint/check, testes, build, TypeScript e smoke HTTP |
| `git diff --check` | Passou |
| Integridade dos componentes protegidos | Nenhuma alteração em `src/components/ui/` e `src/components/calendar/` |

O warning remanescente de Biome é `noArrayIndexKey` em `src/lib/highlighter.tsx`, código do template usado para destacar tokens. Não foi desativado o linter para ocultá-lo. A auditoria inicial incluindo shadcn CLI apresentou 7 alertas altos transitivos em tooling; mover a CLI para dev não corrige esses alertas de desenvolvimento. Eles não constam na árvore auditada de produção. Não foi aplicado downgrade incompatível da CLI.

### Cobertura dos testes automatizados

- Filtros simultâneos por conta, plataforma, busca e data de publicação.
- Estatísticas ausentes versus zero, cálculo de engajamento e não invenção de totais.
- CSV com aspas, BOM, origem demonstrativa e neutralização de fórmulas.
- Normalização de respostas oficiais com schemas Zod.
- YouTube: paginação, batching, host fixo e Bearer header; inscritos ocultos.
- TikTok: contadores ausentes, erros da API, token inválido, ausência de views globais.
- Configuração de autenticação fechada sem segredo/banco e proteção de origem contra requisições cruzadas.

As respostas dos provedores nos testes são fixtures simuladas, sem OAuth real. Não medimos quotas ou desempenho dos serviços externos.

### Saída do smoke de produção

```text
Assets: 17 JS/CSS files served
200 /dashboard
200 /dashboard/contas
200 /dashboard/videos
200 /dashboard/analises
200 /dashboard/monetizacao
200 /dashboard/tendencias
200 /dashboard/audios
200 /dashboard/laboratorio
200 /dashboard/relatorios
200 /dashboard/configuracoes
Redirects, legacy 404s, empty workspace, health, CSRF and unconfigured auth verified.
```

### Verificações não executadas

- **Navegador:** não houve infraestrutura de browser QA disponível neste fluxo. Não foram feitos screenshots, medição responsiva, teste de hidratação/interações, download efetivo no navegador ou confirmação de ausência de erros do console. HTTP e build não substituem isso.
- **PostgreSQL:** migração e queries reais ainda não foram executadas contra um servidor PostgreSQL acessível. O esquema foi inspecionado em relação ao migrador instalado, mas requer validação real antes de habilitar contas.
- **Google/TikTok:** não foram fornecidos credenciais, apps aprovados ou contas de teste. Login, vínculo, renovação, revogação e sincronização real ainda precisam de homologação.
- **Hospedagem:** sem sessão/credenciais Render ou Vercel disponível; nenhum site foi publicado. Não há URL de produção validada.
A CI remota foi observada como `completed / success` no run vinculado acima. Ela valida a base sem credenciais; não executa PostgreSQL ou OAuth reais.

## Próximos critérios para produção completa

Valide banco/migrações, OAuth e isolamento entre dois usuários reais; finalize retenção/exclusão de dados e requisitos dos provedores; execute QA claro/escuro/mobile e console; publique e valide a URL real. Monetização, tendências, áudios e IA externa continuam explicitamente não implementados, conforme `ARCHITECTURE.md` e `INTEGRATIONS.md`.
