-- Tokens individuales para ScriptSkada.
-- Ejecutar esta migracion antes de desplegar el validador que consulta la tabla.

create table if not exists public.sync_api_tokens (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  token_hash text not null unique
    check (token_hash ~ '^[0-9a-f]{64}$'),
  token_prefix text not null unique
    check (length(trim(token_prefix)) >= 8),
  officer_name text,
  scopes text[] not null default array['*']::text[]
    check (cardinality(scopes) > 0),
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

comment on table public.sync_api_tokens is
  'Tokens revocables de ScriptSkada. Solo se almacena el hash SHA-256.';
comment on column public.sync_api_tokens.token_prefix is
  'Prefijo no secreto para identificar el token sin mostrarlo completo.';
comment on column public.sync_api_tokens.scopes is
  'Permisos del token. El valor * habilita todos los endpoints.';

alter table public.sync_api_tokens enable row level security;

-- Ningun cliente anonimo o autenticado puede leer hashes ni administrar tokens.
revoke all on table public.sync_api_tokens from anon, authenticated;
grant select, insert, update, delete on table public.sync_api_tokens to service_role;

create index if not exists sync_api_tokens_active_idx
  on public.sync_api_tokens (revoked_at, expires_at);

