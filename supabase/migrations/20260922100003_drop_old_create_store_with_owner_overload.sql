-- create or replace function does not replace a signature when the parameter
-- list changes (adding store_cnpj made it a new overload). Drop the old
-- 3-parameter version so only the CNPJ-aware signature remains callable.

drop function if exists public.create_store_with_owner(text, text, numeric);
