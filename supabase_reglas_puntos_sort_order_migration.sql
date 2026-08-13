-- ==========================================
-- MIGRACIÓN: reglas_puntos → orden manual (sort_order)
-- ==========================================
-- Hoy las filas de Beneficios/Perjuicios se muestran en el orden que
-- devuelve Postgres sin ORDER BY explícito (no garantizado, y cambia si se
-- edita una fila). Se agrega sort_order para poder reordenarlas a mano
-- desde el admin (botones subir/bajar) sin depender del orden físico de
-- la tabla. Es un orden global de toda la tabla (no reinicia por
-- categoría): alcanza porque el agrupado por categoría ya lo hace la app
-- en JS, acá solo importa el orden relativo dentro de cada grupo.
--
-- Se usa "sort_order" (no "order") porque ORDER es palabra reservada en
-- SQL y obligaría a citarla en cada query; es además el mismo nombre que
-- ya usa la tabla items para su propio orden manual (boss/sort_order).

alter table public.reglas_puntos
  add column if not exists sort_order integer;

-- Backfill: toma el orden físico actual de la tabla (el mismo que se ve
-- hoy sin ORDER BY) dejando huecos de 10 en 10, para poder insertar una
-- fila nueva entre dos existentes más adelante sin tener que renumerar
-- todo lo demás.
with numbered as (
  select id, (row_number() over (order by ctid))::int * 10 as rn
  from public.reglas_puntos
  where sort_order is null
)
update public.reglas_puntos r
set sort_order = numbered.rn
from numbered
where r.id = numbered.id;

alter table public.reglas_puntos
  alter column sort_order set default 0,
  alter column sort_order set not null;

create index if not exists idx_reglas_puntos_sort_order on public.reglas_puntos(sort_order);
