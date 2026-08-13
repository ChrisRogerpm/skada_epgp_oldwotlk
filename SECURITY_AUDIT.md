# Auditoría de Seguridad — 2026-08-12

Diagnóstico de AppSec sobre el sistema completo (no solo el diff pendiente). Cada hallazgo crítico/alto se confirmó con una prueba de concepto real y reversible contra Supabase de producción (usuarios/filas descartables creados y borrados dentro del mismo script, con verificación final de que no quedó ningún residuo). Nada de esto se explotó de forma dañina — todas las pruebas fueron de solo-verificación con limpieza inmediata.

**Estado general: nada de esto está corregido todavía.** Este archivo es el punto de partida para la próxima sesión.

---

## Checklist de remediación

- [ ] #1 `profiles`: bloquear auto-escalación de rol (SQL, correr ya)
- [ ] #2a Código: migrar escrituras de sync (skada/epgproster/raidcomposition/listanegra/epgp) de cliente anon a `getSupabaseAdmin()`
- [ ] #2b SQL: activar RLS + policy de solo-lectura pública en las 8 tablas abiertas (**correr recién después de #2a**, si no se rompe el sync)
- [ ] #3 Renombrar `NEXT_PUBLIC_SYNC_API_KEY` → `SYNC_API_KEY` (sin prefijo) y rotar el valor
- [ ] #4 `npm audit fix --force` / actualizar Next.js a 16.3.0+, correr build + smoke test
- [ ] #5 Decidir y alinear el gate de la sección "Usuarios" (¿solo un email, o cualquier admin?) entre UI y `requireAdmin`

---

## 🔴 CRÍTICO #1 — Cualquier usuario puede auto-promoverse a administrador

**PoC realizada:** cuenta de prueba descartable (rol `user` por defecto) → login con la ANON key pública → con esa sesión, `PATCH /rest/v1/profiles` seteando el propio `role` a `admin`. **Funcionó (200 OK)**, confirmado luego con la service role key. Cuenta de prueba borrada al final, verificado que no quedó rastro.

**Agravante confirmado:** el registro público de cuentas está **habilitado** en el proyecto de Supabase Auth (`POST /auth/v1/signup` con solo la anon key creó una cuenta nueva sin ninguna credencial previa). No hace falta ser miembro de la hermandad: cualquiera en internet, en 2 requests HTTP, se convierte en admin.

**Causa:** la política RLS de `profiles` (`supabase_rbac_migration.sql`):
```sql
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );
```
Solo valida *de quién* es la fila, no *qué columnas* se pueden tocar. `requireAdmin` y todas las policies "solo admin" del resto del sistema confían ciegamente en `profiles.role = 'admin'`, así que esto es jaque mate total al panel admin completo.

**Solución (elegir una):**

Opción A — recomendada, no hay hoy ningún flujo legítimo de auto-edición de perfil:
```sql
drop policy "Users can update own profile." on public.profiles;
```

Opción B — si más adelante se quiere permitir auto-editar otros campos (ej. email):
```sql
create or replace function public.prevent_role_self_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    raise exception 'No tienes permiso para cambiar tu rol';
  end if;
  return new;
end; $$;

create trigger trg_prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();
```
(el panel admin sigue funcionando: usa la service role key, que este trigger deja pasar explícitamente)

---

## 🔴 CRÍTICO #2 — 8 tablas sin RLS: lectura, modificación y borrado sin loguearse

**PoC realizada:** fila descartable insertada con la service role key en cada tabla, luego UPDATE/DELETE de esa fila usando **solo la ANON key pública, sin ningún token de sesión**. Limpieza y verificación final sin residuos.

| Tabla | UPDATE anónimo | DELETE anónimo | Qué se pierde si lo explotan |
|---|---|---|---|
| `raids` | permitido | permitido | Historial de raids (fecha/jefe) |
| `raid_participants` | permitido | permitido | Asistencia de raids |
| `items` | permitido | permitido | Catálogo de ítems (rompe Loot y Reglas) |
| `epgp` | permitido | permitido | Puntos EPGP de todo el roster |
| `skada` | permitido | permitido | Parses de DPS/HPS |
| `epgp_logs` | permitido | permitido | Historial de puntos ganados/perdidos |
| `lista_negra` | permitido | permitido | Lista de baneados (+ riesgo de difamación si insertan nombres falsos) |
| `downloads` | permitido | permitido | Pueden reemplazar el link del addon/cliente por malware |

Control: mismo test contra `reglas_loteo`, `reglas_puntos`, `raid_items` → ahí sí bloqueado (200, 0 filas afectadas). Esas 3 sí tienen RLS activo y funcionando bien.

