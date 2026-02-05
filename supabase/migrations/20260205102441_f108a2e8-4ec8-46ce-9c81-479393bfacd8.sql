-- Drop the problematic farmers SELECT policy that allows NULL created_by visibility
DROP POLICY IF EXISTS "Users can view their own farmers or admin sees all" ON public.farmers;
DROP POLICY IF EXISTS "Users can update their own farmers or admin" ON public.farmers;
DROP POLICY IF EXISTS "Users can delete their own farmers or admin" ON public.farmers;
DROP POLICY IF EXISTS "Users and admins can manage farmers" ON public.farmers;

-- Fix farmers: staff sees only their own records; admins see all
CREATE POLICY "Staff can view own farmers, admins see all"
  ON public.farmers FOR SELECT TO authenticated
  USING (
    created_by = auth.uid() 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Staff can update own farmers, admins update all"
  ON public.farmers FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Staff can delete own farmers, admins delete all"
  ON public.farmers FOR DELETE TO authenticated
  USING (
    created_by = auth.uid() 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Fix milk_entries: add recorded_by filter
DROP POLICY IF EXISTS "Authenticated users can view milk entries" ON public.milk_entries;
DROP POLICY IF EXISTS "Users and admins can manage milk entries" ON public.milk_entries;

CREATE POLICY "Staff can view own milk entries, admins see all"
  ON public.milk_entries FOR SELECT TO authenticated
  USING (
    recorded_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Staff can insert milk entries"
  ON public.milk_entries FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update own milk entries, admins update all"
  ON public.milk_entries FOR UPDATE TO authenticated
  USING (
    recorded_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Staff can delete own milk entries, admins delete all"
  ON public.milk_entries FOR DELETE TO authenticated
  USING (
    recorded_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );