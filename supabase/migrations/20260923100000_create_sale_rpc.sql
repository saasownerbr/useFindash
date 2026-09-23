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
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'not a member of this store';
  end if;

  select commission_rate into v_commission_rate
  from public.store_users
  where id = p_seller_id and store_id = p_store_id;

  if v_commission_rate is null then
    raise exception 'invalid seller for this store';
  end if;

  if p_product_id is not null then
    if not exists (
      select 1 from public.products
      where id = p_product_id and store_id = p_store_id and status = 'available'
    ) then
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
    p_sale_price, p_payment_method, coalesce(p_installments, 1), p_acquisition_cost, p_repair_cost,
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

grant execute on function public.create_sale(
  uuid, uuid, uuid, uuid, text, numeric, text, integer, numeric, numeric, jsonb
) to authenticated;
