-- Fase 7: venda do eBook (compra como convidado, download seguro, meditação exclusiva).

insert into public.settings (key, value) values ('book', '{}')
on conflict (key) do nothing;

-- O eBook fica num bucket privado. Só o servidor gera links temporários, e só depois de verificar a compra.
insert into storage.buckets (id, name, public) values ('ebook', 'ebook', false)
on conflict (id) do nothing;

create policy ebook_storage_admin on storage.objects
  for all to authenticated
  using (bucket_id = 'ebook' and public.is_admin())
  with check (bucket_id = 'ebook' and public.is_admin());

-- Ficheiro atual do eBook (uma só linha). Fica fora das definições públicas.
create table public.book_files (
  id integer primary key default 1 check (id = 1),
  file_path text,
  file_name text,
  updated_at timestamptz not null default now()
);

create table public.book_orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  stripe_payment_intent text,
  email text,
  amount_cents integer not null default 0,
  currency text not null default 'eur',
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  -- O link secreto da compra. Quem o tem, acede ao eBook e à meditação.
  access_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  downloads integer not null default 0,
  download_limit integer not null default 5,
  expires_at timestamptz not null default (now() + interval '30 days'),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index book_orders_email_idx on public.book_orders (lower(email));

alter table public.book_files enable row level security;
alter table public.book_orders enable row level security;

create policy book_files_admin_all on public.book_files
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- As compras só são lidas pelo servidor (link secreto) e pelo administrador.
create policy book_orders_admin_read on public.book_orders
  for select to authenticated using (public.is_admin());

-- Conta um download e devolve o caminho do ficheiro, ou nada se o link expirou,
-- a compra foi reembolsada ou os downloads acabaram. Só o servidor a pode chamar.
create or replace function public.claim_ebook_download(p_token text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_path text;
  v_id uuid;
begin
  select file_path into v_path from public.book_files where id = 1;
  if v_path is null then
    return null;
  end if;

  update public.book_orders
     set downloads = downloads + 1
   where access_token = p_token
     and status = 'paid'
     and expires_at > now()
     and downloads < download_limit
  returning id into v_id;

  if v_id is null then
    return null;
  end if;
  return v_path;
end $$;

revoke all on function public.claim_ebook_download(text) from public, anon, authenticated;
grant execute on function public.claim_ebook_download(text) to service_role;
