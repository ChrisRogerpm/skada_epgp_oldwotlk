-- ==========================================
-- MIGRACIÓN PARA EL HISTORIAL EPGP
-- ==========================================

-- 1. Tabla principal de transacciones EPGP
create table if not exists public.epgp_transactions (
  id uuid default gen_random_uuid() primary key,
  character_name text not null, -- Nombre del PJ (ej. "Arthas")
  class text, -- Clase del PJ (opcional, para visualización rápida)
  ep_change integer default 0, -- Cambio en EP (ej. +50 por raid, -100 por falta)
  gp_change integer default 0, -- Cambio en GP (ej. +200 por lootear ítem)
  reason text not null, -- Motivo (ej. "ICC 25 - Lord Marrowgar", "Loot: [Anillo de zafiro]")
  raid_date date default current_date, -- Fecha del evento
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id), -- Oficial que realizó el registro
  
  -- Metadatos adicionales para facilitar filtros
  type text check (type in ('raid', 'loot', 'penalty', 'bonus', 'decay')) default 'raid'
);

-- 2. Índices para búsquedas rápidas (por personaje y fecha)
create index if not exists idx_epgp_char on epgp_transactions(character_name);
create index if not exists idx_epgp_date on epgp_transactions(raid_date);

-- 3. Configuración de Seguridad (RLS)
alter table public.epgp_transactions enable row level security;

-- Política: Cualquiera puede ver el historial (transparencia total)
create policy "EPGP history is public."
  on epgp_transactions for select
  using ( true );

-- Política: Solo administradores pueden insertar registros
-- (Requiere que la tabla 'profiles' esté configurada con roles)
create policy "Only admins can insert transactions."
  on epgp_transactions for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 4. Vista de Resumen (Opcional)
-- Permite ver el balance total calculado (EP / GP = PR) directamente desde SQL
create or replace view public.epgp_standings as
select 
  character_name,
  max(class) as class,
  sum(ep_change) as total_ep,
  sum(gp_change) as total_gp,
  case 
    when sum(gp_change) = 0 then sum(ep_change)::float
    else (sum(ep_change)::float / sum(gp_change)::float) 
  end as priority_ratio
from epgp_transactions
group by character_name;
