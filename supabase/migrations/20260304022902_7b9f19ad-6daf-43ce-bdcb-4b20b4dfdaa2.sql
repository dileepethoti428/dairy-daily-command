ALTER TABLE public.milk_entries
  DROP CONSTRAINT IF EXISTS milk_entries_farmer_date_session_unique;

ALTER TABLE public.milk_entries
  ADD CONSTRAINT milk_entries_farmer_date_session_type_unique
  UNIQUE (farmer_id, entry_date, session, milk_type);