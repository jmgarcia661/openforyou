-- Fase 6: comunidade privada e moderada.
-- Por omissão as publicações aparecem logo e o administrador modera depois.
-- Pode passar-se a "aprovar antes" mudando a definição "community" (ver o painel).

alter table public.profiles add column if not exists community_rules_accepted_at timestamptz;

insert into public.settings (key, value) values ('community', '{"moderation": "after"}')
on conflict (key) do nothing;

-- Suspensões e bloqueios de membros
create table public.member_moderation (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null check (status in ('suspended', 'blocked')),
  until timestamptz,
  note text,
  created_at timestamptz not null default now()
);

-- Quem pode ler e participar: administrador, ou membro ativo que não está suspenso nem bloqueado.
create or replace function public.community_access()
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_admin()
    or (
      public.has_active_subscription()
      and not exists (
        select 1 from public.member_moderation m
        where m.user_id = auth.uid()
          and (m.status = 'blocked' or (m.status = 'suspended' and (m.until is null or m.until > now())))
      )
    );
$$;

-- Nome que os outros membros veem: primeiro nome e inicial do apelido ("Ana S.")
create or replace function public.community_display_name(uid uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (
      select nullif(
        trim(
          split_part(trim(p.full_name), ' ', 1) ||
          case
            when array_length(string_to_array(trim(p.full_name), ' '), 1) > 1
            then ' ' || left((string_to_array(trim(p.full_name), ' '))[array_length(string_to_array(trim(p.full_name), ' '), 1)], 1) || '.'
            else ''
          end
        ),
        ''
      )
      from public.profiles p where p.id = uid
    ),
    'Membro'
  );
$$;

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default 'Membro',
  body text not null check (char_length(body) between 1 and 2000),
  image_path text,
  photo_consent boolean not null default false,
  theme text,
  status text not null default 'published' check (status in ('pending', 'published', 'rejected', 'removed')),
  pinned boolean not null default false,
  comments_closed boolean not null default false,
  moderator_note text,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_photo_needs_consent check (image_path is null or photo_consent)
);
create index community_posts_feed_idx on public.community_posts (status, pinned desc, created_at desc);

create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default 'Membro',
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'published' check (status in ('published', 'removed')),
  created_at timestamptz not null default now()
);
create index community_comments_post_idx on public.community_comments (post_id, created_at);

create table public.community_reactions (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid references public.community_posts (id) on delete cascade,
  comment_id uuid references public.community_comments (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  status text not null default 'open' check (status in ('open', 'handled')),
  created_at timestamptz not null default now(),
  constraint community_report_target check ((post_id is not null) <> (comment_id is not null))
);

-- ------------------------------------------------------------- regras automáticas
-- Novas publicações: o servidor decide o autor, o nome e o estado (ninguém se auto-aprova).
create or replace function public.community_posts_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare mode text;
begin
  new.author_id := coalesce(auth.uid(), new.author_id);
  new.author_name := public.community_display_name(new.author_id);
  select coalesce(value ->> 'moderation', 'after') into mode from public.settings where key = 'community';
  if public.is_admin() or coalesce(mode, 'after') <> 'before' then
    new.status := 'published';
  else
    new.status := 'pending';
  end if;
  new.pinned := false;
  new.comments_closed := false;
  new.moderator_note := null;
  new.moderated_at := null;
  return new;
end $$;

create trigger community_posts_insert before insert on public.community_posts
  for each row execute function public.community_posts_before_insert();

-- Alterações: o autor só pode mudar o texto. Mudar o texto de uma publicação recusada
-- volta a pô-la na fila; no modo "aprovar antes", volta também à fila.
create or replace function public.community_posts_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare mode text;
begin
  if public.is_admin() then
    if new.status is distinct from old.status then
      new.moderated_at := now();
    end if;
    new.updated_at := now();
    return new;
  end if;

  new.author_id := old.author_id;
  new.author_name := old.author_name;
  new.image_path := old.image_path;
  new.photo_consent := old.photo_consent;
  new.theme := old.theme;
  new.pinned := old.pinned;
  new.comments_closed := old.comments_closed;
  new.moderator_note := old.moderator_note;
  new.moderated_at := old.moderated_at;
  new.status := old.status;

  if new.body is distinct from old.body then
    select coalesce(value ->> 'moderation', 'after') into mode from public.settings where key = 'community';
    if old.status = 'rejected' then
      new.status := 'pending';
    elsif old.status = 'published' and coalesce(mode, 'after') = 'before' then
      new.status := 'pending';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger community_posts_update before update on public.community_posts
  for each row execute function public.community_posts_guard();

create or replace function public.community_comments_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.author_id := coalesce(auth.uid(), new.author_id);
  new.author_name := public.community_display_name(new.author_id);
  new.status := 'published';
  return new;
end $$;

create trigger community_comments_insert before insert on public.community_comments
  for each row execute function public.community_comments_before_insert();

-- ------------------------------------------------------------------------- RLS
alter table public.member_moderation enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_reports enable row level security;

create policy moderation_own_read on public.member_moderation
  for select to authenticated using (user_id = auth.uid());
create policy moderation_admin_all on public.member_moderation
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy posts_read on public.community_posts
  for select to authenticated
  using (public.community_access() and (status = 'published' or author_id = auth.uid()));
create policy posts_insert on public.community_posts
  for insert to authenticated
  with check (public.community_access() and author_id = auth.uid());
create policy posts_update_own on public.community_posts
  for update to authenticated
  using (author_id = auth.uid() and public.community_access())
  with check (author_id = auth.uid());
create policy posts_delete_own on public.community_posts
  for delete to authenticated using (author_id = auth.uid());
create policy posts_admin_all on public.community_posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy comments_read on public.community_comments
  for select to authenticated
  using (
    public.community_access() and status = 'published'
    and exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published')
  );
create policy comments_insert on public.community_comments
  for insert to authenticated
  with check (
    public.community_access() and author_id = auth.uid()
    and exists (
      select 1 from public.community_posts p
      where p.id = post_id and p.status = 'published' and not p.comments_closed
    )
  );
create policy comments_delete_own on public.community_comments
  for delete to authenticated using (author_id = auth.uid());
create policy comments_admin_all on public.community_comments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy reactions_read on public.community_reactions
  for select to authenticated using (public.community_access());
create policy reactions_insert_own on public.community_reactions
  for insert to authenticated with check (public.community_access() and user_id = auth.uid());
create policy reactions_delete_own on public.community_reactions
  for delete to authenticated using (user_id = auth.uid());

create policy reports_insert on public.community_reports
  for insert to authenticated with check (public.community_access() and reporter_id = auth.uid());
create policy reports_admin_all on public.community_reports
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------- fotografias
-- Bucket privado: as imagens só aparecem a membros, através de links temporários gerados no servidor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community', 'community', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy community_upload_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'community'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.community_access()
  );
create policy community_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'community' and (storage.foldername(name))[1] = auth.uid()::text);
create policy community_storage_admin on storage.objects
  for all to authenticated
  using (bucket_id = 'community' and public.is_admin())
  with check (bucket_id = 'community' and public.is_admin());
