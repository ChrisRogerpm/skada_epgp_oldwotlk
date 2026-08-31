-- ==========================================
-- MIGRACIÓN: excepción de unicidad para "Marca de santificación" (ID:52029)
-- ==========================================
-- Regla general (se mantiene igual que hoy): un solo ganador por id_item
-- por raid — UNIQUE(id_item, id_raids).
--
-- Excepción: "Icecrown Citadel - Marca de santificación (ID:52029)" puede
-- caer varias veces en una misma raid de ICC (normalmente 3 a 5), a
-- personajes distintos. El constraint original
-- (raid_items_id_item_id_raids_key) no distingue por ítem y rechaza esos
-- casos con "duplicate key value violates unique constraint" apenas un
-- segundo personaje gana el 52029 en la misma raid.
--
-- Se reemplaza el constraint único por dos índices únicos parciales:
-- uno que aplica la regla general a todos los ítems salvo el 52029, y otro
-- que aplica una regla más laxa (incluye personaje) solo para el 52029.

alter table public.raid_items
  drop constraint if exists raid_items_id_item_id_raids_key;

-- Regla general: un solo ganador por ítem por raid (todo excepto 52029)
create unique index if not exists raid_items_unique_general
  on public.raid_items (id_item, id_raids)
  where id_item <> 52029;

-- Excepción: Marca de santificación (ID:52029) permite varios ganadores
-- distintos en la misma raid; solo evita duplicar exactamente la misma
-- fila (mismo personaje+ítem+raid dos veces).
create unique index if not exists raid_items_unique_marca_santificacion
  on public.raid_items (id_item, id_raids, personaje)
  where id_item = 52029;
