-- ==========================================
-- REGISTRO DE ACTIVIDAD DEL PANEL DE ADMINISTRACIÓN
-- ==========================================
-- Una fila por acción de un oficial (botín, reglas, Full Gear, usuarios,
-- tokens) o del sync automático. Solo se escribe y se lee desde el servidor
-- con service role: RLS activado y sin políticas para anon/authenticated.

create table if not exists public.admin_activity (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_id uuid references auth.users(id) on delete set null,
  -- Email del oficial, o 'Sync' para las acciones automáticas.
  actor text not null,
  -- Tipo de acción: 'loot.create', 'loot.update', 'loot.delete', 'loot.cleanup',
  -- 'rule.loteo.create', 'rule.loteo.update', 'rule.loteo.delete',
  -- 'rule.puntos.create', 'rule.puntos.update', 'rule.puntos.delete',
  -- 'fullgear.create', 'fullgear.update', 'fullgear.delete',
  -- 'user.create', 'user.role', 'token.create', 'token.revoke', 'sync.raid-items'.
  action text not null,
  summary text not null,
  details jsonb
);

create index if not exists idx_admin_activity_created_at on public.admin_activity (created_at desc);
create index if not exists idx_admin_activity_action on public.admin_activity (action);

alter table public.admin_activity enable row level security;
