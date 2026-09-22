-- useFindash initial schema
-- Tables per docs/superpowers/specs/2026-09-22-usefindash-saas-design.md section 4.
-- Note: sales.repair_cost was added (not present in the original prompt's table
-- list) because gross_margin's formula (sale_price - acquisition_cost - repair_cost)
-- requires it frozen on the row, the same way acquisition_cost is frozen.

create extension if not exists pgcrypto;

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  monthly_revenue_goal numeric not null default 0,
  stock_alert_days integer not null default 30,
  upgrade_alert_months integer not null default 20,
  created_at timestamptz not null default now()
);

create table public.store_users (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'seller')),
  commission_rate numeric not null default 0,
  name text not null,
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  imei text unique,
  model text not null,
  storage text not null,
  color text,
  type text not null check (type in ('new', 'semi_novo')),
  status text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  acquisition_cost numeric not null,
  repair_cost numeric not null default 0,
  suggested_price numeric,
  final_price numeric,
  grade text check (grade in ('A+', 'A', 'B', 'C', 'sucata')),
  supplier text,
  purchase_date date,
  days_in_stock integer not null default 0,
  checkup_data jsonb,
  created_at timestamptz not null default now()
);

create table public.accessories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  category text,
  quantity integer not null default 0,
  cost numeric not null,
  sale_price numeric not null,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  whatsapp text not null,
  birthdate date,
  acquisition_channel text,
  ltv numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  seller_id uuid not null references public.store_users(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  sale_channel text not null check (sale_channel in ('instagram', 'whatsapp', 'pdv', 'referral', 'paid_traffic')),
  sale_price numeric not null,
  payment_method text,
  installments integer not null default 1,
  acquisition_cost numeric not null default 0,
  repair_cost numeric not null default 0,
  gross_margin numeric generated always as (sale_price - acquisition_cost - repair_cost) stored,
  commission_amount numeric,
  sold_at timestamptz not null default now()
);

create table public.sale_accessories (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  accessory_id uuid not null references public.accessories(id) on delete restrict,
  quantity integer not null,
  unit_price numeric not null
);

create table public.price_reference (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  model text not null,
  storage text not null,
  base_price numeric not null,
  grade_multiplier_a_plus numeric not null default 0.92,
  grade_multiplier_a numeric not null default 0.82,
  grade_multiplier_b numeric not null default 0.68,
  grade_multiplier_c numeric not null default 0.48,
  updated_at timestamptz not null default now(),
  unique (store_id, model, storage)
);

create table public.monthly_inputs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  month date not null,
  paid_traffic_investment numeric not null default 0,
  leads_instagram integer not null default 0,
  leads_whatsapp integer not null default 0,
  leads_pdv integer not null default 0,
  leads_referral integer not null default 0,
  created_at timestamptz not null default now(),
  unique (store_id, month)
);

create table public.cost_entries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  type text not null check (type in ('fixed', 'variable', 'marketing', 'supplier')),
  description text not null,
  amount numeric not null,
  date date not null,
  month date not null,
  created_at timestamptz not null default now()
);

create index products_store_id_idx on public.products(store_id);
create index products_status_idx on public.products(status);
create index accessories_store_id_idx on public.accessories(store_id);
create index customers_store_id_idx on public.customers(store_id);
create index sales_store_id_idx on public.sales(store_id);
create index sales_sold_at_idx on public.sales(sold_at);
create index sales_customer_id_idx on public.sales(customer_id);
create index sale_accessories_sale_id_idx on public.sale_accessories(sale_id);
create index price_reference_store_id_idx on public.price_reference(store_id);
create index monthly_inputs_store_id_idx on public.monthly_inputs(store_id);
create index cost_entries_store_id_idx on public.cost_entries(store_id);
create index store_users_store_id_idx on public.store_users(store_id);
create index store_users_user_id_idx on public.store_users(user_id);
