-- ==========================================
-- MIGRACIÓN: reglas_loteo / reglas_puntos → guardado por fila
-- ==========================================
-- Hasta ahora el admin guardaba todo con un DELETE total + INSERT total desde
-- el estado local del navegador (sin transacción). Se pasa a alta/edición/baja
-- por fila vía API (mismo patrón que ya usa el módulo de Loot), y se agrega un
-- vínculo opcional al catálogo real de ítems para que el selector con buscador
-- pueda auto-completar ícono y nombre en vez de tipearlos a mano.

alter table public.reglas_loteo
  add column if not exists id_item integer references public.items(id_item);

create index if not exists idx_reglas_loteo_raid on public.reglas_loteo(raid);
create index if not exists idx_reglas_puntos_tipo on public.reglas_puntos(tipo);

-- RLS: lectura pública (reglas es información abierta a toda la hermandad),
-- escritura solo para administradores. Las escrituras del admin igual pasan
-- por la service role vía /api/reglas/*, esto es defensa en profundidad.
alter table public.reglas_loteo enable row level security;
alter table public.reglas_puntos enable row level security;

drop policy if exists "reglas_loteo is public read" on public.reglas_loteo;
create policy "reglas_loteo is public read"
  on public.reglas_loteo for select
  using (true);

drop policy if exists "only admins can write reglas_loteo" on public.reglas_loteo;
create policy "only admins can write reglas_loteo"
  on public.reglas_loteo for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "reglas_puntos is public read" on public.reglas_puntos;
create policy "reglas_puntos is public read"
  on public.reglas_puntos for select
  using (true);

drop policy if exists "only admins can write reglas_puntos" on public.reglas_puntos;
create policy "only admins can write reglas_puntos"
  on public.reglas_puntos for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
