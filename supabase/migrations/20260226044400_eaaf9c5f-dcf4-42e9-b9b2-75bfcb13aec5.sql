
-- Create farmer_livestock table
CREATE TABLE public.farmer_livestock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  animal_type TEXT NOT NULL CHECK (animal_type IN ('cow', 'buffalo')),
  breed TEXT NOT NULL,
  animal_count INTEGER NOT NULL DEFAULT 1 CHECK (animal_count >= 1),
  expected_daily_liters NUMERIC NOT NULL DEFAULT 0 CHECK (expected_daily_liters >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one row per farmer per animal type
ALTER TABLE public.farmer_livestock ADD CONSTRAINT unique_farmer_animal_type UNIQUE (farmer_id, animal_type);

-- Enable RLS
ALTER TABLE public.farmer_livestock ENABLE ROW LEVEL SECURITY;

-- RLS policies matching farmers table (authenticated users can CRUD)
CREATE POLICY "Authenticated users can view farmer livestock"
  ON public.farmer_livestock FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert farmer livestock"
  ON public.farmer_livestock FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update farmer livestock"
  ON public.farmer_livestock FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete farmer livestock"
  ON public.farmer_livestock FOR DELETE
  TO authenticated
  USING (true);

-- Updated_at trigger
CREATE TRIGGER update_farmer_livestock_updated_at
  BEFORE UPDATE ON public.farmer_livestock
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add milk_type column to milk_entries for cow/buffalo distinction
ALTER TABLE public.milk_entries ADD COLUMN IF NOT EXISTS milk_type TEXT;
