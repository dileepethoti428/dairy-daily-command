-- Create milk_type enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'milk_type') THEN
        CREATE TYPE public.milk_type AS ENUM ('cow', 'buffalo', 'both');
    END IF;
END$$;

-- Add missing columns to farmers table
ALTER TABLE public.farmers 
ADD COLUMN IF NOT EXISTS village text,
ADD COLUMN IF NOT EXISTS milk_type public.milk_type DEFAULT 'cow',
ADD COLUMN IF NOT EXISTS bank_account_holder_name text,
ADD COLUMN IF NOT EXISTS bank_account_number text,
ADD COLUMN IF NOT EXISTS bank_ifsc text,
ADD COLUMN IF NOT EXISTS bank_name text;

-- Make phone required (if it was nullable) and add unique constraint per center
-- First update any null phones to empty string
UPDATE public.farmers SET phone = '' WHERE phone IS NULL;

-- Alter phone to be NOT NULL
ALTER TABLE public.farmers ALTER COLUMN phone SET NOT NULL;

-- Add unique constraint for mobile per collection center
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'farmers_phone_center_unique'
    ) THEN
        ALTER TABLE public.farmers 
        ADD CONSTRAINT farmers_phone_center_unique UNIQUE (phone, center_id);
    END IF;
END$$;

-- Make village required
UPDATE public.farmers SET village = address WHERE village IS NULL;
ALTER TABLE public.farmers ALTER COLUMN village SET DEFAULT '';

-- Create function to generate farmer_id if farmer_code is empty
CREATE OR REPLACE FUNCTION public.generate_farmer_code()
RETURNS TRIGGER AS $$
DECLARE
    center_code text;
    next_num integer;
BEGIN
    IF NEW.farmer_code IS NULL OR NEW.farmer_code = '' THEN
        -- Get center code
        SELECT code INTO center_code FROM public.collection_centers WHERE id = NEW.center_id;
        
        -- Get next number for this center
        SELECT COALESCE(MAX(CAST(SUBSTRING(farmer_code FROM '[0-9]+$') AS INTEGER)), 0) + 1 
        INTO next_num 
        FROM public.farmers 
        WHERE center_id = NEW.center_id;
        
        NEW.farmer_code := COALESCE(center_code, 'F') || '-' || LPAD(next_num::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-generating farmer code
DROP TRIGGER IF EXISTS generate_farmer_code_trigger ON public.farmers;
CREATE TRIGGER generate_farmer_code_trigger
    BEFORE INSERT ON public.farmers
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_farmer_code();