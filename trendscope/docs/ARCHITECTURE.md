# Arquitetura e escopo

## Decisões

Next.js 16.4.2 com App Router e Turbopack padrão. Estrutura da aplicação preservada dentro de `trendscope/`; não movemos o projeto supondo uma raiz diferente. Scripts npm e lockfile reproduzíveis. PostgreSQL guarda identidades Better Auth, sessões, rate limits, conexões, último cache e snapshots diários. O banco é necessário para contas reais; a experiência vazia é independente dele.

As rotas são Server Components pequenos. `TrendPage` carrega dados seguros; os componentes de recurso cuidam de filtros, gráficos, comparação, CSV, conexões e modelos locais. Tipos e cálculos ficam em `src/lib/trendscope/`; fixtures de demonstração são separadas. Integrações e banco ficam em `src/server/`. Nenhum token é passado para props ou variáveis públicas.

Preservados: `src/components/ui/` e `src/components/calendar/` intactos, shell Studio Admin, sidebar recolhível/mobile, command palette, controles de layout, transições, temas claro/escuro/sistema, presets e escolhas de fonte. As fontes agora vêm de arquivos WOFF2 locais dos pacotes Fontsource/Geist. Seus pacotes retêm as licenças. Sem Google Fonts em build/runtime.

Removidas as rotas funcionais alheias ao produto (CRM, finanças do template, pacientes, e-commerce, chat, e-mail, login fictício etc.). O histórico do Git e o ZIP original continuam disponíveis. Removidos botões sem ação e rastreamento Google Analytics pertencente ao autor do template. Atribuição/licença da base permanece.

## Funcionalidades

| Área | Implementado | Limite / dependência |
| --- | --- | --- |
| Dashboard | Métricas derivadas, comparação, gráfico de snapshots, filtros | Dados reais exigem OAuth e sincronização |
| Minhas contas | Login/vínculo Google/TikTok, múltiplas identidades, sync manual, reconectar, remover vínculo local | Banco, migração e apps aprovados; OAuth não homologado com contas reais |
| Vídeos | Biblioteca normalizada, busca, conta/plataforma/período, comparação de até 3, CSV | Até 200 vídeos recentes por conexão; sem paginação de UI |
| Analytics | Seguidores, snapshots, crescimento registrado e engajamento | Sem retropreencher histórico; não consulta YouTube Analytics diário |
| Monetização | Estado indisponível honesto | API monetária ainda não implementada |
| Radar | Estado vazio e acesso ao explorador oficial | Descoberta e filtros por nicho ainda não implementados |
| Áudios | Estado vazio e referência oficial | Fonte licenciada ainda não integrada |
| Laboratório | Modelos locais de ideia, títulos, roteiro e formato | Sem IA externa; integração ainda pendente |
| Relatórios | CSV da biblioteca filtrada com indicação de origem | Não é relatório de receita nem views geradas no período |
| Configurações | Estado das integrações, sessão/logout, idioma fixo pt-BR, temas/layout/fontes persistidos em cookies | Sem editor de segredos ou idioma alternativo |

## Definições de métricas

- Views, curtidas e comentários são acumulados por vídeo. Filtro de período seleciona **data de publicação**, não data em que uma visualização ocorreu.
- Seguidores/inscritos são o último total sincronizado das contas selecionadas, mesmo com filtro de publicação.
- Engajamento = `(curtidas + comentários) / views × 100`. Não inclui compartilhamentos e não equivale a todas as definições de engajamento dos provedores.
- Quando falta qualquer componente de uma soma, o total aparece indisponível. Zero conhecido é preservado; ausente não vira zero.
- Gráfico usa um snapshot por conexão/dia UTC e não interpola dados ausentes. Crescimento exige ao menos dois dias registrados de cada conta.
- CSV tem BOM UTF-8, quoting e proteção contra células interpretadas como fórmulas. Demonstração sempre exporta `DEMONSTRAÇÃO`; nenhum campo financeiro fictício existe.

## Fora do escopo validado

Sem migração ou OAuth real validado neste ambiente, sem worker/fila/cron, sem provedor de IA, sem fontes globais de tendências, sem receita, sem deploy externo nem QA visual de navegador. Esses itens não são considerados concluídos por existir interface para eles. Consulte `VALIDATION.md` para os testes efetivamente executados.
