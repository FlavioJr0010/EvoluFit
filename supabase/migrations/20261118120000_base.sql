-- =====================================================================
-- EvoluFit — base: tipos, funções utilitárias e perfis
-- =====================================================================

-- Unidades de quantidade. 'porcao' só é válida para receitas em refeições.
create type public.quantity_unit as enum ('g', 'ml', 'unidade', 'porcao');

create type public.meal_type as enum (
  'cafe_da_manha',
  'almoco',
  'lanche',
  'jantar',
  'personalizada'
);

create type public.muscle_group as enum (
  'peito',
  'costas',
  'ombros',
  'biceps',
  'triceps',
  'antebracos',
  'abdomen',
  'quadriceps',
  'posteriores',
  'gluteos',
  'panturrilhas',
  'adutores',
  'abdutores',
  'corpo_inteiro'
);

-- Atualiza updated_at em qualquer UPDATE.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Valida um nome de fuso horário IANA (ex.: America/Bahia).
create function public.is_valid_timezone(tz text)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
begin
  perform now() at time zone tz;
  return true;
exception when others then
  return false;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles: dados complementares do usuário (1:1 com auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(btrim(display_name)) between 1 and 80),
  timezone text not null default 'America/Bahia' check (public.is_valid_timezone(timezone)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Dados complementares do usuário autenticado.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria o perfil automaticamente para cada novo usuário.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usuários criados antes desta migration.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;

create policy "profiles: ler o próprio"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: atualizar o próprio"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Somente nome e fuso são editáveis pelo usuário.
revoke all on public.profiles from anon, authenticated;
grant select, update (display_name, timezone) on public.profiles to authenticated;
