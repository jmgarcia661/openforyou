-- Fase 5: aulas em direto, calendário e sala de espera.

create type public.live_status as enum ('scheduled', 'waiting', 'live', 'ended', 'cancelled');

create table public.live_events (
  id uuid primary key default gen_random_uuid(),
  series_id uuid,
  title text not null,
  description text,
  event_type text not null default 'yoga_active'
    check (event_type in ('yoga_active', 'yoga_gentle', 'yoga_restorative', 'meditation', 'community', 'workshop', 'retreat', 'nature')),
  level text,
  teacher text,
  materials text,
  starts_at timestamptz not null,
  duration_min integer not null default 60 check (duration_min > 0),
  timezone text not null default 'Europe/Lisbon',
  status public.live_status not null default 'scheduled',
  waiting_opens_min integer not null default 15 check (waiting_opens_min between 0 and 120),
  waiting_message text,
  delay_message text,
  late_message text,
  entries_open boolean not null default true,
  has_recording boolean not null default true,
  recording_content_id uuid references public.content_items (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index live_events_starts_idx on public.live_events (starts_at);
create trigger live_events_updated before update on public.live_events
  for each row execute function public.set_updated_at();

-- Ligações do Zoom ficam à parte. Só administradores as leem diretamente.
-- Os membros recebem o link do participante por um endereço do servidor,
-- depois de verificada a subscrição e só quando a aula está em direto.
create table public.live_secrets (
  event_id uuid primary key references public.live_events (id) on delete cascade,
  join_url text,
  host_url text,
  meeting_id text,
  passcode text,
  updated_at timestamptz not null default now()
);
create trigger live_secrets_updated before update on public.live_secrets
  for each row execute function public.set_updated_at();

create table public.live_access_log (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.live_events (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('waiting', 'join')),
  created_at timestamptz not null default now()
);
create index live_access_log_event_idx on public.live_access_log (event_id, action);

create table public.event_rsvps (
  event_id uuid not null references public.live_events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.live_events enable row level security;
alter table public.live_secrets enable row level security;
alter table public.live_access_log enable row level security;
alter table public.event_rsvps enable row level security;

-- Calendário: só membros ativos e administradores
create policy live_events_members_read on public.live_events
  for select to authenticated
  using (public.is_admin() or public.has_active_subscription());
create policy live_events_admin_all on public.live_events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Ligações do Zoom: apenas administradores
create policy live_secrets_admin_all on public.live_secrets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Registo de acessos
create policy live_log_admin_read on public.live_access_log
  for select to authenticated using (public.is_admin());
create policy live_log_insert_own on public.live_access_log
  for insert to authenticated
  with check (user_id = auth.uid() and (public.is_admin() or public.has_active_subscription()));

-- Presenças confirmadas
create policy rsvps_own on public.event_rsvps
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy rsvps_admin_read on public.event_rsvps
  for select to authenticated using (public.is_admin());

-- Atualizações em tempo real para a sala de espera
alter publication supabase_realtime add table public.live_events;
