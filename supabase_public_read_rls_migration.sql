-- IMPORTANTE: desplegar primero las rutas de sync que usan getSupabaseAdmin().
-- Si se activa RLS mientras una version antigua aun escribe con anon, el sync
-- no podra insertar, actualizar ni borrar.

alter table public.raids enable row level security;
alter table public.raid_participants enable row level security;
alter table public.items enable row level security;
alter table public.epgp enable row level security;
alter table public.skada enable row level security;
alter table public.epgp_logs enable row level security;
alter table public.lista_negra enable row level security;
alter table public.downloads enable row level security;

revoke insert, update, delete, truncate, references, trigger
  on table
    public.raids,
    public.raid_participants,
    public.items,
    public.epgp,
    public.skada,
    public.epgp_logs,
    public.lista_negra,
    public.downloads
  from anon, authenticated;

grant select
  on table
    public.raids,
    public.raid_participants,
    public.items,
    public.epgp,
    public.skada,
    public.epgp_logs,
    public.lista_negra,
    public.downloads
  to anon, authenticated;

drop policy if exists "raids is public read" on public.raids;
create policy "raids is public read"
  on public.raids for select to anon, authenticated using (true);

drop policy if exists "raid_participants is public read" on public.raid_participants;
create policy "raid_participants is public read"
  on public.raid_participants for select to anon, authenticated using (true);

drop policy if exists "items is public read" on public.items;
create policy "items is public read"
  on public.items for select to anon, authenticated using (true);

drop policy if exists "epgp is public read" on public.epgp;
create policy "epgp is public read"
  on public.epgp for select to anon, authenticated using (true);

drop policy if exists "skada is public read" on public.skada;
create policy "skada is public read"
  on public.skada for select to anon, authenticated using (true);

drop policy if exists "epgp_logs is public read" on public.epgp_logs;
create policy "epgp_logs is public read"
  on public.epgp_logs for select to anon, authenticated using (true);

drop policy if exists "lista_negra is public read" on public.lista_negra;
create policy "lista_negra is public read"
  on public.lista_negra for select to anon, authenticated using (true);

drop policy if exists "downloads is public read" on public.downloads;
create policy "downloads is public read"
  on public.downloads for select to anon, authenticated using (true);

