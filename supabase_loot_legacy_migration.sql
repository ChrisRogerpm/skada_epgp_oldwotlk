-- ==========================================
-- MIGRACIÓN: ítems de loot legacy (sin sesión de raid rastreada)
-- ==========================================
-- Antes de que existiera el sync de raids/composición, ya se entregaban ítems.
-- Esos registros no tienen (ni tendrán) una fila real en `raids` a la cual
-- enlazarse. Se relaja `id_raids` para permitir NULL en esos casos; la FK a
-- `raids.id` sigue vigente y se sigue exigiendo para todo lo demás (sync
-- automático, composición de raids) porque esas rutas siempre proveen un
-- id_raids real. Se agrega `note` para dejar contexto libre cuando no hay
-- boss/fecha (ej. "loot histórico, previo al sistema de tracking").

alter table public.raid_items
  alter column id_raids drop not null;

alter table public.raid_items
  add column if not exists note text;
