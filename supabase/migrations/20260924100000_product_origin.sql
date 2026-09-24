-- Where a device came from, replacing the free-text "Fornecedor" field in the UI.
alter table public.products
  add column origin text
  check (origin in ('wholesaler', 'distributor', 'trade_in', 'individual', 'other'));
