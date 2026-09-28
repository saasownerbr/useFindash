-- Audit 2026-09: costs of a sale come from the product row, never from the client; one store per CPF/CNPJ.

-- 1. create_sale: acquisition and repair cost are read from the product being sold (locked row), so a tampered
--    request can no longer record a made-up CMV. p_acquisition_cost / p_repair_cost stay in the signature for the
--    existing clients but are ignored.
create or replace function public.create_sale(
  p_store_id uuid,
  p_customer_id uuid,
  p_seller_id uuid,
  p_product_id uuid,
  p_sale_channel text,
  p_sale_price numeric,
  p_payment_method text,
  p_installments integer,
  p_acquisition_cost numeric,
  p_repair_cost numeric,
  p_accessories jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_commission_rate numeric;
  v_commission numeric;
  v_item jsonb;
  v_accessory_id uuid;
  v_qty integer;
  v_unit_price numeric;
  v_available integer;
  v_product_status text;
  v_acquisition_cost numeric := 0;
  v_repair_cost numeric := 0;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'not a member of this store';
  end if;

  if p_product_id is null and jsonb_array_length(coalesce(p_accessories, '[]'::jsonb)) = 0 then
    raise exception 'sale must include a product or at least one accessory';
  end if;

  if p_sale_price is null or p_sale_price < 0 then
    raise exception 'invalid sale price';
  end if;

  if not exists (
    select 1 from public.customers
    where id = p_customer_id and store_id = p_store_id
  ) then
    raise exception 'invalid customer for this store';
  end if;

  select commission_rate into v_commission_rate
  from public.store_users
  where id = p_seller_id and store_id = p_store_id;

  if v_commission_rate is null then
    raise exception 'invalid seller for this store';
  end if;

  if p_product_id is not null then
    -- Lock the product row before checking availability so two concurrent sales of the same product can't both
    -- pass the check before either commits.
    select status, acquisition_cost, repair_cost
    into v_product_status, v_acquisition_cost, v_repair_cost
    from public.products
    where id = p_product_id and store_id = p_store_id
    for update;

    if v_product_status is null or v_product_status <> 'available' then
      raise exception 'product is not available for sale';
    end if;
  end if;

  v_commission := p_sale_price * v_commission_rate;

  insert into public.sales (
    store_id, customer_id, seller_id, product_id, sale_channel,
    sale_price, payment_method, installments, acquisition_cost, repair_cost,
    commission_amount
  ) values (
    p_store_id, p_customer_id, p_seller_id, p_product_id, p_sale_channel,
    p_sale_price, p_payment_method, coalesce(p_installments, 1),
    coalesce(v_acquisition_cost, 0), coalesce(v_repair_cost, 0),
    v_commission
  )
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_accessories, '[]'::jsonb))
  loop
    v_accessory_id := (v_item->>'accessory_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;

    if v_qty is null or v_qty <= 0 then
      raise exception 'invalid accessory quantity';
    end if;

    if v_unit_price is null or v_unit_price < 0 then
      raise exception 'invalid accessory price';
    end if;

    select quantity into v_available
    from public.accessories
    where id = v_accessory_id and store_id = p_store_id
    for update;

    if v_available is null then
      raise exception 'accessory not found in this store';
    end if;

    if v_available < v_qty then
      raise exception 'insufficient accessory stock';
    end if;

    insert into public.sale_accessories (sale_id, accessory_id, quantity, unit_price)
    values (v_sale_id, v_accessory_id, v_qty, v_unit_price);

    update public.accessories
    set quantity = quantity - v_qty
    where id = v_accessory_id;
  end loop;

  return v_sale_id;
end;
$$;

-- 2. One store per CPF/CNPJ: a new trial can't be opened with a document another store already uses.
--    (A unique index is not possible yet: two stores created before this check share a document.)
create or replace function public.cpf_cnpj_in_use(document text, exclude_store uuid default null)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.stores
    where cnpj = regexp_replace(coalesce(document, ''), '\D', '', 'g')
      and cnpj <> ''
      and (exclude_store is null or id <> exclude_store)
  );
$$;

create or replace function public.prevent_duplicate_cpf_cnpj()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.cnpj is null or new.cnpj = '' then
    return new;
  end if;
  new.cnpj := regexp_replace(new.cnpj, '\D', '', 'g');
  if tg_op = 'UPDATE' and new.cnpj is not distinct from old.cnpj then
    return new;
  end if;
  if public.cpf_cnpj_in_use(new.cnpj, new.id) then
    raise exception 'cpf_cnpj_in_use' using errcode = '23505';
  end if;
  return new;
end;
$$;

drop trigger if exists stores_prevent_duplicate_cpf_cnpj on public.stores;
create trigger stores_prevent_duplicate_cpf_cnpj
before insert or update of cnpj on public.stores
for each row execute function public.prevent_duplicate_cpf_cnpj();
