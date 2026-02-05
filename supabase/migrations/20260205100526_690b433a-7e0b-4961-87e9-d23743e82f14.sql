-- Add created_by column to farmers table to track who created each farmer
ALTER TABLE public.farmers 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update existing farmers to set created_by to NULL (will be visible to all for now)
-- New farmers will have created_by set when created

-- Drop existing RLS policies on farmers that restrict by admin
DROP POLICY IF EXISTS "Authenticated users can view farmers" ON public.farmers;
DROP POLICY IF EXISTS "Authenticated users can insert farmers" ON public.farmers;
DROP POLICY IF EXISTS "Authenticated users can update farmers" ON public.farmers;
DROP POLICY IF EXISTS "Users can view farmers" ON public.farmers;
DROP POLICY IF EXISTS "Users can insert farmers" ON public.farmers;
DROP POLICY IF EXISTS "Users can update farmers" ON public.farmers;
DROP POLICY IF EXISTS "Admins can update farmers" ON public.farmers;
DROP POLICY IF EXISTS "Staff can view farmers in their center" ON public.farmers;

-- Create new RLS policies for farmers:
-- Users can only see farmers they created (or admins see all)
CREATE POLICY "Users can view their own farmers or admin sees all"
ON public.farmers
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR public.has_role(auth.uid(), 'admin')
  OR created_by IS NULL  -- Legacy farmers without created_by are visible to all
);

-- Users can create farmers (created_by will be set to their user id)
CREATE POLICY "Authenticated users can create farmers"
ON public.farmers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update their own farmers (or admins can update any)
CREATE POLICY "Users can update their own farmers or admin"
ON public.farmers
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() 
  OR public.has_role(auth.uid(), 'admin')
  OR created_by IS NULL
);

-- Users can delete their own farmers (or admins can delete any)
CREATE POLICY "Users can delete their own farmers or admin"
ON public.farmers
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() 
  OR public.has_role(auth.uid(), 'admin')
  OR created_by IS NULL
);