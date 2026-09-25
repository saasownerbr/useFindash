-- Paid plans (Asaas). Access is per store: every member of a store (owner and invited sellers) shares the store's
-- subscription; user_id records who owns it (the store owner).

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric not null,
  interval text check (interval in ('monthly', 'annual')),
  duration_months integer not null,
  asaas_billing_type text,
  is_active boolean default true,
  created_at timestamptz default now()
);

insert into public.plans (name, description, price, interval, duration_months, asaas_billing_type) values
  ('Mensal', 'Acesso completo com renovação automática todo mês', 197, 'monthly', 1, 'CREDIT_CARD'),
  ('Anual', 'Acesso completo por 12 meses com melhor custo', 2364, 'annual', 12, 'UNDEFINED');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id),
  status text check (status in ('trial', 'pending', 'active', 'overdue', 'cancelled', 'expired')) default 'trial',
  asaas_customer_id text,
  asaas_subscription_id text,
  asaas_payment_id text,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint subscriptions_store_id_unique unique (store_id)
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);
create index subscriptions_asaas_subscription_id_idx on public.subscriptions (asaas_subscription_id);
create index subscriptions_asaas_payment_id_idx on public.subscriptions (asaas_payment_id);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  asaas_event_id text,
  event_type text not null,
  status text,
  value numeric,
  payload jsonb,
  processed_at timestamptz default now(),
  -- Asaas delivers at least once; the event id makes redelivery a no-op.
  constraint payment_events_asaas_event_id_unique unique (asaas_event_id)
);

create index payment_events_subscription_id_idx on public.payment_events (subscription_id);

-- Plans are the public price list.
alter table public.plans enable row level security;
create policy "plans are readable by everyone" on public.plans for select using (true);

-- Users read their own subscription, and store members read their store's (so sellers are not locked out).
-- Writes only happen server side (service role: checkout routes, Asaas webhook) or in create_store_with_owner.
alter table public.subscriptions enable row level security;
create policy "users read their own or their store's subscription" on public.subscriptions
  for select using (user_id = auth.uid() or public.is_store_member(store_id));

alter table public.payment_events enable row level security;
create policy "users read events of their own subscription" on public.payment_events
  for select using (
    exists (select 1 from public.subscriptions s where s.id = subscription_id and s.user_id = auth.uid())
  );

-- Onboarding: every new store starts with a 7-day trial, created in the same transaction as the store.
create or replace function public.create_store_with_owner(
  store_name text,
  owner_name text,
  monthly_goal numeric default 0,
  store_cnpj text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_store_id uuid;
begin
  insert into public.stores (name, monthly_revenue_goal, cnpj)
  values (store_name, monthly_goal, store_cnpj)
  returning id into new_store_id;

  insert into public.store_users (store_id, user_id, role, name)
  values (new_store_id, auth.uid(), 'owner', owner_name);

  insert into public.subscriptions (store_id, user_id, plan_id, status, trial_end, current_period_end)
  values (new_store_id, auth.uid(), null, 'trial', now() + interval '7 days', now() + interval '7 days');

  return new_store_id;
end;
$$;

-- Stores created before plans existed get the same 7-day trial, starting now, so nobody is locked out on deploy.
insert into public.subscriptions (store_id, user_id, status, trial_end, current_period_end)
select s.id, su.user_id, 'trial', now() + interval '7 days', now() + interval '7 days'
from public.stores s
join lateral (
  select user_id from public.store_users
  where store_id = s.id and role = 'owner'
  order by created_at
  limit 1
) su on true
where not exists (select 1 from public.subscriptions x where x.store_id = s.id);
