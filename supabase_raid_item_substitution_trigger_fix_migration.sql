-- ==========================================
-- MIGRACIÓN: handle_raid_item_substitution() asumía un solo ganador
-- ==========================================
-- Esta función asumía el constraint viejo UNIQUE(id_item, id_raids) — "un
-- solo ganador por ítem por raid". Con supabase_raid_items_unique_personaje_migration.sql
-- el constraint pasó a (id_item, id_raids, personaje), permitiendo que un
-- mismo id_item tenga varios ganadores legítimos en la misma raid (ej.
-- "Icecrown Citadel - Marca de santificación (ID:52029)", que suele caer
-- 3 a 5 veces por raid a personajes distintos).
--
-- El SELECT INTO / DELETE originales no filtraban por personaje: al insertar
-- un nuevo ganador para un id_item que ya tiene varias filas, el SELECT INTO
-- agarraba una fila "cualquiera" de esas filas (orden no determinístico) y,
-- si esa fila resultaba tener un Undo/Deshacer en epgp_logs, el DELETE
-- borraba TODAS las filas de ese id_item+id_raids — incluyendo los demás
-- ganadores legítimos, no solo al que correspondía anular.
--
-- El fix: borrar únicamente las filas cuyo propio personaje tenga un Undo
-- registrado para ese ítem+raid, sin importar cuántos otros ganadores
-- coexistan para el mismo id_item+id_raids.

CREATE OR REPLACE FUNCTION public.handle_raid_item_substitution()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
        v_raid_date_formatted TEXT;
    BEGIN
        -- 1. Obtener la fecha de la raid para buscar en los logs de EPGP
        SELECT to_char(raid_date::date, 'DD/MM/YYYY') INTO v_raid_date_formatted
        FROM raids WHERE id = NEW.id_raids;

        -- 2. CASO A: El personaje que estamos intentando insertar TIENE un Undo.
        -- Lo bloqueamos de inmediato para que ni siquiera intente entrar.
        IF EXISTS (
            SELECT 1 FROM epgp_logs
            WHERE personaje = NEW.personaje
            AND fecha = v_raid_date_formatted
            AND descripcion LIKE '%(ID:' || NEW.id_item || ')%'
            AND (descripcion ILIKE '%Undo%' OR descripcion ILIKE '%Deshacer%' OR valor > 0)
        ) THEN
            RETURN NULL; -- Cancela la inserción de este personaje erróneo
        END IF;

        -- 3. CASO B: borrar SOLO las filas existentes de este id_item+id_raids
        -- cuyo propio personaje tenga un Undo — sin tocar a los demás
        -- ganadores legítimos del mismo ítem en la misma raid (ej. varias
        -- Marcas de santificación cayendo a personajes distintos).
        DELETE FROM raid_items ri
        WHERE ri.id_item = NEW.id_item
          AND ri.id_raids = NEW.id_raids
          AND ri.personaje <> NEW.personaje
          AND EXISTS (
              SELECT 1 FROM epgp_logs el
              WHERE el.personaje = ri.personaje
                AND el.fecha = v_raid_date_formatted
                AND el.descripcion LIKE '%(ID:' || NEW.id_item || ')%'
                AND (el.descripcion ILIKE '%Undo%' OR el.descripcion ILIKE '%Deshacer%' OR el.valor > 0)
          );

        RETURN NEW; -- Permite la inserción del nuevo ganador
    END;
    $function$
;
