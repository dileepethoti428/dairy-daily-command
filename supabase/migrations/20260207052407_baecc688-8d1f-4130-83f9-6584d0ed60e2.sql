-- Create pricing formula table
CREATE TABLE public.pricing_formula (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_center_id UUID REFERENCES public.collection_centers(id) ON DELETE CASCADE,
  fat_multiplier DECIMAL(10,4) NOT NULL DEFAULT 6,
  snf_multiplier DECIMAL(10,4) NOT NULL DEFAULT 2,
  constant_value DECIMAL(10,4) NOT NULL DEFAULT 6.8,
  mode TEXT NOT NULL DEFAULT 'hybrid' CHECK (mode IN ('manual', 'auto', 'hybrid')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pricing_formula ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admins can manage
CREATE POLICY "Admins can manage pricing formulas"
ON public.pricing_formula
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can view pricing formulas
CREATE POLICY "Authenticated users can view pricing formulas"
ON public.pricing_formula
FOR SELECT
TO authenticated
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_pricing_formula_updated_at
BEFORE UPDATE ON public.pricing_formula
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default global formula (null center_id = applies to all)
INSERT INTO public.pricing_formula (collection_center_id, fat_multiplier, snf_multiplier, constant_value, mode)
VALUES (NULL, 6, 2, 6.8, 'hybrid');