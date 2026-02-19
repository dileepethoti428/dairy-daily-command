CREATE POLICY "Users can update own bank details"
ON public.dairy_partner_applications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);