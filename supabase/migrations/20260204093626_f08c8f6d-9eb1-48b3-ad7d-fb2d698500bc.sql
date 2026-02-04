-- Create user_center_assignments table for mapping users to collection centers
CREATE TABLE public.user_center_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    center_id UUID NOT NULL REFERENCES public.collection_centers(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    assigned_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, center_id)
);

-- Enable RLS
ALTER TABLE public.user_center_assignments ENABLE ROW LEVEL SECURITY;

-- Create system_settings table for business/operational configuration
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    is_editable BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description, is_editable) VALUES
('business_info', '{"name": "MilkPro Dairy", "currency": "₹", "contact_email": "", "contact_phone": ""}', 'Business information for reports and PDFs', true),
('operational_settings', '{"default_unit": "Litres", "settlement_cycle_days": 15}', 'Operational settings for the application', false),
('pricing_config', '{"enabled": false, "rate_slabs": []}', 'Pricing configuration (Coming Soon)', false);

-- Add village_or_area column to collection_centers if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collection_centers' AND column_name = 'village_or_area') THEN
        ALTER TABLE public.collection_centers ADD COLUMN village_or_area TEXT;
    END IF;
END $$;

-- Create security definer function to get user's assigned center
CREATE OR REPLACE FUNCTION public.get_user_center(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT center_id FROM public.user_center_assignments 
    WHERE user_id = p_user_id AND is_primary = true
    LIMIT 1
$$;

-- Create security definer function to check if user has access to a center
CREATE OR REPLACE FUNCTION public.user_has_center_access(p_user_id UUID, p_center_id UUID)
RETURNS BOOLEAN
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

-- RLS Policies for user_center_assignments
-- Users can see their own assignments
CREATE POLICY "Users can view their own center assignments"
ON public.user_center_assignments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Only admins can manage center assignments
CREATE POLICY "Admins can manage center assignments"
ON public.user_center_assignments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for system_settings
-- All authenticated users can view system settings
CREATE POLICY "Authenticated users can view system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify system settings
CREATE POLICY "Admins can modify system settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') AND is_editable = true)
WITH CHECK (public.has_role(auth.uid(), 'admin') AND is_editable = true);

-- RLS Policies for collection_centers
-- Ensure collection_centers has RLS enabled
ALTER TABLE public.collection_centers ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active centers
CREATE POLICY "Authenticated users can view collection centers"
ON public.collection_centers
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage collection centers
CREATE POLICY "Admins can manage collection centers"
ON public.collection_centers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update timestamp trigger for new tables
CREATE TRIGGER update_user_center_assignments_updated_at
BEFORE UPDATE ON public.user_center_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();