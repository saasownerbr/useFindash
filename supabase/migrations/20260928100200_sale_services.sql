-- Assistência técnica: repair services, sold inside a sale (sale_id) or on their own (sale_id null).
-- Revenue counts once the service is completed or delivered, dated by completed_at; parts are its CMV and labor is
-- revenue with no cost.

create table public.sale_services (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_id uuid references public.sales(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  seller_id uuid references public.store_users(id) on delete set null,
  device_description text not null,
  service_type text not null,
  -- [{ "name": "Tela original iPhone 13", "value": 450 }]
  parts_replaced jsonb not null default '[]'::jsonb,
  labor_cost numeric not null default 0 check (labor_cost >= 0),
  parts_cost numeric not null default 0,
  total_cost numeric not null default 0,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'delivered')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sale_services_store_id_idx on public.sale_services(store_id);
create index sale_services_sale_id_idx on public.sale_services(sale_id);
create index sale_services_customer_id_idx on public.sale_services(customer_id);
create index sale_services_completed_at_idx on public.sale_services(store_id, completed_at);

-- parts_cost is the sum of parts_replaced[].value; total_cost = labor + parts. completed_at is stamped the first
-- time the service reaches completed/delivered and cleared if it goes back to pending/in_progress.
create or replace function public.calculate_parts_cost()
returns trigger
language plpgsql
as $$
begin
  new.parts_cost = coalesce((
    select sum(coalesce(nullif(part->>'value', ''), '0')::numeric)
    from jsonb_array_elements(coalesce(new.parts_replaced, '[]'::jsonb)) as part
  ), 0);
  new.total_cost = coalesce(new.labor_cost, 0) + new.parts_cost;
  new.updated_at = now();
  if new.status in ('completed', 'delivered') then
    new.completed_at = coalesce(new.completed_at, now());
  else
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger update_parts_cost
before insert or update on public.sale_services
for each row execute function public.calculate_parts_cost();

alter table public.sale_services enable row level security;

create policy "sale_services_select" on public.sale_services
  for select using (public.is_store_member(store_id));
create policy "sale_services_insert" on public.sale_services
  for insert with check (public.is_store_member(store_id));
create policy "sale_services_update" on public.sale_services
  for update using (public.is_store_member(store_id));
create policy "sale_services_delete" on public.sale_services
  for delete using (public.has_store_role(store_id, array['owner','admin']));

-- LTV = everything the customer paid: device legs (sales.sale_price), accessories (sale_accessories) and finished
-- services. Before this, accessory-only purchases never reached the LTV.
create or replace function public.recalculate_customer_ltv(target_customer uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.customers
  set ltv =
    coalesce((select sum(s.sale_price) from public.sales s where s.customer_id = target_customer), 0)
    + coalesce((
        select sum(sa.quantity * sa.unit_price)
        from public.sale_accessories sa
        join public.sales s on s.id = sa.sale_id
        where s.customer_id = target_customer
      ), 0)
    + coalesce((
        select sum(ss.total_cost) from public.sale_services ss
        where ss.customer_id = target_customer and ss.status in ('completed', 'delivered')
      ), 0)
  where id = target_customer;
$$;

create or replace function public.update_customer_ltv()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op <> 'INSERT' then
    perform public.recalculate_customer_ltv(old.customer_id);
  end if;
  if tg_op <> 'DELETE' and new.customer_id is not null then
    perform public.recalculate_customer_ltv(new.customer_id);
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.update_customer_ltv_from_accessory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_customer_ltv(
    (select customer_id from public.sales where id = coalesce(new.sale_id, old.sale_id))
  );
  return coalesce(new, old);
end;
$$;

-- sales_update_customer_ltv already runs update_customer_ltv() on sales.
drop trigger if exists sale_accessories_update_customer_ltv on public.sale_accessories;
create trigger sale_accessories_update_customer_ltv
after insert or update or delete on public.sale_accessories
for each row execute function public.update_customer_ltv_from_accessory();

drop trigger if exists sale_services_update_customer_ltv on public.sale_services;
create trigger sale_services_update_customer_ltv
after insert or update or delete on public.sale_services
for each row execute function public.update_customer_ltv();

-- Recompute every customer once with the new rule.
select public.recalculate_customer_ltv(id) from public.customers;
