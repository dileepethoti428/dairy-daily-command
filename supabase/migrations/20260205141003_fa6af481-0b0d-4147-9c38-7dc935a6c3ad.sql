-- Add session column to milk_entries table
ALTER TABLE public.milk_entries 
ADD COLUMN IF NOT EXISTS session TEXT DEFAULT 'morning' CHECK (session IN ('morning', 'evening'));

-- Drop the existing unique constraint on farmer_id and entry_date
ALTER TABLE public.milk_entries 
DROP CONSTRAINT IF EXISTS milk_entries_farmer_id_entry_date_key;

-- Create new unique constraint including session
ALTER TABLE public.milk_entries 
ADD CONSTRAINT milk_entries_farmer_date_session_unique UNIQUE (farmer_id, entry_date, session);