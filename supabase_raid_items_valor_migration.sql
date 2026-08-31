-- ==========================================
-- MIGRACIÓN: costo en EPGP pagado al ganar el ítem (raid_items.valor)
-- ==========================================
-- Hoy `raid_items` no guarda cuánto EPGP costó el ítem en el momento del
-- roll — solo id_item/id_raids/personaje/class. Ese dato existe en
-- `epgp_logs.valor` (negativo = costo real cobrado) pero se descartaba al
-- procesarlo en syncRaidItems.ts.
--
-- Se agrega la columna y se hace un backfill best-effort del histórico ya
-- sincronizado, cruzando por personaje + fecha de la raid + descripción del
-- log (que contiene el "(ID:<id_item>)"). Se toma el log con valor < 0 (el
-- cobro real, no un "Undo"/"Deshacer" que revierte con valor > 0).
--
-- Registros manuales (source='manual') o sin match en epgp_logs quedan en
-- NULL — el frontend simplemente no muestra el badge en esos casos.

alter table public.raid_items
  add column if not exists valor integer;

update public.raid_items ri
set valor = el.valor
from epgp_logs el, raids r
where ri.valor is null
  and ri.source = 'sync'
  and r.id = ri.id_raids
  and el.personaje = ri.personaje
  and el.fecha = to_char(r.raid_date::date, 'DD/MM/YYYY')
  and el.descripcion like '%(ID:' || ri.id_item || ')%'
  and el.valor < 0
  and el.descripcion not ilike '%Undo%'
  and el.descripcion not ilike '%Deshacer%';
