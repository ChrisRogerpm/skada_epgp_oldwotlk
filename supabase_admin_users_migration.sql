-- Agrega la columna email a profiles para poder listar/buscar usuarios con una
-- sola query (paginada, igual que full_geared_characters), en vez de tener que
-- combinar auth.admin.listUsers() con profiles en cada request.
-- NOTA: este email puede desincronizarse si en el futuro se agrega una función
-- de "cambiar email" (hoy no existe en la app), es un trade-off aceptado.
alter table public.profiles add column if not exists email text;

-- Backfill de usuarios existentes
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- Actualiza el trigger para copiar el email al crear el perfil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, email)
  values (new.id, 'user', new.email);
  return new;
end;
$$;

-- El trigger on_auth_user_created ya existe y usa esta función, no requiere recrearse.
