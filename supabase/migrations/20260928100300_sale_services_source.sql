-- Only a service charged through the sale wizard is revenue. One registered on its own in /assistencia is a bench
-- record: counting it too would duplicate money that has to go through a sale. `source` tells them apart, since a
-- service-only sale from the wizard also has sale_id null.

alter table public.sale_services
  add column source text not null default 'assistance' check (source in ('sale', 'assistance'));

update public.sale_services set source = 'sale' where sale_id is not null;

-- LTV: same rule as revenue, only services sold through the wizard.
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
        where ss.customer_id = target_customer
          and ss.source = 'sale'
          and ss.status in ('completed', 'delivered')
      ), 0)
  where id = target_customer;
$$;

select public.recalculate_customer_ltv(customer_id)
from (select distinct customer_id from public.sale_services where customer_id is not null) c;
