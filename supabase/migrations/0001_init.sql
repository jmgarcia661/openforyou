-- Open For You — migração inicial (Fases 0–1)
-- Inclui: perfis, papéis, subscrições (preparado para a Fase 3), conteúdos,
-- conteúdos gratuitos da semana, definições, newsletter, auditoria e storage.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tipos
create type public.content_kind as enum ('yoga', 'meditation', 'sound');
create type public.content_access as enum ('free', 'premium');
create type public.editorial_status as enum ('draft', 'review', 'scheduled', 'published', 'archived');
create type public.app_role as enum ('admin');

-- ------------------------------------------------------- utilitários
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------- perfis
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  timezone text not null default 'Europe/Lisbon',
  locale text not null default 'pt',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Papéis ficam numa tabela própria para impedir que um utilizador
-- se promova a administrador editando o seu perfil.
create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  primary key (user_id, role)
);

-- ---------------------------------------------------- subscrições
-- Escrita apenas por webhooks Stripe (service role). Nunca pelo cliente.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);

-- ------------------------------------------------ funções de acesso
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.has_active_subscription()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = auth.uid()
      and status in ('active', 'trialing')
      and (current_period_end is null or current_period_end > now())
  );
$$;

-- --------------------------------------------------- conteúdos
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  kind public.content_kind not null,
  title text not null,
  description text,
  duration_min integer check (duration_min > 0),
  teacher text,
  level text,
  intensity text,
  goal text,
  -- Caminhos dentro dos buckets de storage ("media" privado, "covers" público)
  media_path text,
  cover_path text,
  -- "free" = sempre gratuito. "premium" = só membros, exceto quando
  -- estiver na tabela weekly_free durante o período gratuito.
  access public.content_access not null default 'premium',
  status public.editorial_status not null default 'draft',
  publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_items_kind_status_idx on public.content_items (kind, status);
create trigger content_items_updated before update on public.content_items
  for each row execute function public.set_updated_at();

-- Seleção gratuita semanal (3 conteúdos por período).
create table public.weekly_free (
  id uuid primary key default gen_random_uuid(),
  starts_on date not null,
  ends_on date not null,
  theme text,
  reflection text,
  yoga_id uuid references public.content_items (id),
  meditation_id uuid references public.content_items (id),
  sound_id uuid references public.content_items (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index weekly_free_period_idx on public.weekly_free (starts_on, ends_on);
create trigger weekly_free_updated before update on public.weekly_free
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------ definições
-- Preços e textos editáveis sem alterar código. NÃO guardar segredos aqui.
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create trigger settings_updated before update on public.settings
  for each row execute function public.set_updated_at();

insert into public.settings (key, value) values
  ('prices', '{"monthlyCents": 5900, "firstMonthCents": 3900, "ebookCents": 1400}')
on conflict (key) do nothing;

-- ------------------------------------------------------ newsletter
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) <= 254),
  name text check (char_length(name) <= 80),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'unsubscribed')),
  consent_at timestamptz not null,
  consent_text text not null,
  source text,
  confirm_token text not null default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now()
);
create unique index newsletter_email_idx on public.newsletter_subscribers (lower(email));

-- --------------------------------------------------------- auditoria
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- =================================================== RLS (tudo ligado)
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.content_items enable row level security;
alter table public.weekly_free enable row level security;
alter table public.settings enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.audit_log enable row level security;

-- profiles
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- user_roles: cada um vê os seus; ninguém escreve via API (só service role / SQL)
create policy roles_select_own on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- subscriptions: leitura própria; escrita só por service role (bypassa RLS)
create policy subs_select_own on public.subscriptions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- weekly_free: público só vê o período atual; admin vê e gere tudo
create policy weekly_public_current on public.weekly_free
  for select to anon, authenticated
  using (current_date between starts_on and ends_on);
create policy weekly_admin_all on public.weekly_free
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- content_items
create policy content_public_current_free on public.content_items
  for select to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.weekly_free w
      where current_date between w.starts_on and w.ends_on
        and content_items.id in (w.yoga_id, w.meditation_id, w.sound_id)
    )
  );
create policy content_members_published on public.content_items
  for select to authenticated
  using (status = 'published' and public.has_active_subscription());
create policy content_admin_all on public.content_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- settings: leitura pública (sem segredos), escrita só admin
create policy settings_public_read on public.settings
  for select to anon, authenticated using (true);
create policy settings_admin_write on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- newsletter: qualquer pessoa pode pedir inscrição (pendente, com consentimento)
create policy newsletter_insert_pending on public.newsletter_subscribers
  for insert to anon, authenticated
  with check (status = 'pending' and consent_at is not null);
create policy newsletter_admin_all on public.newsletter_subscribers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- audit_log: só admin lê; escrita via service role / funções
create policy audit_admin_read on public.audit_log
  for select to authenticated using (public.is_admin());

-- ======================================================== storage
insert into storage.buckets (id, name, public) values
  ('media', 'media', false),     -- vídeo, áudio, eBook: acesso por links temporários
  ('covers', 'covers', true)     -- capas e imagens públicas
on conflict (id) do nothing;

create policy covers_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'covers');
create policy storage_admin_all on storage.objects
  for all to authenticated
  using (bucket_id in ('media', 'covers') and public.is_admin())
  with check (bucket_id in ('media', 'covers') and public.is_admin());
