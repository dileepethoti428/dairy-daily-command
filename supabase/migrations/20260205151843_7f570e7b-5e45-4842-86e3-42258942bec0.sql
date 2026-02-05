-- Create pricing slabs table for FAT/SNF based rate configuration
CREATE TABLE public.pricing_slabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_fat NUMERIC(5,2) NOT NULL,
  max_fat NUMERIC(5,2) NOT NULL,
  min_snf NUMERIC(5,2),
  max_snf NUMERIC(5,2),
  rate_per_litre NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_fat_range CHECK (max_fat >= min_fat),
  CONSTRAINT valid_snf_range CHECK (max_snf IS NULL OR min_snf IS NULL OR max_snf >= min_snf)
);

-- Enable Row Level Security
ALTER TABLE public.pricing_slabs ENABLE ROW LEVEL SECURITY;

-- Create policies - only admins can manage pricing slabs
CREATE POLICY "Admins can view all pricing slabs"
ON public.pricing_slabs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create pricing slabs"
ON public.pricing_slabs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pricing slabs"
ON public.pricing_slabs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pricing slabs"
ON public.pricing_slabs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pricing_slabs_updated_at
BEFORE UPDATE ON public.pricing_slabs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient lookups
CREATE INDEX idx_pricing_slabs_fat_range ON public.pricing_slabs (min_fat, max_fat);
CREATE INDEX idx_pricing_slabs_active ON public.pricing_slabs (is_active) WHERE is_active = true;