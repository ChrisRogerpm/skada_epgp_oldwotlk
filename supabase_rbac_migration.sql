-- Crea la tabla de perfiles ligada a la autenticación de Supabase
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  role text not null default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  primary key (id)
);

-- Asegura el acceso seguro mediante RLS (Row Level Security)
alter table public.profiles enable row level security;

-- Solo el propio usuario o un admin puede ver su perfil
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Trigger para crear automáticamente el perfil cuando un usuario se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- IMPORTANTE: Para darte acceso de admin a ti mismo, 
-- corre el siguiente comando (después de haberte registrado):
-- update public.profiles set role = 'admin' where id = 'TU_USER_ID_AQUI';
