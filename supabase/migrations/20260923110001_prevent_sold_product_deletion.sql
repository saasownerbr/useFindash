-- Prevent deletion of products that have been sold
-- This maintains historical integrity: once a product appears in a sale, it cannot be deleted

create or replace function public.check_product_not_sold_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'sold' then
    raise exception 'Não é possível deletar um aparelho que já foi vendido';
  end if;
  return old;
end;
$$;

create trigger products_prevent_sold_delete
before delete on public.products
for each row execute function public.check_product_not_sold_before_delete();