**Causa raíz:** ninguna de las 8 tablas tiene `ENABLE ROW LEVEL SECURITY`. Además, las rutas de sync (`skada/sync`, `epgproster/sync`, `raidcomposition/sync`, `listanegra/sync`, `epgp/sync`) escriben con el cliente **anon** (`supabase`), no con `getSupabaseAdmin()` — a diferencia de `SupabaseReglasRepository`/`SupabaseLootRepository`, que sí usan el cliente admin para escribir. Por eso activar RLS a secas rompería el sync.

**Solución — en este orden:**

1. **Código:** en las 5 rutas de sync, cambiar `supabase.from(...)` por `getSupabaseAdmin().from(...)` para los `insert`/`update`/`delete` (las lecturas quedan igual). La ruta ya valida la API key con `validateSyncRequest` antes de escribir, así que delegarle el resto a la service role es seguro y consistente con el resto del código.
2. **SQL** (correr recién después de que el punto 1 esté deployado):
```sql
-- Repetir para: raids, raid_participants, items, epgp, skada, epgp_logs, lista_negra, downloads
alter table public.<tabla> enable row level security;

create policy "<tabla> is public read"
  on public.<tabla> for select
  using (true);

-- Sin policy de INSERT/UPDATE/DELETE para anon/authenticated: con RLS activo y
-- ninguna policy que lo permita, esas operaciones quedan bloqueadas por defecto.
-- Solo las rutas server-side con la service role key siguen pudiendo escribir.
```

⚠️ Si el SQL se corre antes que el cambio de código, el sync se rompe (no podría insertar).

---

## 🟠 ALTO #3 — Secret de sync nombrado como si fuera público

`NEXT_PUBLIC_SYNC_API_KEY` protege 5 endpoints de escritura, pero el prefijo `NEXT_PUBLIC_` le dice a Next.js "esto es seguro de mandar al navegador". Hoy no se filtra porque solo se referencia desde código server-only (`src/infrastructure/utils/auth.ts`, importado solo por route handlers) — pero es una trampa para el futuro: alcanza con que alguien importe ese archivo desde un componente cliente, o copie la variable a un componente para debug, para que quede expuesta en el bundle del navegador.

**Solución:**
```
# .env
SYNC_API_KEY=el_mismo_valor_actual   # sin el prefijo NEXT_PUBLIC_
```
y en `src/infrastructure/utils/auth.ts`: `process.env.NEXT_PUBLIC_SYNC_API_KEY` → `process.env.SYNC_API_KEY`. Recomendable rotar el valor al hacer el cambio (pudo haber quedado en algún build/deploy previo).

---

## 🟠 ALTO #4 — Next.js desactualizado con CVEs conocidas

`npm audit` reporta 3 vulnerabilidades altas en dependencias de producción (Next.js 16.1.6, y transitivamente `postcss`/`sharp`), incluyendo SSRF en Server Actions/rewrites, DoS, y cache poisoning de respuestas. Next.js 16.3.0 ya las corrige.

**Solución:** `npm audit fix --force` (o actualizar `next` manualmente a 16.3.0+) y correr `next build` + smoke test antes de deployar.

---

## 🟡 MEDIO #5 — El panel de "Usuarios" se oculta por UI, no se bloquea por permiso real

En `app/admin/page.tsx`, la pestaña "Usuarios" solo se muestra si `user.email === "christianrogerpm@gmail.com"`, con un comentario que dice que el resto de admins "ni pueden entrar". Pero `requireAdmin` (usado por `/api/admin/users`) solo chequea `role === 'admin'`, no ese email específico. Si en algún momento hay más de una cuenta admin, cualquiera de ellas puede llamar la API directamente (sin pasar por la UI) y crear/promover usuarios.

**Solución:** si la intención es "solo yo administro usuarios", agregar ese chequeo también en servidor (en `requireAdmin` o en la propia ruta `/api/admin/users`):
```ts
if (userData.user.email !== "christianrogerpm@gmail.com") throw new RequireAdminError('FORBIDDEN');
```
o, si se prefiere que cualquier admin pueda gestionar usuarios, actualizar el comentario para que no prometa una restricción que no existe.

---

## Notas de metodología (para no repetir el análisis desde cero)

- El "no-match trick" (UPDATE/DELETE contra un id que no existe) **no sirve** para probar permisos de escritura: Postgres/PostgREST devuelve `200 []` tanto si RLS bloquea como si simplemente no hay filas que matcheen el filtro. La forma correcta es insertar una fila real descartable (con service role) y probar contra su id real.
- El campo distintivo para confirmar "se permitió la escritura" es que la respuesta trae la fila afectada (`body.length > 0`); `200 []` significa 0 filas tocadas (bloqueado).
- Tablas confirmadas protegidas hoy: `reglas_loteo`, `reglas_puntos`, `raid_items`.
- Tablas confirmadas abiertas hoy: `raids`, `raid_participants`, `items`, `epgp`, `skada`, `epgp_logs`, `lista_negra`, `downloads`.
- `profiles` en particular: escalación confirmada vía `auth.uid() = id` sin restricción de columna en la policy de UPDATE.
