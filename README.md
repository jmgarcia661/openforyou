# Open For You

Plataforma de Yoga, meditação e comunidade. Next.js (App Router) + TypeScript + Tailwind CSS v4 + Supabase.

Este repositório contém as **Fases 0 e 1**: sistema visual, homepage, páginas públicas, conteúdos gratuitos da semana com player, newsletter e a base de dados inicial com regras de segurança (RLS).

## Estado

| Fase | Estado |
|---|---|
| 0. Repositório, tooling, CI, base de dados | feito |
| 1. Homepage, "Esta semana", newsletter | feito |
| 2. Registo, login, conta, RGPD básico | feito (precisa de configuração, ver abaixo) |
| 3. Stripe (39 € → 59 €) | feito (precisa de configuração, ver abaixo) |
| 4. Conteúdos, painel de administração, biblioteca para membros | feito (precisa de configuração, ver abaixo) |
| 5. Calendário, aulas em direto, sala de espera em tempo real | feito (Zoom com links colados à mão) |
| 5b. Criar reuniões Zoom automaticamente pela API | por fazer |
| 6. Comunidade privada e moderada | feito (precisa da migração 0005) |
| 7. Venda do eBook | feito (precisa da migração 0006) |
| 8. Newsletter, emails, textos legais, lançamento | por fazer |

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

## Fase 3: ativar os pagamentos (Stripe)

Faz tudo primeiro em **modo de teste** (interruptor "Test mode" no Stripe). Só passas a modo real no fim.

1. **Produto e preço:** Product catalog > Add product. Nome "Open For You, acesso completo". Preço recorrente de 59 EUR, mensal. Copia o ID do preço (`price_...`).
2. **Cupão:** Product catalog > Coupons > New. Tipo "Amount off" de 20 EUR, duração **Once**. Copia o ID do cupão.
3. **Chaves:** Developers > API keys. Copia a *Secret key* de teste (`sk_test_...`).
4. **Área do cliente:** Settings > Billing > Customer portal. Ativa o cancelamento, a atualização do método de pagamento e a lista de faturas, e guarda.
5. **Webhook:** Developers > Webhooks > Add endpoint. Endereço: `https://openforyou.vercel.app/api/stripe/webhook`. Eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `charge.refunded`. Depois de criar, copia o *Signing secret* (`whsec_...`).
6. **Variáveis na Vercel** (as de chave são do tipo Secret): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `STRIPE_FIRST_MONTH_COUPON_ID`. Opcional: `STRIPE_AUTOMATIC_TAX=true` quando o Stripe Tax estiver configurado. Depois faz *Redeploy*.
7. **Teste:** em `/subscrever`, paga com o cartão de teste `4242 4242 4242 4242`, qualquer data futura e qualquer CVC.

O site recusa-se a abrir o pagamento se o preço e o cupão do Stripe não derem exatamente os valores guardados na tabela `settings` (59 €, 39 €), para nunca mostrar um preço e cobrar outro.

**Pontos que precisam de decisão tua:**
- **IVA:** o preço de 59 € deve ser com IVA incluído? Define-o no preço do Stripe (`tax_behavior`) e confirma com o teu contabilista.
- **Texto legal do checkout:** a caixa sobre o direito de livre resolução de 14 dias deve ser revista por um jurista.
- **Pagamento falhado:** com a regra atual, o acesso fica suspenso quando o Stripe marca a subscrição como `past_due`. Se quiseres um período de tolerância, diz-me.
- **Reembolsos:** ficam registados em `audit_log`. O acesso só termina se cancelares a subscrição.

## Fase 4: conteúdos e painel de administração

1. **Base de dados:** no SQL Editor do Supabase, corre `0003_content.sql`.
2. **Tornar-te administrador:** o teu utilizador tem de estar na tabela de papéis. Em Authentication > Users copia o teu UID e corre:

```sql
insert into public.user_roles (user_id, role)
values ('O-TEU-UID-AQUI', 'admin');
```

3. **Painel:** abre `/admin`. Aí podes adicionar aulas, meditações e sons (com ficheiro e capa), gerir a **semana grátis** e ver os números. Os membros veem a biblioteca em `/praticar`.
4. **Limite de ficheiros:** no plano gratuito do Supabase cada ficheiro tem no máximo **50 MB** e o armazenamento total é de 1 GB. Serve para áudio e vídeos curtos de teste. Para aulas inteiras é preciso o plano Pro (Storage > Settings > Global file size limit) ou passar os vídeos para o Mux, que está previsto.
5. **Como funciona o acesso:** as regras estão na base de dados. Um conteúdo só aparece a quem o pode ver (gratuito, na semana grátis, ou para membros com subscrição ativa). O link do ficheiro é temporário e só é gerado depois dessa verificação.
6. **Agendar:** escolhe o estado Publicado e uma data futura em "Publicar a partir de".

