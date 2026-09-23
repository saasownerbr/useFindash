-- Fix IMEI constraint to be scoped per store instead of globally unique
-- This ensures multi-tenant isolation — different stores can have seminovos with the same IMEI

-- Drop the existing global unique constraint on imei
alter table public.products drop constraint products_imei_key;

-- Add a composite unique constraint: (store_id, imei) — allows null imei (for lotes of new devices)
-- Note: In PostgreSQL, NULL is not equal to NULL, so multiple rows can have (store_id, NULL)
alter table public.products add constraint products_store_id_imei_unique unique (store_id, imei);

-- Create an index to improve query performance on store_id + imei lookups
-- (Supabase may create this automatically with the unique constraint, but explicit is clear)
create index products_store_id_imei_idx on public.products(store_id, imei);
