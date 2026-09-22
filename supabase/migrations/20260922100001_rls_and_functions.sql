-- useFindash RLS policies + helper functions/triggers
-- Per docs/superpowers/specs/2026-09-22-usefindash-saas-design.md section 3.

-- Helper functions (security definer so they can read store_users without
-- triggering RLS recursion on store_users itself).

create or replace function public.is_store_member(target_store_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.store_users
    where store_id = target_store_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.has_store_role(target_store_id uuid, roles text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.store_users
    where store_id = target_store_id
      and user_id = auth.uid()
      and role = any(roles)
  );
$$;

-- Onboarding: creates a store and its first store_users row (owner) in one
-- atomic, security-definer call. Client-side RLS on stores/store_users has no
-- insert policy on purpose — onboarding must go through this function.
create or replace function public.create_store_with_owner(
  store_name text,
  owner_name text,
  monthly_goal numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_store_id uuid;
begin
  insert into public.stores (name, monthly_revenue_goal)
  values (store_name, monthly_goal)
  returning id into new_store_id;

  insert into public.store_users (store_id, user_id, role, name)
  values (new_store_id, auth.uid(), 'owner', owner_name);

  return new_store_id;
end;
$$;

-- Keep customers.ltv in sync with sales (sum of sale_price).
create or replace function public.update_customer_ltv()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.customers
  set ltv = coalesce((
    select sum(sale_price) from public.sales
    where customer_id = coalesce(new.customer_id, old.customer_id)
  ), 0)
  where id = coalesce(new.customer_id, old.customer_id);
  return coalesce(new, old);
end;
$$;

create trigger sales_update_customer_ltv
after insert or update or delete on public.sales
for each row execute function public.update_customer_ltv();

-- Mark the sold product as no longer available.
create or replace function public.mark_product_sold()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.product_id is not null then
    update public.products set status = 'sold' where id = new.product_id;
  end if;
  return new;
end;
$$;

create trigger sales_mark_product_sold
after insert on public.sales
for each row execute function public.mark_product_sold();

-- RLS

alter table public.stores enable row level security;
alter table public.store_users enable row level security;
alter table public.products enable row level security;
alter table public.accessories enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_accessories enable row level security;
alter table public.price_reference enable row level security;
alter table public.monthly_inputs enable row level security;
alter table public.cost_entries enable row level security;

-- stores: readable by members, updatable by owner/admin. No client-side
-- insert/delete (onboarding uses create_store_with_owner).
create policy "stores_select" on public.stores
  for select using (public.is_store_member(id));

create policy "stores_update" on public.stores
  for update using (public.has_store_role(id, array['owner','admin']));

-- store_users: readable by fellow members, writable by owner/admin only.
create policy "store_users_select" on public.store_users
  for select using (public.is_store_member(store_id));

create policy "store_users_insert" on public.store_users
  for insert with check (public.has_store_role(store_id, array['owner','admin']));

create policy "store_users_update" on public.store_users
  for update using (public.has_store_role(store_id, array['owner','admin']));

create policy "store_users_delete" on public.store_users
  for delete using (public.has_store_role(store_id, array['owner','admin']));

-- products: any member can read/create/edit; delete restricted to owner/admin.
create policy "products_select" on public.products
  for select using (public.is_store_member(store_id));
create policy "products_insert" on public.products
  for insert with check (public.is_store_member(store_id));
create policy "products_update" on public.products
  for update using (public.is_store_member(store_id));
create policy "products_delete" on public.products
  for delete using (public.has_store_role(store_id, array['owner','admin']));

-- accessories: same pattern as products.
create policy "accessories_select" on public.accessories
  for select using (public.is_store_member(store_id));
create policy "accessories_insert" on public.accessories
  for insert with check (public.is_store_member(store_id));
create policy "accessories_update" on public.accessories
  for update using (public.is_store_member(store_id));
create policy "accessories_delete" on public.accessories
  for delete using (public.has_store_role(store_id, array['owner','admin']));

-- customers: same pattern.
create policy "customers_select" on public.customers
  for select using (public.is_store_member(store_id));
create policy "customers_insert" on public.customers
  for insert with check (public.is_store_member(store_id));
create policy "customers_update" on public.customers
  for update using (public.is_store_member(store_id));
create policy "customers_delete" on public.customers
  for delete using (public.has_store_role(store_id, array['owner','admin']));

-- sales: any member can read/create; edits/deletes restricted to owner/admin
-- to protect the financial history that the DRE relies on.
create policy "sales_select" on public.sales
  for select using (public.is_store_member(store_id));
create policy "sales_insert" on public.sales
  for insert with check (public.is_store_member(store_id));
create policy "sales_update" on public.sales
  for update using (public.has_store_role(store_id, array['owner','admin']));
create policy "sales_delete" on public.sales
  for delete using (public.has_store_role(store_id, array['owner','admin']));

-- sale_accessories: scoped via the parent sale's store_id.
create policy "sale_accessories_select" on public.sale_accessories
  for select using (
    exists (select 1 from public.sales s where s.id = sale_id and public.is_store_member(s.store_id))
  );
create policy "sale_accessories_insert" on public.sale_accessories
  for insert with check (
    exists (select 1 from public.sales s where s.id = sale_id and public.is_store_member(s.store_id))
  );
create policy "sale_accessories_update" on public.sale_accessories
  for update using (
    exists (select 1 from public.sales s where s.id = sale_id and public.has_store_role(s.store_id, array['owner','admin']))
  );
create policy "sale_accessories_delete" on public.sale_accessories
  for delete using (
    exists (select 1 from public.sales s where s.id = sale_id and public.has_store_role(s.store_id, array['owner','admin']))
  );

-- price_reference, monthly_inputs, cost_entries: pricing/financial config,
-- readable by all members, writable only by owner/admin.
create policy "price_reference_select" on public.price_reference
  for select using (public.is_store_member(store_id));
create policy "price_reference_insert" on public.price_reference
  for insert with check (public.has_store_role(store_id, array['owner','admin']));
create policy "price_reference_update" on public.price_reference
  for update using (public.has_store_role(store_id, array['owner','admin']));
create policy "price_reference_delete" on public.price_reference
  for delete using (public.has_store_role(store_id, array['owner','admin']));

create policy "monthly_inputs_select" on public.monthly_inputs
  for select using (public.is_store_member(store_id));
create policy "monthly_inputs_insert" on public.monthly_inputs
  for insert with check (public.has_store_role(store_id, array['owner','admin']));
create policy "monthly_inputs_update" on public.monthly_inputs
  for update using (public.has_store_role(store_id, array['owner','admin']));
create policy "monthly_inputs_delete" on public.monthly_inputs
  for delete using (public.has_store_role(store_id, array['owner','admin']));

create policy "cost_entries_select" on public.cost_entries
  for select using (public.is_store_member(store_id));
create policy "cost_entries_insert" on public.cost_entries
  for insert with check (public.has_store_role(store_id, array['owner','admin']));
create policy "cost_entries_update" on public.cost_entries
  for update using (public.has_store_role(store_id, array['owner','admin']));
create policy "cost_entries_delete" on public.cost_entries
  for delete using (public.has_store_role(store_id, array['owner','admin']));
