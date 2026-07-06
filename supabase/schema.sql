-- Finanzas F&P — esquema mínimo para 2 usuarios (Fer + Pao).
-- El estado del hogar se guarda como un único documento JSON (simple y suficiente
-- para una pareja; se puede normalizar a tablas por entidad más adelante).
--
-- Cómo usar: Supabase → SQL Editor → pegar todo esto → Run.

create table if not exists public.household_state (
  id text primary key default 'main',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Acceso SIN login: se entra eligiendo perfil (Fer/Pao), no hay contraseñas.
-- La base acepta el rol anónimo (anon) para leer/escribir el único documento.
-- Nota: con esto, cualquiera con el link + anon key puede ver/editar los datos;
-- es el trade-off elegido para una app privada de uso entre dos personas.
alter table public.household_state enable row level security;

drop policy if exists "household read"   on public.household_state;
drop policy if exists "household insert" on public.household_state;
drop policy if exists "household update" on public.household_state;

create policy "household read"   on public.household_state
  for select to anon, authenticated using (true);
create policy "household insert" on public.household_state
  for insert to anon, authenticated with check (true);
create policy "household update" on public.household_state
  for update to anon, authenticated using (true) with check (true);

grant select, insert, update on public.household_state to anon;

-- Sincronización en vivo (realtime) de la tabla. (Solo hace falta la 1ª vez;
-- si ya estaba agregada, este renglón da error inofensivo: ignoralo.)
alter publication supabase_realtime add table public.household_state;
