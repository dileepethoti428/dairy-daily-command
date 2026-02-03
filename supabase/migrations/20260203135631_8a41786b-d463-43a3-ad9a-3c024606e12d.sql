-- Add missing columns to settlements table
ALTER TABLE public.settlements 
ADD COLUMN IF NOT EXISTS total_litres DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS locked_by UUID,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS paid_by UUID,
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add is_locked column to milk_entries
ALTER TABLE public.milk_entries 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_settlements_status ON public.settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_dates ON public.settlements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_milk_entries_settlement ON public.milk_entries(settlement_id);
CREATE INDEX IF NOT EXISTS idx_milk_entries_locked ON public.milk_entries(is_locked);

-- Create function to update settlement totals
CREATE OR REPLACE FUNCTION public.update_settlement_totals(p_settlement_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.settlements
  SET 
    total_litres = COALESCE((
      SELECT SUM(quantity_liters) 
      FROM public.milk_entries 
      WHERE settlement_id = p_settlement_id
    ), 0),
    total_amount = COALESCE((
      SELECT SUM(total_amount) 
      FROM public.milk_entries 
      WHERE settlement_id = p_settlement_id
    ), 0),
    updated_at = now()
  WHERE id = p_settlement_id;
END;
$$;

-- Create function to lock a settlement and all its entries
CREATE OR REPLACE FUNCTION public.lock_settlement(p_settlement_id UUID, p_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check current status
  IF NOT EXISTS (SELECT 1 FROM public.settlements WHERE id = p_settlement_id AND status = 'open') THEN
    RAISE EXCEPTION 'Settlement not found or already locked/paid';
  END IF;
  
  -- Lock all milk entries for this settlement
  UPDATE public.milk_entries
  SET is_locked = true
  WHERE settlement_id = p_settlement_id;
  
  -- Update settlement status
  UPDATE public.settlements
  SET 
    status = 'locked',
    locked_at = now(),
    locked_by = p_user_id,
    updated_at = now()
  WHERE id = p_settlement_id;
  
  RETURN true;
END;
$$;

-- Create function to mark settlement as paid
CREATE OR REPLACE FUNCTION public.mark_settlement_paid(p_settlement_id UUID, p_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check current status is locked
  IF NOT EXISTS (SELECT 1 FROM public.settlements WHERE id = p_settlement_id AND status = 'locked') THEN
    RAISE EXCEPTION 'Settlement must be locked before marking as paid';
  END IF;
  
  -- Update settlement status
  UPDATE public.settlements
  SET 
    status = 'paid',
    paid_at = now(),
    paid_by = p_user_id,
    updated_at = now()
  WHERE id = p_settlement_id;
  
  RETURN true;
END;
$$;

-- Create trigger function to update settlement totals when milk entries change
CREATE OR REPLACE FUNCTION public.trigger_update_settlement_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.settlement_id IS NOT NULL THEN
      PERFORM public.update_settlement_totals(NEW.settlement_id);
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.settlement_id IS NOT NULL AND OLD.settlement_id != NEW.settlement_id THEN
      PERFORM public.update_settlement_totals(OLD.settlement_id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.settlement_id IS NOT NULL THEN
      PERFORM public.update_settlement_totals(OLD.settlement_id);
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_settlement_totals_trigger ON public.milk_entries;
CREATE TRIGGER update_settlement_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.milk_entries
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_settlement_totals();

-- Create trigger function to prevent editing locked entries
CREATE OR REPLACE FUNCTION public.prevent_locked_entry_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_locked = true THEN
    RAISE EXCEPTION 'Cannot modify a locked milk entry';
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS prevent_locked_entry_edit_trigger ON public.milk_entries;
CREATE TRIGGER prevent_locked_entry_edit_trigger
BEFORE UPDATE ON public.milk_entries
FOR EACH ROW
EXECUTE FUNCTION public.prevent_locked_entry_edit();

-- Create trigger function to prevent deleting locked entries
CREATE OR REPLACE FUNCTION public.prevent_locked_entry_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_locked = true THEN
    RAISE EXCEPTION 'Cannot delete a locked milk entry';
  END IF;
  RETURN OLD;
END;
$$;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS prevent_locked_entry_delete_trigger ON public.milk_entries;
CREATE TRIGGER prevent_locked_entry_delete_trigger
BEFORE DELETE ON public.milk_entries
FOR EACH ROW
EXECUTE FUNCTION public.prevent_locked_entry_delete();