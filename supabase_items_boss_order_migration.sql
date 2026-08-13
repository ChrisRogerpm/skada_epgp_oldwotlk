-- ==========================================
-- MIGRACIÓN: orden por boss/dificultad en `items`
-- ==========================================
-- Necesario para poder generar el dropdown de motivos del addon EPGP
-- (ep_reasons.lua) ordenado por raid y progresión de bosses, en vez de a
-- mano. `boss` y `sort_order` son nullable: no rompe nada existente, y
-- raids que todavía no se completen (ej. ICC) simplemente quedan sin
-- ordenar hasta que se carguen.

alter table public.items
  add column if not exists boss text,
  add column if not exists sort_order integer;

-- ------------------------------------------------------------------
-- Ruby Sanctum (raid de un solo boss: Halion) — orden alfabético.
-- ------------------------------------------------------------------
update public.items set boss = 'Halion', sort_order = 1  where id_item = 54585; -- Anillo de regeneración por fase
update public.items set boss = 'Halion', sort_order = 2  where id_item = 54578; -- Avanzado del Apocalipsis
update public.items set boss = 'Halion', sort_order = 3  where id_item = 54580; -- Bandas agraviadas
update public.items set boss = 'Halion', sort_order = 4  where id_item = 54579; -- Botines de resurrección inminente
update public.items set boss = 'Halion', sort_order = 5  where id_item = 54584; -- Brazales de cambio de fase
update public.items set boss = 'Halion', sort_order = 6  where id_item = 54582; -- Brazales de noche ígnea
update public.items set boss = 'Halion', sort_order = 7  where id_item = 54583; -- Capa de ocaso ardiente
update public.items set boss = 'Halion', sort_order = 8  where id_item = 54587; -- Cinturón de forma partida
update public.items set boss = 'Halion', sort_order = 9  where id_item = 54581; -- Colgante de lobreguez
update public.items set boss = 'Halion', sort_order = 10 where id_item = 54590; -- Escama Crepuscular afilada
update public.items set boss = 'Halion', sort_order = 11 where id_item = 54588; -- Escama Crepuscular carbonizada
update public.items set boss = 'Halion', sort_order = 12 where id_item = 54591; -- Escama Crepuscular petrificada
update public.items set boss = 'Halion', sort_order = 13 where id_item = 54589; -- Escama Crepuscular resplandeciente
update public.items set boss = 'Halion', sort_order = 14 where id_item = 54586; -- Pasos de vaticinio
update public.items set boss = 'Halion', sort_order = 15 where id_item = 54577; -- Pisadas de regreso
update public.items set boss = 'Halion', sort_order = 16 where id_item = 54576; -- Sello de crepúsculo

-- ------------------------------------------------------------------
-- Trial of the Grand Crusader — orden real de progresión de bosses,
-- verificado en Wowhead/WotLK DB (Beasts of Northrend no dejó ítems en
-- esta lista curada, por eso el orden salta de 1 a Jaraxxus):
--   1) Lord Jaraxxus
--   2) Campeones de Facción (Faction Champions)
--   3) Gemelas Val'kyr / Anub'arak (encuentro final)
-- ------------------------------------------------------------------
update public.items set boss = 'Lord Jaraxxus', sort_order = 1 where id_item = 47432; -- Consuelo de los caídos
update public.items set boss = 'Lord Jaraxxus', sort_order = 2 where id_item = 47059; -- Consuelo de los derrotados

update public.items set boss = 'Campeones de Facción', sort_order = 3 where id_item = 47088; -- Escarabajo trabador de Satrina
update public.items set boss = 'Campeones de Facción', sort_order = 4 where id_item = 47451; -- Vitalidad del gigante
update public.items set boss = 'Campeones de Facción', sort_order = 5 where id_item = 47546; -- Astucia de Sylvanas
update public.items set boss = 'Campeones de Facción', sort_order = 6 where id_item = 47545; -- Maña de Vereesa

update public.items set boss = 'Anub''arak', sort_order = 7  where id_item = 47464; -- Elección de la Muerte
update public.items set boss = 'Anub''arak', sort_order = 8  where id_item = 47131; -- Veredicto de la Muerte
update public.items set boss = 'Anub''arak', sort_order = 9  where id_item = 47477; -- Reino de los muertos
update public.items set boss = 'Anub''arak', sort_order = 10 where id_item = 47188; -- Reino de los sin vida
