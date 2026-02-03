-- Create collection_centers table for multi-center support
CREATE TABLE public.collection_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create farmers table linked to collection centers
CREATE TABLE public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES public.collection_centers(id) ON DELETE CASCADE NOT NULL,
  farmer_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (center_id, farmer_code)
);

-- Create settlements table for 15-day settlement periods
CREATE TABLE public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES public.collection_centers(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (center_id, start_date, end_date)
);

-- Create milk_entries table for daily milk collection
CREATE TABLE public.milk_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE NOT NULL,
  settlement_id UUID REFERENCES public.settlements(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session TEXT NOT NULL CHECK (session IN ('morning', 'evening')),
  quantity_liters DECIMAL(10,2) NOT NULL,
  fat_percentage DECIMAL(5,2),
  snf_percentage DECIMAL(5,2),
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.collection_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milk_entries ENABLE ROW LEVEL SECURITY;

-- Create secure has_role function (SECURITY DEFINER to prevent recursion)
-- Using existing app_role enum values: admin, user, agent, seller, rider
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for collection_centers (all authenticated users can view)
CREATE POLICY "Authenticated users can view centers"
  ON public.collection_centers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage centers"
  ON public.collection_centers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for farmers (using 'user' role for staff)
CREATE POLICY "Authenticated users can view farmers"
  ON public.farmers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users and admins can manage farmers"
  ON public.farmers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for settlements
CREATE POLICY "Authenticated users can view settlements"
  ON public.settlements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage settlements"
  ON public.settlements FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for milk_entries (using 'user' role for staff)
CREATE POLICY "Authenticated users can view milk entries"
  ON public.milk_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users and admins can manage milk entries"
  ON public.milk_entries FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to new tables
CREATE TRIGGER set_collection_centers_updated_at
  BEFORE UPDATE ON public.collection_centers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_farmers_updated_at
  BEFORE UPDATE ON public.farmers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_settlements_updated_at
  BEFORE UPDATE ON public.settlements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_milk_entries_updated_at
  BEFORE UPDATE ON public.milk_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();