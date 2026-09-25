-- Xiaomi devices share the products table with iPhones; brand tells them apart.
-- Existing rows are all iPhones, so the default covers them.
alter table public.products
  add column brand text not null default 'apple'
  check (brand in ('apple', 'xiaomi'));

-- Seller WhatsApp, digits only (DDD + number), optional.
alter table public.store_users
  add column phone text;
