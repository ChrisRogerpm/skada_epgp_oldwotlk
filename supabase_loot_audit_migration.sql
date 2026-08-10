-- ==========================================
-- MIGRACIÓN PARA EL MÓDULO DE LOOT (MATRIZ DE BOTÍN)
-- ==========================================
-- raid_items ya existe (alimentada por el sync automático de logs EPGP).
-- Esta migración agrega columnas de auditoría para poder distinguir los
-- registros creados por el sync de los registrados manualmente desde el
-- panel admin, y protege la escritura con RLS (el registro manual igual
-- se hace vía service role desde /api/loot, pero esto evita escrituras
-- directas desde el cliente con la anon key).

alter table public.raid_items
  add column if not exists source text not null default 'sync' check (source in ('sync', 'manual')),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists created_at timestamptz not null default timezone('utc'::text, now());

create index if not exists idx_raid_items_personaje on public.raid_items(personaje);
create index if not exists idx_raid_items_id_item on public.raid_items(id_item);

alter table public.raid_items enable row level security;

-- Lectura pública (la matriz de loot es visible para todos, igual que el resto del portal)
drop policy if exists "raid_items is public read" on public.raid_items;
create policy "raid_items is public read"
  on public.raid_items for select
  using (true);

-- Escritura solo para administradores (profiles.role = 'admin')
drop policy if exists "only admins can insert raid_items" on public.raid_items;
create policy "only admins can insert raid_items"
  on public.raid_items for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "only admins can update raid_items" on public.raid_items;
create policy "only admins can update raid_items"
  on public.raid_items for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "only admins can delete raid_items" on public.raid_items;
create policy "only admins can delete raid_items"
  on public.raid_items for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
