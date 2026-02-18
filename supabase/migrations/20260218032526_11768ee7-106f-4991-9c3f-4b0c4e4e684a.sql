-- Add is_active column to dairy_partner_applications
ALTER TABLE public.dairy_partner_applications
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add new RLS policy: partners can manage formula for their assigned center only
CREATE POLICY "Partners can manage their center formula"
ON public.pricing_formula
FOR ALL
TO authenticated
USING (
  collection_center_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_center_assignments
    WHERE user_center_assignments.center_id = pricing_formula.collection_center_id
    AND user_center_assignments.user_id = auth.uid()
  )
)
WITH CHECK (
  collection_center_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_center_assignments
    WHERE user_center_assignments.center_id = pricing_formula.collection_center_id
    AND user_center_assignments.user_id = auth.uid()
  )
);