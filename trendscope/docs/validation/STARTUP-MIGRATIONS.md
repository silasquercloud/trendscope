# Inicialização e provisionamento

- PostgreSQL `trendscope-db` criado no workspace autorizado, plano Free, PostgreSQL 16, Oregon. ID: `dpg-dbc2f5on74is73f4r6d0-a`. Estado retornado: `available`.
- Expiração retornada pelo Render: `2026-11-20T02:46:47.621027Z`.
- Consulta SQL de diagnóstico pelo MCP não foi executada: o banco bloqueia conexões externas. A lista de acesso externa permaneceu vazia. Não houve abertura pública para contornar essa restrição.
- `BETTER_AUTH_URL` foi atualizada para a URL pública, com merge das variáveis existentes. Nenhum segredo existente foi substituído.
- A URL interna com credenciais não é exposta pelas ferramentas conectadas; `DATABASE_URL`, segredo válido, OAuth e chave/modelo de IA continuam dependendo da configuração no painel.

Validação local com Node 22.23.3 / npm 10.9.9:

- `npm test`: 15 aprovados.
- `npm run typecheck`: exit 0.
- `npm run check`: exit 0, um aviso preexistente no highlighter.
- Inicialização pelo novo script, com migrações desativadas: health 200, dez páginas 200, 17 arquivos JS/CSS 200, redirects/404s/proteção de origem aprovados.
- SIGTERM encaminhado ao Next.js; script encerrou dentro de cinco segundos.
- Migrações habilitadas com configuração incompleta: teste confirmou falha antes de iniciar, sem imprimir o segredo de teste.

Não foram aplicadas migrações nem validadas conexões reais com esse banco. OAuth e chamadas reais à IA não foram ativados ou homologados sem credenciais. O status `available` do banco não significa que a aplicação esteja conectada a ele.
