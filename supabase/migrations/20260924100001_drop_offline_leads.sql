-- Monthly inputs keep only paid traffic, Instagram and WhatsApp leads.
alter table public.monthly_inputs
  drop column leads_pdv,
  drop column leads_referral;
