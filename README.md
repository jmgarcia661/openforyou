# Open For You

Plataforma de Yoga, meditação e comunidade. Next.js (App Router) + TypeScript + Tailwind CSS v4 + Supabase.

Este repositório contém as **Fases 0 e 1**: sistema visual, homepage, páginas públicas, conteúdos gratuitos da semana com player, newsletter e a base de dados inicial com regras de segurança (RLS).

## Estado

| Fase | Estado |
|---|---|
| 0. Repositório, tooling, CI, base de dados | feito |
| 1. Homepage, "Esta semana", newsletter | feito |
| 2. Registo, login, conta, RGPD básico | feito (precisa de configuração, ver abaixo) |
| 3. Stripe (39 € → 59 €) | por fazer |
| 4–8. Biblioteca, calendário, Zoom, comunidade, eBook, admin | por fazer |

O código ainda **não foi executado**: corre `npm install` e `npm run build` e envia-me qualquer erro.

## Arrancar localmente

```bash
npm install
cp .env.example .env.local   # preenche os valores
npm run dev
```

Sem variáveis do Supabase, o site funciona com conteúdos de demonstração (sem ficheiros de áudio/vídeo).

Depois de `npm install`, faz commit do `package-lock.json` (o CI usa `npm ci`).

## Configurar o Supabase

1. Cria um projeto em supabase.com (cria um para **staging** e outro para **produção**).
2. No SQL Editor, executa `supabase/migrations/0001_init.sql`.
3. Opcional, só em staging: executa `supabase/seed.sql` para criar a semana de demonstração.
4. Copia `Project URL` e `anon key` para `.env.local`. Copia a `service_role key` para `SUPABASE_SERVICE_ROLE_KEY` (só no servidor, nunca no navegador nem no GitHub).
5. Cria o teu utilizador (Authentication > Users) e torna-o administrador:

```sql
insert into public.user_roles (user_id, role)
values ('<UUID-DO-TEU-UTILIZADOR>', 'admin');
```

## Como mudar os conteúdos gratuitos (até existir o painel, Fase 4/8)

1. Storage > bucket `media`: carrega o vídeo/áudio. Bucket `covers`: carrega a capa.
2. Table Editor > `content_items`: cria o conteúdo (`media_path` = caminho no bucket, `status` = `published`).
3. Table Editor > `weekly_free`: cria uma linha com `starts_on`, `ends_on` e os três IDs. Podes agendar semanas futuras. Quando o período acaba, os conteúdos deixam de ser públicos e ficam só para membros.

## Fase 2: ativar o registo e o login

O código está pronto, mas só funciona depois de ligares o Supabase. Sem isto, as páginas `/registo` e `/entrar` mostram "ainda não está disponível".

1. **Base de dados:** no SQL Editor do Supabase, corre `0001_init.sql` (se ainda não correste) e depois `0002_auth.sql`.
2. **Endereços permitidos:** Authentication > URL Configuration. Em *Site URL* coloca o endereço do site (por exemplo `https://openforyou.vercel.app`). Em *Redirect URLs* adiciona `https://openforyou.vercel.app/**` e `http://localhost:3000/**`. Quando ligares o teu domínio, acrescenta-o também.
3. **Email:** Authentication > Sign In / Providers > Email: mantém *Confirm email* ligado e define o comprimento mínimo da palavra-passe em 10.
4. **Variáveis na Vercel:** Settings > Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`. Depois faz *Redeploy* (as variáveis `NEXT_PUBLIC_` só entram no site quando é construído).
5. **Antes do lançamento:** o serviço de email por omissão do Supabase é limitado e pensado para testes. Configura um SMTP próprio (Resend) em Authentication > SMTP Settings e traduz os modelos de email para português.

Não há ainda login com Google, captcha nem limite de pedidos próprio (o Supabase aplica limites base). Ficam para a fase de segurança.

## Preços

Estão na tabela `settings` (chave `prices`, valores em cêntimos). Para alterar:

```sql
update public.settings
set value = '{"monthlyCents": 5900, "firstMonthCents": 3900, "ebookCents": 1400}'
where key = 'prices';
```

Atenção: a partir da Fase 3 o preço cobrado vem do Stripe. O valor mostrado e o configurado no Stripe têm de coincidir.

## Fotografias

Coloca em `public/images/`: `hero.jpg`, `livro-capa.jpg`, `jose-maria.jpg`. Até existirem, o site mostra um marcador discreto.

## Deployment (Vercel)

1. Importa o repositório GitHub na Vercel.
2. Define as variáveis de `.env.example` no projeto Vercel (Preview = staging, Production = produção).
3. `NEXT_PUBLIC_SITE_ENV=production` só no ambiente de produção. Nos outros, o site fica `noindex`.

## Segurança

- Todas as tabelas têm RLS ativa. Os papéis de administrador vivem em `user_roles`, fora do perfil.
- O acesso premium depende da tabela `subscriptions`, que só os webhooks Stripe (service role) vão escrever.
- Ficheiros pagos ficam num bucket privado e são servidos por links temporários.
- Nenhum segredo vai para o GitHub: usa `.env.local` e as variáveis da Vercel.
- `SUPABASE_SERVICE_ROLE_KEY` só é lida em `src/lib/supabase/admin.ts` (protegido por `server-only`).

## Scripts

`npm run dev` · `build` · `lint` · `typecheck` · `test` · `format`

## Decisões a confirmar

- **Newsletter:** as inscrições ficam `pending`. A confirmação por email (double opt-in) e o envio entram com o Resend na fase da newsletter.
- **Proteção contra spam:** campo isco por agora. Antes do lançamento, adicionar limite de pedidos por IP (ex.: Vercel/Upstash) ou Turnstile.
- **Textos legais:** `/privacidade`, `/termos`, `/cancelamento` e `/regras-da-comunidade` são marcadores. Têm de ser escritos e revistos por um jurista.
