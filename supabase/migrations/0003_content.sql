-- Fase 4: conteúdos para membros, favoritos e aulas concluídas.

alter table public.content_items
  add column if not exists materials text,
  add column if not exists transcript text;

-- Favoritos e concluídas (cada pessoa só vê e altera as suas)
create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  content_id uuid not null references public.content_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

create table public.completions (
  user_id uuid not null references auth.users (id) on delete cascade,
  content_id uuid not null references public.content_items (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

alter table public.favorites enable row level security;
alter table public.completions enable row level security;

create policy favorites_own on public.favorites
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy completions_own on public.completions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Visibilidade dos conteúdos: refazer as regras para respeitar a data de publicação.
drop policy if exists content_public_current_free on public.content_items;
drop policy if exists content_members_published on public.content_items;

-- Gratuito durante a semana em que está na seleção gratuita
create policy content_public_current_free on public.content_items
  for select to anon, authenticated
  using (
    status = 'published'
    and (publish_at is null or publish_at <= now())
    and exists (
      select 1 from public.weekly_free w
      where current_date between w.starts_on and w.ends_on
        and content_items.id in (w.yoga_id, w.meditation_id, w.sound_id)
    )
  );

-- Sempre gratuito (acesso "free")
create policy content_always_free on public.content_items
  for select to anon, authenticated
  using (
    status = 'published'
    and access = 'free'
    and (publish_at is null or publish_at <= now())
  );

-- Membros com subscrição ativa veem tudo o que está publicado
create policy content_members_published on public.content_items
  for select to authenticated
  using (
    status = 'published'
    and (publish_at is null or publish_at <= now())
    and public.has_active_subscription()
  );
