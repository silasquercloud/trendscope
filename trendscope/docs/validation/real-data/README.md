# Validação: modo real e tema escuro

Ambiente local: Node.js 22.23.3 / npm 10.9.9.

- `npm ci --include=dev`: terminou com sucesso; lockfile e dependências não alterados.
- `npm run check`: sucesso; permanece um aviso preexistente em `src/lib/highlighter.tsx` (índice como chave).
- `npm test`: 14 testes aprovados. Os três testes novos do adaptador de IA usam fetch controlado; não representam chamadas reais à OpenAI.
- `npm run build`: exit code 0, compilação Turbopack e TypeScript aprovados; artefato `.next/BUILD_ID` produzido.
- `npm run start` + `npm run test:smoke`: dez rotas 200, 17 arquivos JS/CSS, tema escuro no HTML, ausência do botão demonstrativo, redirecionamentos, 404 de rotas antigas, health e proteção de origem aprovados.
- `POST /api/ideas` com origem local permitida e sem sessão: HTTP 401. Origem ausente: HTTP 403.

As primeiras tentativas HTTP locais falharam com ECONNREFUSED porque o servidor não persistiu entre execuções isoladas. A execução registrada em `http.log` iniciou o servidor e os testes no mesmo processo controlador e concluiu as verificações.

Limites: sem PostgreSQL ou credenciais de terceiros neste ambiente. Migração, quota em PostgreSQL, OAuth, sincronização com contas reais e geração efetiva no provedor de IA não foram homologados. Nenhuma métrica fictícia é disponibilizada pela aplicação.

O registro de CI e deploy deve identificar o commit efetivamente publicado. Não confundir a remoção das simulações com a ativação das credenciais externas.
