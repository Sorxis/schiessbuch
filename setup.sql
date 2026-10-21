-- Datenbank-Schema (bereits im Supabase-Projekt angelegt). Jeder angemeldete Nutzer sieht und ändert nur seine eigenen Ergebnisse.
create table if not exists public.ergebnisse (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.ergebnisse enable row level security;

create policy "eigene Ergebnisse lesen"   on public.ergebnisse for select to authenticated using (user_id = (select auth.uid()));
create policy "eigene Ergebnisse anlegen" on public.ergebnisse for insert to authenticated with check (user_id = (select auth.uid()));
create policy "eigene Ergebnisse ändern"  on public.ergebnisse for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "eigene Ergebnisse löschen" on public.ergebnisse for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.ergebnisse from anon;
grant select, insert, update, delete on public.ergebnisse to authenticated;