## Fase 5: aulas em direto

1. **Base de dados:** no SQL Editor do Supabase, corre `0004_live.sql`. Se aparecer um erro a dizer que a tabela já está na publicação `supabase_realtime`, ignora-o.
2. **Criar uma aula:** `/admin/aulas` > Criar aula. A hora é a do fuso que escolheres (por omissão Lisboa), não a do teu computador. Podes repetir a aula todas as semanas (as horas mantêm-se certas nas mudanças de hora de verão).
3. **Zoom (por agora à mão):** cria a reunião no Zoom, abre a aula em `/admin/aulas`, clica em Gerir e cola o link dos participantes e, se quiseres, o do anfitrião. Só administradores os veem.
4. **No dia:** a sala de espera abre sozinha 15 minutos antes (ou clicas em "Abrir sala de espera"). Quando clicas em **Abrir aula no Zoom**, todas as pessoas na sala recebem a atualização sem recarregar a página e aparece o botão "Entrar agora na aula".
5. **Controlo:** podes avisar de um atraso, pausar e reabrir entradas, terminar ou cancelar a aula, e ver quantas pessoas estão na sala de espera.
6. **Gravação:** depois da aula, adiciona-a em Conteúdos como aula de Yoga publicada e associa-a à aula.
7. **Membros:** veem as aulas em `/calendario` (semana ou mês), na hora do seu fuso, e podem adicionar ao Google Calendar, Apple Calendar ou Outlook.

O que ainda não existe: lembretes por email (24 horas, 1 hora e 10 minutos antes) precisam do Resend e entram na fase de lançamento, e a criação automática das reuniões pela API do Zoom (Fase 5b).

## Fase 6: comunidade

1. **Base de dados:** no SQL Editor do Supabase, corre `0005_community.sql`.
2. **Membros:** `/comunidade`. Escrevem, comentam, dão um coração, editam e eliminam o que é seu e podem denunciar. A primeira vez aceitam as regras, e cada fotografia exige a confirmação de que podem partilhá-la.
3. **Moderação:** `/admin/comunidade`. Por omissão as publicações aparecem logo e tu moderas depois (retirar, fixar, fechar comentários, suspender 7 dias, bloquear, tratar denúncias). Há um interruptor para passar a **aprovar antes**: nesse modo cada publicação nova fica na fila até a aprovares.
4. **Fotografias:** vão para um bucket privado e só são mostradas a membros, com links temporários. Máximo 5 MB, JPG, PNG ou WebP. Usam o mesmo armazenamento (1 GB no plano gratuito).
5. **Privacidade:** os outros membros veem só o primeiro nome e a inicial do apelido. Ao eliminar a conta, as publicações, os comentários e as fotografias também desaparecem, e entram na exportação de dados.
6. **Regras da comunidade:** existe um rascunho em `/regras-da-comunidade`, que tem de ser revisto por um jurista antes do lançamento.
7. **Ainda não há emails:** quem publica vê o estado na própria publicação. Os avisos por email entram com o Resend.

## Fase 7: eBook

1. **Base de dados:** corre `0006_ebook.sql` no SQL Editor do Supabase.
2. **Configuração:** `/admin/livro`. Carrega o eBook (PDF ou EPUB), o excerto gratuito (PDF) e a capa, escolhe a meditação exclusiva, põe o link do Kindle e define o preço. O preço do eBook vem sempre deste painel, por isso o valor mostrado é o valor cobrado.
3. **Compra:** `/livro`. Não precisa de conta. O pagamento é feito no Stripe e a pessoa fica numa página privada (`/livro/acesso/...`) com o download do eBook e a meditação.
4. **Segurança:** o eBook fica num bucket privado. Cada download é contado (5 por compra) e o link do ficheiro dura um minuto. O acesso expira ao fim de 30 dias, e uma compra reembolsada deixa de funcionar.
5. **Registo de compras:** `/admin/livro` mostra as compras. O webhook do Stripe que já existe regista a compra e os reembolsos, sem configuração nova.
6. **Emails:** ainda não há. O recibo vem do Stripe e a página da compra é o acesso. Com o Resend, o link da compra passa a ser enviado por email.
7. **Registos de venda:** ao eliminar uma conta, os registos de compra do eBook ficam, porque são registos de venda. A política de privacidade deve dizê-lo.

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
