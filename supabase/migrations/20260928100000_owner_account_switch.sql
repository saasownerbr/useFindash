-- The SaaS owner account moved to saas.owner.br@gmail.com (lib/subscription-access.ts OWNER_EMAIL).
-- The previous owner account loses its permanent access; the new one gets it. Applied to production on 2026-09-28.
update public.subscriptions
set status = 'expired', current_period_end = now(), updated_at = now()
where user_id = (select id from auth.users where email = 'luanuliana8@gmail.com');

insert into public.subscriptions (user_id, store_id, status, current_period_start, current_period_end)
select u.id, s.id, 'active', now(), now() + interval '100 years'
from auth.users u
join public.store_users su on su.user_id = u.id
join public.stores s on s.id = su.store_id
where u.email = 'saas.owner.br@gmail.com'
on conflict (store_id) do update set
  status = 'active',
  current_period_start = now(),
  current_period_end = now() + interval '100 years',
  updated_at = now();
