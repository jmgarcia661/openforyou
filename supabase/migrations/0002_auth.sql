-- Fase 2: registo, consentimentos e perfil.

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists marketing_opt_in boolean not null default false;

alter table public.profiles
  add constraint profiles_full_name_len check (full_name is null or char_length(full_name) <= 80);

-- O consentimento dado no registo fica guardado com data.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, terms_accepted_at)
  values (
    new.id,
    left(new.raw_user_meta_data ->> 'full_name', 80),
    case when new.raw_user_meta_data ->> 'terms_accepted' = 'true' then now() end
  );
  return new;
end $$;
