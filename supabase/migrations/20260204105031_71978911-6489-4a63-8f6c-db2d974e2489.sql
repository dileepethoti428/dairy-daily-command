
-- Fix function search paths for security (prevents SQL injection via search_path manipulation)

-- Recreate generate_farmer_code with search_path set
CREATE OR REPLACE FUNCTION public.generate_farmer_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Recreate update_updated_at_column with search_path set
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate lock_settlement with search_path set
CREATE OR REPLACE FUNCTION public.lock_settlement(p_settlement_id uuid, p_user_id uuid)
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

-- Recreate mark_settlement_paid with search_path set
CREATE OR REPLACE FUNCTION public.mark_settlement_paid(p_settlement_id uuid, p_user_id uuid)
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

-- Recreate update_settlement_totals with search_path set
CREATE OR REPLACE FUNCTION public.update_settlement_totals(p_settlement_id uuid)
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

-- Recreate get_user_center with search_path set  
CREATE OR REPLACE FUNCTION public.get_user_center(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT center_id FROM public.user_center_assignments 
    WHERE user_id = p_user_id AND is_primary = true
    LIMIT 1
$$;

-- Recreate user_has_center_access with search_path set
CREATE OR REPLACE FUNCTION public.user_has_center_access(p_user_id uuid, p_center_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_center_assignments 
        WHERE user_id = p_user_id AND center_id = p_center_id
    ) OR public.has_role(p_user_id, 'admin')
$$;

-- Create a trigger to prevent deletion of milk entries (use soft delete via is_locked or deactivation)
-- Milk entries should never be deleted, only locked via settlement

-- Add a check to prevent milk entry deletion when entry is in a settlement
CREATE OR REPLACE FUNCTION public.prevent_milk_entry_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow deletion if entry is not locked and has no settlement
  IF OLD.is_locked = true THEN
    RAISE EXCEPTION 'Cannot delete locked milk entries. This entry is part of a finalized settlement.';
  END IF;
  
  IF OLD.settlement_id IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot delete milk entries that are assigned to a settlement.';
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create the trigger (drop first if exists)
DROP TRIGGER IF EXISTS prevent_milk_entry_delete ON public.milk_entries;
CREATE TRIGGER prevent_milk_entry_delete
  BEFORE DELETE ON public.milk_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_milk_entry_deletion();

-- Create a trigger to prevent editing of locked milk entries
CREATE OR REPLACE FUNCTION public.prevent_locked_milk_entry_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_locked = true THEN
    RAISE EXCEPTION 'Cannot edit locked milk entries. This entry is part of a finalized settlement.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger (drop first if exists)
DROP TRIGGER IF EXISTS prevent_locked_milk_entry_edit ON public.milk_entries;
CREATE TRIGGER prevent_locked_milk_entry_edit
  BEFORE UPDATE ON public.milk_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_locked_milk_entry_edit();
