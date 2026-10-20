# TrendScope — Studio Admin adaptado

Base original Studio Admin, preservando seus componentes, layouts, temas e licença MIT (ver LICENSE).

## Executar

```bash
npm ci
npm run dev
```

Abra http://localhost:3000. No StackBlitz importe o repositório e rode `npm run dev`.

## O que está implementado

- Sidebar e rotas em português para 10 seções TrendScope.
- Dashboard, contas, vídeos, analytics, monetização, tendências, áudios, laboratório, relatórios e configurações.
- Gráfico, filtros de vídeos, pesquisa, CSV, gerador local demonstrativo.
- Visual e componentes originais preservados.

## Limitações importantes

Todos os dados são fictícios. **Nenhum OAuth, banco de dados, API TikTok/YouTube, sincronização ou monetização real está implementado.** Os botões de conexão não coletam credenciais. O gerador de ideias não chama IA. Os antigos arquivos de exemplo do Studio Admin continuam no repositório para facilitar reaproveitamento, mas foram removidos do menu.

Para produção: configurar autenticação no servidor, armazenar tokens criptografados, configurar Google OAuth + YouTube APIs e TikTok Login Kit / Display API conforme aprovação e permissões. A disponibilidade de dados financeiros depende da plataforma. Nunca publicar segredos no frontend.
