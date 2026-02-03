-- Add new columns to milk_entries table
ALTER TABLE public.milk_entries 
ADD COLUMN IF NOT EXISTS center_id UUID REFERENCES public.collection_centers(id),
ADD COLUMN IF NOT EXISTS rate_per_litre DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2);

-- Make session nullable (one entry per farmer per day, not per session)
ALTER TABLE public.milk_entries 
ALTER COLUMN session DROP NOT NULL;

-- Add unique constraint for one entry per farmer per day
ALTER TABLE public.milk_entries 
ADD CONSTRAINT unique_farmer_entry_per_day UNIQUE (farmer_id, entry_date);

-- Create index for faster lookups by date and center
CREATE INDEX IF NOT EXISTS idx_milk_entries_date_center 
ON public.milk_entries(entry_date, center_id);

-- Create index for farmer lookups
CREATE INDEX IF NOT EXISTS idx_milk_entries_farmer_date 
ON public.milk_entries(farmer_id, entry_date DESC);