
-- Add SELECT policies for partners on pricing_formula
-- The existing "FOR ALL" policy does NOT cover SELECT in Postgres RLS — SELECT is evaluated separately.

-- 1. Partners can READ their own center's formula
CREATE POLICY "Partners can read their center formula"
ON public.pricing_formula
FOR SELECT
TO authenticated
USING (
  collection_center_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_center_assignments
    WHERE user_center_assignments.center_id = pricing_formula.collection_center_id
    AND user_center_assignments.user_id = auth.uid()
  )
);

-- 2. All authenticated users can read the global formula (collection_center_id IS NULL)
-- so partners can copy it when auto-initializing their center's formula
CREATE POLICY "All authenticated users can read global formula"
ON public.pricing_formula
FOR SELECT
TO authenticated
USING (
  collection_center_id IS NULL
);
