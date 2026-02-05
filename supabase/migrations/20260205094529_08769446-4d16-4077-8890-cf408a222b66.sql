-- Drop the existing admin-only insert policy
DROP POLICY IF EXISTS "Admins can create collection centers" ON public.collection_centers;

-- Create a new policy allowing all authenticated users to insert
CREATE POLICY "Authenticated users can create collection centers"
ON public.collection_centers
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);