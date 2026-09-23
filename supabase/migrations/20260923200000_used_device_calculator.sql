-- Calculadora de Seminovo: minimum margin per store and repair costs per model.

alter table public.stores
  add column min_margin numeric not null default 0.20
  check (min_margin >= 0 and min_margin < 1);

create table public.repair_costs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  model text not null,
  screen_cost numeric check (screen_cost >= 0),
  battery_cost numeric check (battery_cost >= 0),
  camera_cost numeric check (camera_cost >= 0),
  updated_at timestamptz not null default now(),
  unique (store_id, model)
);

create index repair_costs_store_id_idx on public.repair_costs(store_id);

alter table public.repair_costs enable row level security;

-- Same access model as price_reference: readable by members, writable by owner/admin.
create policy "repair_costs_select" on public.repair_costs
  for select using (public.is_store_member(store_id));
create policy "repair_costs_insert" on public.repair_costs
  for insert with check (public.has_store_role(store_id, array['owner','admin']));
create policy "repair_costs_update" on public.repair_costs
  for update using (public.has_store_role(store_id, array['owner','admin']));
create policy "repair_costs_delete" on public.repair_costs
  for delete using (public.has_store_role(store_id, array['owner','admin']));
