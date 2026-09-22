-- Switch signup from magic link to email+password and capture company CNPJ
-- at signup time for future billing integration (no billing logic yet).
-- Per docs/superpowers/specs/2026-09-22-usefindash-saas-design.md.

alter table public.stores add column cnpj text;

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

  return new_store_id;
end;
$$;
