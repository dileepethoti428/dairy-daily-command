-- Fix milk entries: Drop the old unique constraint that blocks session-based entries
ALTER TABLE public.milk_entries 
DROP CONSTRAINT IF EXISTS unique_farmer_entry_per_day;

-- Fix user_center_assignments: Add INSERT policy for users to create their own assignments
CREATE POLICY "Users can create their own center assignments"
ON public.user_center_assignments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also add UPDATE policy so users can update their own assignments
CREATE POLICY "Users can update their own center assignments"
ON public.user_center_assignments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy so users can delete their own assignments if needed
CREATE POLICY "Users can delete their own center assignments"
ON public.user_center_assignments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);