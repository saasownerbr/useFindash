-- Annual plan: 20% off twelve monthly payments (197 x 12 = 2364 -> 1891.20).
update public.plans set price = 1891.20 where interval = 'annual';

-- The SaaS owner's store is permanently active. lib/subscription-access.ts also grants this email full access
-- without reading the database, so this row only keeps the data consistent (banners, Configurações).
insert into public.subscriptions (user_id, store_id, status, current_period_start, current_period_end)
select u.id, s.id, 'active', now(), now() + interval '100 years'
from auth.users u
join public.store_users su on su.user_id = u.id
join public.stores s on s.id = su.store_id
where u.email = 'luanuliana8@gmail.com'
on conflict (store_id) do update set
  status = 'active',
  current_period_start = now(),
  current_period_end = now() + interval '100 years',
  updated_at = now();
